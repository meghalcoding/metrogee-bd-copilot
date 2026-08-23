"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { createMeetingAction } from "@/app/actions/meetings";
import { Button } from "@/components/ui/button";

type BusinessOption = { id: string; name: string };
type LeadOption = { id: string; name: string; businessId: string };
type OpportunityOption = { id: string; name: string; leadId: string };
type ContactOption = { id: string; name: string; businessId: string; email: string | null };

export function MeetingForm({
  businessId,
  leadId,
  opportunityId,
  contactId,
  businesses = [],
  leads = [],
  opportunities = [],
  contacts = [],
}: {
  businessId?: string;
  leadId?: string;
  opportunityId?: string;
  contactId?: string;
  businesses?: BusinessOption[];
  leads?: LeadOption[];
  opportunities?: OpportunityOption[];
  contacts?: ContactOption[];
}) {
  const router = useRouter();
  const [error, setError] = useState("");
  const [pending, setPending] = useState(false);
  const [selectedBusinessId, setSelectedBusinessId] = useState(businessId ?? "");
  const [selectedLeadId, setSelectedLeadId] = useState(leadId ?? "");
  const [selectedOpportunityId, setSelectedOpportunityId] = useState(opportunityId ?? "");
  const [selectedContactId, setSelectedContactId] = useState(contactId ?? "");

  const filteredLeads = leads.filter((lead) => lead.businessId === selectedBusinessId);
  const filteredOpportunities = opportunities.filter((item) => item.leadId === selectedLeadId);
  const filteredContacts = contacts.filter((item) => item.businessId === selectedBusinessId);

  function changeBusiness(value: string) {
    setSelectedBusinessId(value);
    setSelectedLeadId("");
    setSelectedOpportunityId("");
    setSelectedContactId("");
  }

  function changeLead(value: string) {
    setSelectedLeadId(value);
    setSelectedOpportunityId("");
  }

  async function submit(formData: FormData) {
    setPending(true);
    setError("");
    try {
      const startLocal = String(formData.get("start_at") || "");
      const endLocal = String(formData.get("end_at") || "");
      if (!startLocal || !endLocal) throw new Error("Meeting start and end are required.");

      await createMeetingAction({
        business_id: selectedBusinessId || null,
        lead_id: selectedLeadId || null,
        contact_id: selectedContactId || null,
        opportunity_id: selectedOpportunityId || null,
        title: String(formData.get("title") || ""),
        description: String(formData.get("description") || ""),
        location: String(formData.get("location") || ""),
        start_at: new Date(startLocal).toISOString(),
        end_at: new Date(endLocal).toISOString(),
        timezone: "Asia/Kolkata",
      });
      router.push("/meetings");
      router.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not schedule meeting.");
    } finally {
      setPending(false);
    }
  }

  return (
    <form action={submit} className="space-y-5 rounded-xl border border-border bg-surface p-5 sm:p-6">
      {error ? <div className="rounded-md border border-danger/20 bg-danger/5 px-3 py-2 text-sm text-danger">{error}</div> : null}
      <div className="rounded-lg border border-border bg-background p-4">
        <div className="mb-4"><div className="text-sm font-medium">Related to</div><div className="text-xs text-text-secondary">Choose a business first, then optionally narrow to its lead and opportunity.</div></div>
        <div className="grid gap-4 sm:grid-cols-2">
          <label className="space-y-2"><span className="block text-xs font-medium text-text-secondary">Business</span><select name="business_id" value={selectedBusinessId} onChange={(e) => changeBusiness(e.target.value)} className="h-10 w-full rounded-md border border-border bg-background px-3 text-sm"><option value="">Select a business...</option>{businesses.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}</select></label>
          <label className="space-y-2"><span className="block text-xs font-medium text-text-secondary">Contact</span><select name="contact_id" value={selectedContactId} onChange={(e) => setSelectedContactId(e.target.value)} disabled={!selectedBusinessId} className="h-10 w-full rounded-md border border-border bg-background px-3 text-sm disabled:opacity-60"><option value="">No contact selected</option>{filteredContacts.map((item) => <option key={item.id} value={item.id}>{item.name}{item.email ? ` — ${item.email}` : ""}</option>)}</select></label>
          <label className="space-y-2"><span className="block text-xs font-medium text-text-secondary">Lead</span><select name="lead_id" value={selectedLeadId} onChange={(e) => changeLead(e.target.value)} disabled={!selectedBusinessId} className="h-10 w-full rounded-md border border-border bg-background px-3 text-sm disabled:opacity-60"><option value="">No lead selected</option>{filteredLeads.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}</select></label>
          <label className="space-y-2"><span className="block text-xs font-medium text-text-secondary">Opportunity</span><select name="opportunity_id" value={selectedOpportunityId} onChange={(e) => setSelectedOpportunityId(e.target.value)} disabled={!selectedLeadId} className="h-10 w-full rounded-md border border-border bg-background px-3 text-sm disabled:opacity-60"><option value="">No opportunity selected</option>{filteredOpportunities.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}</select></label>
        </div>
      </div>

      <label className="space-y-2 block"><span className="block text-xs font-medium text-text-secondary">Title</span><input name="title" required className="h-10 w-full rounded-md border border-border bg-background px-3 text-sm" placeholder="Discovery call with decision maker" /></label>
      <div className="grid gap-5 sm:grid-cols-2">
        <label className="space-y-2"><span className="block text-xs font-medium text-text-secondary">Starts</span><input name="start_at" type="datetime-local" required className="h-10 w-full rounded-md border border-border bg-background px-3 text-sm" /></label>
        <label className="space-y-2"><span className="block text-xs font-medium text-text-secondary">Ends</span><input name="end_at" type="datetime-local" required className="h-10 w-full rounded-md border border-border bg-background px-3 text-sm" /></label>
      </div>
      <label className="space-y-2 block"><span className="block text-xs font-medium text-text-secondary">Location / meeting link</span><input name="location" className="h-10 w-full rounded-md border border-border bg-background px-3 text-sm" placeholder="Office, phone, Google Meet link, etc." /></label>
      <label className="space-y-2 block"><span className="block text-xs font-medium text-text-secondary">Description / agenda</span><textarea name="description" rows={4} className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm" placeholder="Purpose, agenda, questions to cover..." /></label>
      <div className="rounded-md bg-surface-muted px-3 py-2 text-xs text-text-secondary">Timezone: Asia/Kolkata (India). The CRM stores meeting times in UTC and exports them to calendar formats.</div>
      <Button disabled={pending}>{pending ? "Scheduling..." : "Schedule meeting"}</Button>
    </form>
  );
}
