"use client";

import { useRef, useState } from "react";
import { createActivityAction } from "@/app/actions/activities";
import { ACTIVITY_DIRECTIONS, ACTIVITY_TYPES, type ActivityInput } from "@/lib/domains/activities/types";
import { Button } from "@/components/ui/button";

export function ActivityForm({
  businessId,
  leadId,
  contactId,
  opportunityId,
}: {
  businessId?: string;
  leadId?: string;
  contactId?: string;
  opportunityId?: string;
}) {
  const formRef = useRef<HTMLFormElement>(null);
  const [error, setError] = useState("");
  const [pending, setPending] = useState(false);

  async function submit(formData: FormData) {
    setPending(true);
    setError("");
    try {
      const input: ActivityInput = {
        business_id: businessId,
        lead_id: leadId,
        contact_id: contactId,
        opportunity_id: opportunityId,
        type: formData.get("type") as ActivityInput["type"],
        direction: (formData.get("direction") as ActivityInput["direction"]) || null,
        subject: String(formData.get("subject") || ""),
        body_preview: String(formData.get("body_preview") || ""),
        occurred_at: new Date(String(formData.get("occurred_at"))).toISOString(),
      };
      await createActivityAction(input);
      formRef.current?.reset();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not record activity.");
    } finally {
      setPending(false);
    }
  }

  return (
    <form ref={formRef} action={submit} className="space-y-4">
      {error ? <div className="rounded-md border border-danger/20 bg-danger/5 px-3 py-2 text-sm text-danger">{error}</div> : null}
      <div className="grid gap-4 sm:grid-cols-3">
        <label className="space-y-2"><span className="block text-xs font-medium text-text-secondary">Type</span><select name="type" defaultValue="CALL" className="h-10 w-full rounded-md border border-border bg-background px-3 text-sm">{ACTIVITY_TYPES.map((v) => <option key={v}>{v}</option>)}</select></label>
        <label className="space-y-2"><span className="block text-xs font-medium text-text-secondary">Direction</span><select name="direction" defaultValue="" className="h-10 w-full rounded-md border border-border bg-background px-3 text-sm"><option value="">Not specified</option>{ACTIVITY_DIRECTIONS.map((v) => <option key={v}>{v}</option>)}</select></label>
        <label className="space-y-2"><span className="block text-xs font-medium text-text-secondary">Occurred</span><input name="occurred_at" type="datetime-local" defaultValue={new Date().toISOString().slice(0, 16)} className="h-10 w-full rounded-md border border-border bg-background px-3 text-sm" required /></label>
      </div>
      <input name="subject" className="h-10 w-full rounded-md border border-border bg-background px-3 text-sm" placeholder="Subject" />
      <textarea name="body_preview" rows={3} className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm" placeholder="What happened?" />
      <Button disabled={pending}>{pending ? "Saving…" : "Record activity"}</Button>
    </form>
  );
}
