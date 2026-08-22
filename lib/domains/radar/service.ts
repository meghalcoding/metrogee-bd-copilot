import { listBusinesses } from "@/lib/domains/businesses/service";
import { listLeads } from "@/lib/domains/leads/service";
import { listOpportunities } from "@/lib/domains/opportunities/service";
import type { RadarBusiness, RadarSummary, RadarSignal } from "./types";

const WEBSITE_GAP_STATUSES = new Set(["WU", "W0"]);

export async function listRadarBusinesses(organizationId: string): Promise<RadarBusiness[]> {
  const [businesses, leads, opportunities] = await Promise.all([
    listBusinesses(organizationId),
    listLeads(organizationId),
    listOpportunities(organizationId),
  ]);

  const leadByBusiness = new Map<string, (typeof leads)[number]>();
  for (const lead of leads) leadByBusiness.set(lead.business_id, lead);

  const openOpportunityCounts = new Map<string, number>();
  for (const opportunity of opportunities) {
    if (opportunity.status !== "OPEN") continue;
    const businessId = opportunity.lead?.business?.id;
    if (businessId) openOpportunityCounts.set(businessId, (openOpportunityCounts.get(businessId) ?? 0) + 1);
  }

  return businesses
    .map((business): RadarBusiness => {
      const lead = leadByBusiness.get(business.id);
      const openOpportunityCount = openOpportunityCounts.get(business.id) ?? 0;
      const signals: RadarSignal[] = [];

      if (!lead) signals.push("NO_LEAD");
      if (WEBSITE_GAP_STATUSES.has(business.website_status)) signals.push("WEBSITE_GAP");
      if (!business.phone && !business.email) signals.push("CONTACT_GAP");
      if (lead && (lead.stage === "NEW" || lead.stage === "QUALIFYING")) signals.push("QUALIFYING_LEAD");
      if (openOpportunityCount > 0) signals.push("ACTIVE_OPPORTUNITY");

      return {
        id: business.id,
        name: business.name,
        city: business.city,
        state: business.state,
        website_status: business.website_status,
        website_url: business.website_url,
        phone: business.phone,
        email: business.email,
        rating: business.rating,
        review_count: business.review_count,
        lead_id: lead?.id ?? null,
        lead_stage: lead?.stage ?? null,
        open_opportunity_count: openOpportunityCount,
        signals,
        signal_count: signals.length,
      };
    })
    .sort((a, b) => b.signal_count - a.signal_count || a.name.localeCompare(b.name));
}

export async function getRadarSummary(organizationId: string): Promise<RadarSummary> {
  const businesses = await listRadarBusinesses(organizationId);

  return {
    businesses: businesses.length,
    unworked: businesses.filter((item) => item.signals.includes("NO_LEAD")).length,
    websiteGaps: businesses.filter((item) => item.signals.includes("WEBSITE_GAP")).length,
    contactGaps: businesses.filter((item) => item.signals.includes("CONTACT_GAP")).length,
    qualifyingLeads: businesses.filter((item) => item.signals.includes("QUALIFYING_LEAD")).length,
    activeOpportunities: businesses.filter((item) => item.signals.includes("ACTIVE_OPPORTUNITY")).length,
  };
}
