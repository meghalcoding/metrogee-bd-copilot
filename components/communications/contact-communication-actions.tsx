"use client";

import { useState } from "react";
import { MessageCircle, Phone, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { recordCommunicationAction } from "@/app/actions/communications";

type Props = {
  contactId: string;
  contactName: string;
  phone?: string | null;
  whatsappPhone?: string | null;
  leadId?: string;
};

const CALL_OUTCOMES = [
  ["CONNECTED", "Connected"],
  ["NO_ANSWER", "No answer"],
  ["BUSY", "Busy"],
  ["VOICEMAIL", "Voicemail"],
  ["WRONG_NUMBER", "Wrong number"],
  ["CALLBACK_REQUESTED", "Callback requested"],
  ["NOT_INTERESTED", "Not interested"],
] as const;

const WHATSAPP_OUTCOMES = [
  ["SENT", "Sent"],
  ["DELIVERED", "Delivered"],
  ["REPLIED", "Replied"],
  ["NO_RESPONSE", "No response"],
  ["WRONG_NUMBER", "Wrong number"],
] as const;

function whatsappDigits(value: string) {
  const digits = value.replace(/[^\d]/g, "");
  if (digits.length === 10) return `91${digits}`;
  if (digits.length === 11 && digits.startsWith("0")) return `91${digits.slice(1)}`;
  return digits;
}

export function ContactCommunicationActions({
  contactId,
  contactName,
  phone,
  whatsappPhone,
  leadId,
}: Props) {
  const [kind, setKind] = useState<"CALL" | "WHATSAPP" | null>(null);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [notes, setNotes] = useState("");

  const selectedNumber = kind === "WHATSAPP" ? whatsappPhone : phone;
  const outcomes = kind === "WHATSAPP" ? WHATSAPP_OUTCOMES : CALL_OUTCOMES;

  function openRecorder(nextKind: "CALL" | "WHATSAPP") {
    setKind(nextKind);
    setError("");
    setMessage("");
    setNotes("");
  }

  async function record(outcome: string) {
    if (!kind) return;
    setPending(true);
    setError("");
    try {
      await recordCommunicationAction({
        contactId,
        leadId,
        kind,
        outcome,
        notes,
      });
      setMessage(`${kind === "CALL" ? "Call" : "WhatsApp"} activity recorded.`);
      setTimeout(() => setKind(null), 800);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Could not record communication.");
    } finally {
      setPending(false);
    }
  }

  return (
    <>
      <div className="flex flex-wrap items-center gap-2">
        {phone ? (
          <Button asChild size="sm" variant="secondary">
            <a href={`tel:${phone}`}>
              <Phone className="size-4" />
              Call
            </a>
          </Button>
        ) : null}
        {phone ? (
          <Button size="sm" variant="ghost" onClick={() => openRecorder("CALL")}>
            Record call
          </Button>
        ) : null}
        {whatsappPhone ? (
          <Button asChild size="sm" variant="secondary">
            <a
              href={`https://wa.me/${whatsappDigits(whatsappPhone)}`}
              target="_blank"
              rel="noreferrer"
            >
              <MessageCircle className="size-4" />
              WhatsApp
            </a>
          </Button>
        ) : null}
        {whatsappPhone ? (
          <Button size="sm" variant="ghost" onClick={() => openRecorder("WHATSAPP")}>
            Record WhatsApp
          </Button>
        ) : null}
      </div>

      {kind ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" role="dialog" aria-modal="true">
          <div className="w-full max-w-lg rounded-xl border border-border bg-surface p-5 shadow-xl">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h2 className="font-semibold">
                  Record {kind === "CALL" ? "call" : "WhatsApp"} outcome
                </h2>
                <p className="mt-1 text-xs text-text-secondary">
                  {contactName}{selectedNumber ? ` · ${selectedNumber}` : ""}
                </p>
              </div>
              <button type="button" onClick={() => setKind(null)} aria-label="Close">
                <X className="size-5" />
              </button>
            </div>

            <div className="mt-5 grid gap-2 sm:grid-cols-2">
              {outcomes.map(([value, label]) => (
                <Button
                  key={value}
                  type="button"
                  variant="secondary"
                  disabled={pending}
                  onClick={() => record(value)}
                >
                  {label}
                </Button>
              ))}
            </div>

            <textarea
              value={notes}
              onChange={(event) => setNotes(event.target.value)}
              rows={3}
              placeholder="Optional notes"
              className="mt-4 w-full rounded-md border border-border bg-background px-3 py-2 text-sm"
            />

            {error ? <p className="mt-3 text-sm text-danger">{error}</p> : null}
            {message ? <p className="mt-3 text-sm text-success">{message}</p> : null}
            {pending ? <p className="mt-3 text-xs text-text-muted">Saving activity...</p> : null}
          </div>
        </div>
      ) : null}
    </>
  );
}
