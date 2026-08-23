import nodemailer from "nodemailer";
import { createClient } from "@/lib/supabase/server";
import { decryptSecret, encryptSecret } from "./secret";
import type { SmtpConfig, SmtpSecurity } from "./types";

const PROVIDER = "CUSTOM_SMTP" as const;

function clean(value: string, label: string) {
  const result = value.trim();
  if (!result) throw new Error(`${label} is required.`);
  return result;
}

function validateConfig(input: SmtpConfig) {
  const host = clean(input.host, "SMTP host");
  const username = clean(input.username, "SMTP username");
  const password = clean(input.password, "SMTP password or key");
  const fromName = clean(input.fromName, "From name");
  const fromEmail = clean(input.fromEmail, "From email");
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(fromEmail)) throw new Error("From email is invalid.");
  if (!Number.isInteger(input.port) || input.port < 1 || input.port > 65535) throw new Error("SMTP port must be between 1 and 65535.");
  if (!["STARTTLS", "TLS", "NONE"].includes(input.security)) throw new Error("Unsupported SMTP security mode.");
  return { host, port: input.port, security: input.security, username, password, fromName, fromEmail };
}

function transportFor(config: SmtpConfig) {
  return nodemailer.createTransport({
    host: config.host,
    port: config.port,
    secure: config.security === "TLS",
    requireTLS: config.security === "STARTTLS",
    auth: { user: config.username, pass: config.password },
    connectionTimeout: 10000,
    greetingTimeout: 10000,
    socketTimeout: 15000,
  });
}

function redactConfig(config: SmtpConfig) {
  return {
    host: config.host,
    port: config.port,
    security: config.security,
    username: config.username,
    fromName: config.fromName,
    fromEmail: config.fromEmail,
    password: encryptSecret(config.password),
  };
}

function decryptConfig(raw: Record<string, unknown>): SmtpConfig {
  const password = typeof raw.password === "string" ? decryptSecret(raw.password) : "";
  return {
    host: String(raw.host ?? ""),
    port: Number(raw.port ?? 587),
    security: (String(raw.security ?? "STARTTLS") as SmtpSecurity),
    username: String(raw.username ?? ""),
    password,
    fromName: String(raw.fromName ?? ""),
    fromEmail: String(raw.fromEmail ?? ""),
  };
}

export async function testSmtpConfig(input: SmtpConfig) {
  const config = validateConfig(input);
  const transporter = transportFor(config);
  try {
    await transporter.verify();
    return { ok: true as const, message: "SMTP connection and authentication succeeded." };
  } finally {
    transporter.close();
  }
}

export async function saveSmtpConfig(organizationId: string, input: SmtpConfig) {
  const config = validateConfig(input);
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("organization_integrations")
    .upsert(
      {
        organization_id: organizationId,
        type: "EMAIL",
        provider: PROVIDER,
        display_name: "Custom SMTP",
        enabled: true,
        status: "CONNECTED",
        config_json: redactConfig(config),
        last_error: null,
        connected_at: new Date().toISOString(),
      },
      { onConflict: "organization_id,provider" },
    )
    .select("*")
    .single();

  if (error) throw error;
  return { ...data, config_json: {} };
}

export async function sendSmtpEmail(
  organizationId: string,
  input: { to: string; subject: string; text: string; html?: string | null },
) {
  const supabase = await createClient();
  const { data: row, error } = await supabase
    .from("organization_integrations")
    .select("*")
    .eq("organization_id", organizationId)
    .eq("provider", PROVIDER)
    .eq("enabled", true)
    .eq("status", "CONNECTED")
    .maybeSingle();

  if (error) throw error;
  if (!row) throw new Error("Custom SMTP is not connected. Configure it under Integrations first.");

  const config = decryptConfig((row.config_json ?? {}) as Record<string, unknown>);
  const transporter = transportFor(config);

  try {
    const info = await transporter.sendMail({
      from: { name: config.fromName, address: config.fromEmail },
      to: clean(input.to, "Recipient email"),
      subject: clean(input.subject, "Subject"),
      text: input.text,
      html: input.html ?? undefined,
    });

    await supabase
      .from("organization_integrations")
      .update({ last_used_at: new Date().toISOString(), last_error: null })
      .eq("id", row.id);

    return { messageId: info.messageId };
  } catch (error) {
    const message = error instanceof Error ? error.message : "SMTP send failed.";
    await supabase
      .from("organization_integrations")
      .update({ status: "ERROR", last_error: message.slice(0, 500) })
      .eq("id", row.id);
    throw new Error(`Email could not be sent: ${message}`);
  } finally {
    transporter.close();
  }
}
