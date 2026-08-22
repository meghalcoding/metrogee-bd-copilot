"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { createLeadAction, updateLeadAction } from "@/app/actions/leads";
import type { LeadInput, LeadRecord } from "@/lib/domains/leads/types";
import { LEAD_STAGES, LEAD_STATUSES, QUALIFICATION_STATUSES } from "@/lib/domains/leads/types";

export function LeadForm({ businessId, lead }: { businessId?: string; lead?: LeadRecord }) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  const [stage, setStage] = useState(lead?.stage ?? "NEW");
  const [status, setStatus] = useState(lead?.status ?? "ACTIVE");
  const [qualification, setQualification] = useState(lead?.qualification_status ?? "UNQUALIFIED");

  async function submit(formData: FormData) {
    setPending(true); setError(null);
    const input: LeadInput = {
      business_id: businessId ?? lead?.business_id ?? "",
      primary_contact_id: lead?.primary_contact_id ?? (String(formData.get("primary_contact_id") || "") || null),
      stage: stage as LeadInput["stage"],
      status: status as LeadInput["status"],
      qualification_status: qualification as LeadInput["qualification_status"],
      source: String(formData.get("source") || "") || null,
      opportunity_score: Number(formData.get("opportunity_score") || 0) || null,
      priority_score: Number(formData.get("priority_score") || 0) || null,
      next_action_at: String(formData.get("next_action_at") || "") || null,
      lost_reason: String(formData.get("lost_reason") || "") || null,
    };
    try {
      if (lead) await updateLeadAction(lead.id, input);
      else await createLeadAction(input);
      router.push(lead ? `/leads/${lead.id}` : "/leads");
      router.refresh();
    } catch (e) { setError(e instanceof Error ? e.message : "Unable to save lead."); }
    finally { setPending(false); }
  }

  return (
    <form action={submit} className="space-y-6 rounded-xl border border-border bg-surface p-5 sm:p-6">
      {error && <div className="rounded-md border border-danger/20 bg-danger/5 px-3 py-2 text-sm text-danger">{error}</div>}
      <div className="grid gap-5 sm:grid-cols-2">
        <Field label="Stage"><Select value={stage} onChange={(e) => setStage(e.target.value as NonNullable<LeadInput["stage"]>)} name="stage">{LEAD_STAGES.map((v) => <option key={v}>{v}</option>)}</Select></Field>
        <Field label="Operational status"><Select value={status} onChange={(e) => setStatus(e.target.value as NonNullable<LeadInput["status"]>)} name="status">{LEAD_STATUSES.map((v) => <option key={v}>{v}</option>)}</Select></Field>
        <Field label="Qualification"><Select value={qualification} onChange={(e) => setQualification(e.target.value as NonNullable<LeadInput["qualification_status"]>)} name="qualification_status">{QUALIFICATION_STATUSES.map((v) => <option key={v}>{v}</option>)}</Select></Field>
        <Field label="Source"><Input name="source" defaultValue={lead?.source ?? ""} placeholder="Manual, referral, import..." /></Field>
        <Field label="Opportunity score (0â€“100)"><Input name="opportunity_score" type="number" min="0" max="100" defaultValue={lead?.opportunity_score ?? ""} /></Field>
        <Field label="Priority score (0â€“100)"><Input name="priority_score" type="number" min="0" max="100" defaultValue={lead?.priority_score ?? ""} /></Field>
        <Field label="Next action"><Input name="next_action_at" type="datetime-local" defaultValue={lead?.next_action_at ? lead.next_action_at.slice(0,16) : ""} /></Field>
        <Field label="Lost reason"><Input name="lost_reason" defaultValue={lead?.lost_reason ?? ""} placeholder="Required for LOST" /></Field>
      </div>
      <div className="flex justify-end gap-3"><Button type="button" variant="secondary" onClick={() => router.back()}>Cancel</Button><Button disabled={pending}>{pending ? "Savingâ€¦" : lead ? "Save changes" : "Create lead"}</Button></div>
    </form>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) { return <label className="space-y-2"><span className="block text-xs font-medium text-text-secondary">{label}</span>{children}</label>; }


