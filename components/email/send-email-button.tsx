"use client";

import { useState } from "react";
import { Mail, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { sendEmailAction } from "@/app/actions/email";

export function SendEmailButton({ contactId, contactName, email, leadId }: { contactId: string; contactName: string; email: string; leadId?: string }) {
  const [open, setOpen] = useState(false);
  const [subject, setSubject] = useState("");
  const [body, setBody] = useState("");
  const [pending, setPending] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  async function send() {
    setPending(true); setError(""); setMessage("");
    try {
      await sendEmailAction({ contactId, leadId, subject, body });
      setMessage("Email sent and CRM activity recorded.");
      setSubject(""); setBody("");
      setTimeout(() => setOpen(false), 900);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not send email.");
    } finally { setPending(false); }
  }

  return (
    <>
      <Button size="sm" variant="secondary" onClick={() => { setOpen(true); setError(""); setMessage(""); }}>
        <Mail className="size-4" />Email
      </Button>
      {open ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" role="dialog" aria-modal="true">
          <div className="w-full max-w-2xl rounded-xl border border-border bg-surface p-5 shadow-xl">
            <div className="flex items-center justify-between">
              <div><h2 className="font-semibold">Send email</h2><p className="mt-1 text-xs text-text-secondary">To {contactName} · {email}</p></div>
              <button type="button" onClick={() => setOpen(false)} aria-label="Close"><X className="size-5" /></button>
            </div>
            <div className="mt-5 space-y-4">
              <input value={subject} onChange={(e) => setSubject(e.target.value)} placeholder="Subject" className="h-10 w-full rounded-md border border-border bg-background px-3 text-sm" />
              <textarea value={body} onChange={(e) => setBody(e.target.value)} rows={8} placeholder="Write your message..." className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm" />
              {error ? <p className="text-sm text-danger">{error}</p> : null}
              {message ? <p className="text-sm text-success">{message}</p> : null}
              <div className="flex justify-end gap-2"><Button type="button" variant="secondary" onClick={() => setOpen(false)}>Cancel</Button><Button type="button" disabled={pending} onClick={send}>{pending ? "Sending..." : "Send email"}</Button></div>
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}
