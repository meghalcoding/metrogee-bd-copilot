"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { createContactAction, updateContactAction } from "@/app/actions/contacts";
import type { ContactInput, ContactRecord } from "@/lib/domains/contacts/types";

export function ContactForm({ businessId, initial, onCancel }: { businessId: string; initial?: ContactRecord; onCancel?: () => void }) {
  const router = useRouter();
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");
  const [fullName, setFullName] = useState(initial?.full_name ?? "");
  const [jobTitle, setJobTitle] = useState(initial?.job_title ?? "");
  const [email, setEmail] = useState(initial?.email ?? "");
  const [phone, setPhone] = useState(initial?.phone ?? "");
  const [whatsapp, setWhatsapp] = useState(initial?.whatsapp_phone ?? "");
  const [channel, setChannel] = useState(initial?.preferred_channel ?? "");

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPending(true);
    setError("");

    const input: ContactInput = {
      full_name: fullName,
      job_title: jobTitle || null,
      email: email || null,
      phone: phone || null,
      whatsapp_phone: whatsapp || null,
      preferred_channel: channel ? channel as ContactInput["preferred_channel"] : null,
    };

    try {
      if (initial) {
        await updateContactAction(initial.id, businessId, input);
      } else {
        await createContactAction(businessId, input);
      }
      onCancel?.();
      router.refresh();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Unable to save contact.");
      setPending(false);
    }
  }

  return (
    <form onSubmit={submit} className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Full name" required><Input value={fullName} onChange={(e) => setFullName(e.target.value)} required /></Field>
        <Field label="Job title"><Input value={jobTitle} onChange={(e) => setJobTitle(e.target.value)} /></Field>
        <Field label="Email"><Input value={email} onChange={(e) => setEmail(e.target.value)} type="email" /></Field>
        <Field label="Phone"><Input value={phone} onChange={(e) => setPhone(e.target.value)} /></Field>
        <Field label="WhatsApp"><Input value={whatsapp} onChange={(e) => setWhatsapp(e.target.value)} /></Field>
        <Field label="Preferred channel">
          <select value={channel} onChange={(e) => setChannel(e.target.value)} className="h-10 w-full rounded-md border border-border bg-surface px-3 text-sm text-foreground shadow-sm outline-none transition-colors placeholder:text-text-muted focus:border-primary focus:ring-2 focus:ring-primary/15 disabled:cursor-not-allowed disabled:opacity-70">
            <option value="">Not specified</option>
            <option value="PHONE">Phone</option>
            <option value="EMAIL">Email</option>
            <option value="WHATSAPP">WhatsApp</option>
            <option value="OTHER">Other</option>
          </select>
        </Field>
      </div>
      {error ? <p className="rounded-md border border-danger/20 bg-danger/5 px-3 py-2 text-sm text-danger">{error}</p> : null}
      <div className="flex justify-end gap-2">
        {onCancel ? <Button type="button" variant="secondary" onClick={onCancel}>Cancel</Button> : null}
        <Button type="submit" disabled={pending}>{pending ? "Saving..." : initial ? "Save contact" : "Add contact"}</Button>
      </div>
    </form>
  );
}

function Field({ label, required, children }: { label: string; required?: boolean; children: React.ReactNode }) {
  return <div className="space-y-2"><label className="text-sm font-medium text-foreground">{label}{required ? " *" : ""}</label>{children}</div>;
}
