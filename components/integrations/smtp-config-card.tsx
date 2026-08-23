"use client";

import { useState } from "react";
import { saveSmtpConfigAction, testSmtpConfigAction } from "@/app/actions/integrations";
import { Button } from "@/components/ui/button";

export function SmtpConfigCard({ configured }: { configured: boolean }) {
  const [pending, setPending] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  async function submit(formData: FormData, testOnly: boolean) {
    setPending(true);
    setMessage("");
    setError("");
    try {
      const input = {
        host: String(formData.get("host") || ""),
        port: Number(formData.get("port") || 587),
        security: String(formData.get("security") || "STARTTLS") as "STARTTLS" | "TLS" | "NONE",
        username: String(formData.get("username") || ""),
        password: String(formData.get("password") || ""),
        fromName: String(formData.get("fromName") || ""),
        fromEmail: String(formData.get("fromEmail") || ""),
      };
      if (testOnly) {
        const result = await testSmtpConfigAction(input);
        setMessage(result.message);
      } else {
        await saveSmtpConfigAction(input);
        setMessage("SMTP configuration saved and connected.");
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "SMTP operation failed.");
    } finally {
      setPending(false);
    }
  }

  return (
    <form className="mt-5 space-y-4" action={(fd) => submit(fd, false)}>
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="SMTP host" name="host" placeholder="smtp.example.com" />
        <Field label="Port" name="port" type="number" defaultValue="587" />
        <label className="space-y-2">
          <span className="block text-xs font-medium text-text-secondary">Security</span>
          <select name="security" defaultValue="STARTTLS" className="h-10 w-full rounded-md border border-border bg-background px-3 text-sm">
            <option value="STARTTLS">STARTTLS (587)</option>
            <option value="TLS">TLS / SSL (465)</option>
            <option value="NONE">None</option>
          </select>
        </label>
        <Field label="Username" name="username" autoComplete="username" />
        <Field label="SMTP password / key" name="password" type="password" autoComplete="new-password" />
        <Field label="From name" name="fromName" placeholder="Metrogee BD Copilot" />
        <Field label="From email" name="fromEmail" type="email" placeholder="sales@example.com" />
      </div>
      <p className="text-xs text-text-muted">Credentials are encrypted before storage. They are never returned to the browser after saving.</p>
      {error ? <p className="text-sm text-danger">{error}</p> : null}
      {message ? <p className="text-sm text-success">{message}</p> : null}
      <div className="flex flex-wrap gap-2">
        <Button type="submit" disabled={pending}>{pending ? "Saving..." : configured ? "Update SMTP" : "Save & connect"}</Button>
        <Button type="button" variant="secondary" disabled={pending} onClick={(event) => {
          const form = event.currentTarget.form;
          if (form) void submit(new FormData(form), true);
        }}>{pending ? "Testing..." : "Test connection"}</Button>
      </div>
    </form>
  );
}

function Field({ label, name, type = "text", defaultValue = "", placeholder, autoComplete }: { label: string; name: string; type?: string; defaultValue?: string; placeholder?: string; autoComplete?: string }) {
  return (
    <label className="space-y-2">
      <span className="block text-xs font-medium text-text-secondary">{label}</span>
      <input name={name} type={type} defaultValue={defaultValue} placeholder={placeholder} autoComplete={autoComplete} required className="h-10 w-full rounded-md border border-border bg-background px-3 text-sm" />
    </label>
  );
}
