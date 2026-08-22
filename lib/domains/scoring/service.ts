import { listActivities } from "@/lib/domains/activities/service";
import { listBusinesses } from "@/lib/domains/businesses/service";
import { listLeads } from "@/lib/domains/leads/service";
import { listOpportunities } from "@/lib/domains/opportunities/service";
import { listTasks } from "@/lib/domains/tasks/service";
import type { LeadScore, ScoreFactor } from "./types";

function clamp(value: number, min = 0, max = 100) {
  return Math.max(min, Math.min(max, value));
}

function labelFor(score: number): LeadScore["label"] {
  if (score >= 80) return "VERY_HIGH";
  if (score >= 60) return "HIGH";
  if (score >= 35) return "MEDIUM";
  return "LOW";
}

export function calculateLeadScore(input: {
  rating?: number | null;
  review_count?: number | null;
  website_status?: string | null;
  phone?: string | null;
  email?: string | null;
  stage: string;
  qualification_status: string;
  priority_score?: number | null;
  opportunity_score?: number | null;
  last_contacted_at?: string | null;
  open_task_count?: number;
  open_opportunity_count?: number;
}): LeadScore {
  const factors: ScoreFactor[] = [];
  let score = 0;

  const ratingPoints = input.rating != null ? Math.round(clamp(input.rating / 5) * 15) : 0;
  if (ratingPoints) { score += ratingPoints; factors.push({ key: "rating", label: "Strong rating", points: ratingPoints, explanation: `${input.rating}/5 rating contributes to commercial fit.` }); }
  const reviews = input.review_count ?? 0;
  const reviewPoints = reviews >= 500 ? 15 : reviews >= 250 ? 12 : reviews >= 100 ? 9 : reviews >= 25 ? 5 : reviews > 0 ? 2 : 0;
  if (reviewPoints) { score += reviewPoints; factors.push({ key: "reviews", label: "Meaningful review volume", points: reviewPoints, explanation: `${reviews.toLocaleString()} reviews indicate established market activity.` }); }
  if (input.website_status === "WU" || input.website_status === "W0") { score += 20; factors.push({ key: "website_gap", label: "Website gap", points: 20, explanation: "Missing or unverified website creates a concrete prospecting angle." }); }
  const contactPoints = input.phone || input.email ? 5 : 10;
  score += contactPoints;
  factors.push({ key: "contactability", label: input.phone || input.email ? "Contactable" : "Contact gap", points: contactPoints, explanation: input.phone || input.email ? "At least one direct contact channel is available." : "No phone or email is currently recorded." });

  const stagePoints: Record<string, number> = { NEW: 5, QUALIFYING: 8, QUALIFIED: 15, CONTACTED: 18, CONNECTED: 20, INTERESTED: 22, NURTURE: 4 };
  const stagePointsValue = stagePoints[input.stage] ?? 0;
  if (stagePointsValue) { score += stagePointsValue; factors.push({ key: "stage", label: `Stage: ${input.stage}`, points: stagePointsValue, explanation: "Later-stage relationships receive more execution priority." }); }

  if (input.qualification_status === "QUALIFIED") { score += 10; factors.push({ key: "qualification", label: "Qualified", points: 10, explanation: "The lead has passed the qualification checkpoint." }); }
  else if (input.qualification_status === "QUALIFYING") { score += 5; factors.push({ key: "qualification", label: "Qualifying", points: 5, explanation: "The lead is actively being evaluated." }); }
  if (input.priority_score != null) { const points = Math.round(clamp(input.priority_score) * 0.1); score += points; factors.push({ key: "priority", label: "Existing priority", points, explanation: `The stored priority score is ${input.priority_score}/100.` }); }
  if (input.opportunity_score != null) { const points = Math.round(clamp(input.opportunity_score) * 0.1); score += points; factors.push({ key: "opportunity", label: "Opportunity score", points, explanation: `The stored opportunity score is ${input.opportunity_score}/100.` }); }
  if (!input.last_contacted_at && ["QUALIFIED", "CONTACTED", "CONNECTED", "INTERESTED"].includes(input.stage)) { score += 8; factors.push({ key: "no_contact", label: "No recorded contact", points: 8, explanation: "An active sales-stage lead has no recorded contact attempt." }); }
  if ((input.open_opportunity_count ?? 0) > 0) { score += 8; factors.push({ key: "open_opportunity", label: "Open opportunity", points: 8, explanation: `${input.open_opportunity_count} open opportunity is attached to this lead.` }); }

  score = clamp(score);
  return { score, label: labelFor(score), factors: factors.sort((a, b) => b.points - a.points) };
}

export async function scoreLead(organizationId: string, leadId: string): Promise<LeadScore> {
  const leads = await listLeads(organizationId);
  const lead = leads.find((item) => item.id === leadId);
  if (!lead) throw new Error("Lead not found.");
  const [businesses, opportunities, tasks, activities] = await Promise.all([listBusinesses(organizationId), listOpportunities(organizationId), listTasks(organizationId, { leadId }), listActivities(organizationId, { leadId })]);
  const business = businesses.find((item) => item.id === lead.business_id);
  const openOpportunityCount = opportunities.filter((item) => item.lead_id === leadId && item.status === "OPEN").length;
  const openTaskCount = tasks.filter((item) => item.status === "OPEN" || item.status === "IN_PROGRESS").length;
  const lastContact = activities.find((item) => ["CALL", "EMAIL", "WHATSAPP", "MEETING"].includes(item.type));
  return calculateLeadScore({ rating: business?.rating, review_count: business?.review_count, website_status: business?.website_status, phone: business?.phone, email: business?.email, stage: lead.stage ?? "NEW", qualification_status: lead.qualification_status ?? "UNQUALIFIED", priority_score: lead.priority_score, opportunity_score: lead.opportunity_score, last_contacted_at: lead.last_contacted_at ?? lastContact?.occurred_at ?? null, open_task_count: openTaskCount, open_opportunity_count: openOpportunityCount });
}
