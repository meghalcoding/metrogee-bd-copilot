"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { createOpportunityAction, updateOpportunityAction } from "@/app/actions/opportunities";
import type { OpportunityInput, OpportunityRecord } from "@/lib/domains/opportunities/types";
import { OPPORTUNITY_STAGES, OPPORTUNITY_STATUSES } from "@/lib/domains/opportunities/types";

export function OpportunityForm({ leadId, opportunity }: { leadId: string; opportunity?: OpportunityRecord }) {
  const router = useRouter();
  const [stage, setStage] = useState(opportunity?.stage ?? "DISCOVERY");
  const [status, setStatus] = useState(opportunity?.status ?? "OPEN");
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  async function submit(formData: FormData) {
    setPending(true);
    setError(null);
    const input: OpportunityInput = {
      lead_id: leadId,
      name: String(formData.get("name") || ""),
      value_amount: Number(formData.get("value_amount") || 0) || null,
      currency: String(formData.get("currency") || "INR"),
      probability: Number(formData.get("probability") || 0) || null,
      expected_close_date: String(formData.get("expected_close_date") || "") || null,
      stage: stage as OpportunityInput["stage"],
      status: status as OpportunityInput["status"],
      lost_reason: String(formData.get("lost_reason") || "") || null,
    };
    try {
      if (opportunity) await updateOpportunityAction(opportunity.id, input);
      else await createOpportunityAction(input);
      router.push(opportunity ? `/opportunities/${opportunity.id}` : `/leads/${leadId}`);
      router.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Unable to save opportunity.");
    } finally {
      setPending(false);
    }
  }

  return <form action={submit} className="space-y-6 rounded-xl border border-border bg-surface p-5 sm:p-6">
    {error && <div className="rounded-md border border-danger/20 bg-danger/5 px-3 py-2 text-sm text-danger">{error}</div>}
    <div className="grid gap-5 sm:grid-cols-2">
      <Field label="Opportunity name"><Input name="name" required defaultValue={opportunity?.name ?? ""} placeholder="Website redesign project" /></Field>
      <Field label="Currency"><Input name="currency" defaultValue={opportunity?.currency ?? "INR"} maxLength={3} /></Field>
      <Field label="Estimated value"><Input name="value_amount" type="number" min="0" step="0.01" defaultValue={opportunity?.value_amount ?? ""} /></Field>
      <Field label="Probability (0–100)"><Input name="probability" type="number" min="0" max="100" defaultValue={opportunity?.probability ?? ""} /></Field>
      <Field label="Expected close"><Input name="expected_close_date" type="date" defaultValue={opportunity?.expected_close_date ?? ""} /></Field>
      <Field label="Pipeline stage"><Select value={stage} onChange={(e) => setStage(e.target.value as NonNullable<OpportunityInput["stage"]>)}>{OPPORTUNITY_STAGES.map((v) => <option key={v}>{v}</option>)}</Select></Field>
      {opportunity ? <Field label="Status"><Select value={status} onChange={(e) => setStatus(e.target.value as NonNullable<OpportunityInput["status"]>)}>{OPPORTUNITY_STATUSES.map((v) => <option key={v}>{v}</option>)}</Select></Field> : null}
      {opportunity && status === "LOST" ? <Field label="Lost reason"><Input name="lost_reason" required defaultValue={opportunity?.lost_reason ?? ""} placeholder="Budget, timing, competitor..." /></Field> : null}
    </div>
    <p className="text-xs text-text-secondary">Stage is the deal&apos;s progress. Status is whether the deal is open, on hold, won or lost. A closed opportunity can be reopened if it was recorded incorrectly.</p>
    <div className="flex justify-end gap-3"><Button type="button" variant="secondary" onClick={() => router.back()}>Cancel</Button><Button disabled={pending}>{pending ? "Saving..." : opportunity ? "Save changes" : "Create opportunity"}</Button></div>
  </form>;
}

function Field({ label, children }: { label: string; children: React.ReactNode }) { return <label className="space-y-2"><span className="block text-xs font-medium text-text-secondary">{label}</span>{children}</label>; }
