import Link from "next/link";
import { AppShell } from "@/components/layout/app-shell";
import { MeetingForm } from "@/components/meetings/meeting-form";
import { getCurrentOrganization } from "@/lib/domains/organizations/current";
import { listBusinesses } from "@/lib/domains/businesses/service";
import { listLeads } from "@/lib/domains/leads/service";
import { listOpportunities } from "@/lib/domains/opportunities/service";
import { listContacts } from "@/lib/domains/contacts/service";

export default async function NewMeetingPage({ searchParams }: { searchParams: Promise<{ business?: string; lead?: string; opportunity?: string; contact?: string }> }) {
  const params = await searchParams;
  const organization = await getCurrentOrganization();
  if (!organization) return null;

  const [businesses, leads, opportunities] = await Promise.all([
    listBusinesses(organization.id),
    listLeads(organization.id),
    listOpportunities(organization.id),
  ]);

  const allContacts = (await Promise.all(businesses.map((business) => listContacts(organization.id, business.id)))).flat();

  return (
    <AppShell>
      <div className="mx-auto max-w-3xl space-y-6">
        <Link href="/meetings" className="text-sm font-medium text-text-secondary hover:text-foreground">← Meetings</Link>
        <div><h1>Schedule meeting</h1><p className="mt-2 text-sm text-text-secondary">Create the CRM meeting record, then add it to Google Calendar, Outlook, or any calendar that supports .ics.</p></div>
        <MeetingForm
          businessId={params.business}
          leadId={params.lead}
          opportunityId={params.opportunity}
          contactId={params.contact}
          businesses={businesses.map((item) => ({ id: item.id, name: item.name }))}
          leads={leads.map((item) => ({ id: item.id, name: `${item.business?.name ?? "Lead"} — ${item.stage ?? "NEW"}`, businessId: item.business_id }))}
          opportunities={opportunities.map((item) => ({ id: item.id, name: item.name, leadId: item.lead_id }))}
          contacts={allContacts.map((item) => ({ id: item.id, name: item.full_name, businessId: item.business_id, email: item.email }))}
        />
      </div>
    </AppShell>
  );
}
