import { listActivities } from "@/lib/domains/activities/service";
import { listBusinesses } from "@/lib/domains/businesses/service";
import { listLeads } from "@/lib/domains/leads/service";
import { listOpportunities } from "@/lib/domains/opportunities/service";
import { listTasks } from "@/lib/domains/tasks/service";
import { calculateLeadScore } from "@/lib/domains/scoring/service";
import type { RecommendedAction } from "./types";

const openStatuses = new Set(["OPEN", "IN_PROGRESS"]);

export async function listRecommendedActions(organizationId: string): Promise<RecommendedAction[]> {
  const [leads, businesses, opportunities, tasks, activities] = await Promise.all([listLeads(organizationId), listBusinesses(organizationId), listOpportunities(organizationId), listTasks(organizationId), listActivities(organizationId)]);
  const businessMap = new Map(businesses.map((item) => [item.id, item]));
  const activitiesByLead = new Map<string, typeof activities>();
  for (const activity of activities) {
    if (!activity.lead_id) continue;
    const list = activitiesByLead.get(activity.lead_id) ?? [];
    list.push(activity);
    activitiesByLead.set(activity.lead_id, list);
  }
  const actions: RecommendedAction[] = [];
  const now = Date.now();
  const openTasksByLead = new Map<string, number>();
  for (const task of tasks) {
    if (!openStatuses.has(task.status) || !task.lead_id) continue;
    openTasksByLead.set(task.lead_id, (openTasksByLead.get(task.lead_id) ?? 0) + 1);
    if (task.due_at && new Date(task.due_at).getTime() < now) actions.push({ id: `task:${task.id}`, ruleId: "NPA-TASK-001", type: "COMPLETE_TASK", priority: task.priority === "URGENT" ? "URGENT" : task.priority === "HIGH" ? "HIGH" : "NORMAL", title: `Complete: ${task.title}`, reason: "An open task is overdue and should be handled before new work is started.", dueAt: task.due_at, leadId: task.lead_id, opportunityId: task.opportunity_id, businessId: task.business_id, taskId: task.id, score: null, sourceRecords: [task.id], href: `/tasks/${task.id}/edit` });
  }

  for (const lead of leads) {
    const leadStatus = lead.status ?? "ACTIVE";
    const leadStage = lead.stage ?? "NEW";
    const qualificationStatus = lead.qualification_status ?? "UNQUALIFIED";
    const businessId = lead.business_id ?? null;
    const nextActionAt = lead.next_action_at ?? null;
    if (!["ACTIVE", "PAUSED", "ON_HOLD"].includes(leadStatus)) continue;
    const business = businessId ? businessMap.get(businessId) : undefined;
    const leadActivities = activitiesByLead.get(lead.id) ?? [];
    const contactActivity = leadActivities.find((item) => ["CALL", "EMAIL", "WHATSAPP", "MEETING"].includes(item.type));
    const lastContact = lead.last_contacted_at ?? contactActivity?.occurred_at ?? null;
    const openTaskCount = openTasksByLead.get(lead.id) ?? 0;
    const score = calculateLeadScore({ rating: business?.rating, review_count: business?.review_count, website_status: business?.website_status, phone: business?.phone, email: business?.email, stage: leadStage, qualification_status: qualificationStatus, priority_score: lead.priority_score, opportunity_score: lead.opportunity_score, last_contacted_at: lastContact, open_task_count: openTaskCount, open_opportunity_count: opportunities.filter((item) => item.lead_id === lead.id && item.status === "OPEN").length });

    if (leadStage === "QUALIFIED" && !lastContact) {
      actions.push({ id: `contact:${lead.id}`, ruleId: "NPA-CONTACT-001", type: "CALL_OR_MESSAGE", priority: "HIGH", title: `Contact ${business?.name ?? "qualified lead"}`, reason: "Qualified lead has no recorded contact attempt.", dueAt: nextActionAt, leadId: lead.id, opportunityId: null, businessId, taskId: null, score: score.score, sourceRecords: [lead.id, business?.id, businessId].filter((value): value is string => Boolean(value)), href: `/leads/${lead.id}` });
      continue;
    }
    if (lead.next_action_at && new Date(lead.next_action_at).getTime() < now) {
      actions.push({ id: `followup:${lead.id}`, ruleId: "NPA-FOLLOWUP-001", type: "FOLLOW_UP", priority: "HIGH", title: `Follow up with ${business?.name ?? "lead"}`, reason: "The lead's scheduled next action is overdue.", dueAt: nextActionAt, leadId: lead.id, opportunityId: null, businessId, taskId: null, score: score.score, sourceRecords: [lead.id], href: `/leads/${lead.id}` });
      continue;
    }
    if (["NEW", "QUALIFYING"].includes(leadStage) && (business?.website_status === "WU" || business?.website_status === "W0")) {
      actions.push({ id: `review:${lead.id}`, ruleId: "NPA-QUALIFY-001", type: "REVIEW_LEAD", priority: "NORMAL", title: `Review ${business?.name ?? "lead"}`, reason: `Lead is ${leadStage.toLowerCase()} and has a website gap to investigate.`, dueAt: nextActionAt, leadId: lead.id, opportunityId: null, businessId, taskId: null, score: score.score, sourceRecords: [lead.id, business?.id, businessId].filter((value): value is string => Boolean(value)), href: `/leads/${lead.id}` });
    }
    if (openTaskCount === 0 && ["CONTACTED", "CONNECTED", "INTERESTED"].includes(leadStage)) {
      actions.push({ id: `next:${lead.id}`, ruleId: "NPA-NEXT-001", type: "FOLLOW_UP", priority: score.score >= 75 ? "HIGH" : "NORMAL", title: `Plan next step for ${business?.name ?? "lead"}`, reason: `Lead is ${leadStage.toLowerCase()} with no open task capturing the next step.`, dueAt: nextActionAt, leadId: lead.id, opportunityId: null, businessId, taskId: null, score: score.score, sourceRecords: [lead.id], href: `/leads/${lead.id}` });
    }
  }

  for (const opportunity of opportunities) {
    if (opportunity.status !== "OPEN") continue;

    const opportunityStage = opportunity.stage as string;
    const lead = leads.find((item) => item.id === opportunity.lead_id);
    if (lead) {
      const leadStage = lead.stage ?? "NEW";
      const shouldBeQualified = ["DISCOVERY", "SOLUTIONING"].includes(opportunityStage);
      const shouldBeInterested = ["PROPOSAL", "NEGOTIATION", "CONTRACTING", "DELIVERY"].includes(opportunityStage);
      const leadIsBeforeQualified = ["NEW", "QUALIFYING"].includes(leadStage);
      const leadIsBeforeInterested = ["NEW", "QUALIFYING", "QUALIFIED", "CONTACTED", "CONNECTED"].includes(leadStage);

      if ((shouldBeQualified && leadIsBeforeQualified) || (shouldBeInterested && leadIsBeforeInterested)) {
        const targetStage = shouldBeInterested ? "INTERESTED" : "QUALIFIED";
        actions.push({
          id: `sync:${opportunity.id}:${targetStage}`,
          ruleId: "NPA-SYNC-001",
          type: "FOLLOW_UP",
          priority: "HIGH",
          title: `Update lead stage for ${opportunity.name}`,
          reason: `The opportunity is at ${opportunityStage}, but the related lead is still ${leadStage}. Update the lead to ${targetStage} so the relationship record reflects the deal progress.`,
          dueAt: null,
          leadId: lead.id,
          opportunityId: opportunity.id,
          businessId: opportunity.lead?.business?.id ?? lead.business_id ?? null,
          taskId: null,
          score: opportunity.probability ?? null,
          sourceRecords: [lead.id, opportunity.id],
          href: `/leads/${lead.id}/edit?returnTo=${encodeURIComponent(`/opportunities/${opportunity.id}`)}`,
        });
      }
    }
    if (!opportunity.expected_close_date) continue;
    const days = (new Date(opportunity.expected_close_date).getTime() - now) / 86400000;
    if (days >= 0 && days <= 7) actions.push({ id: `opp:${opportunity.id}`, ruleId: "NPA-OPPORTUNITY-001", type: "REVIEW_OPPORTUNITY", priority: days <= 2 ? "URGENT" : "HIGH", title: `Review ${opportunity.name}`, reason: `Expected close is ${Math.max(0, Math.ceil(days))} day(s) away and the opportunity is still OPEN.`, dueAt: opportunity.expected_close_date, leadId: opportunity.lead_id, opportunityId: opportunity.id, businessId: opportunity.lead?.business?.id ?? null, taskId: null, score: opportunity.probability ?? null, sourceRecords: [opportunity.id], href: `/opportunities/${opportunity.id}` });
  }

  const rank = { URGENT: 4, HIGH: 3, NORMAL: 2, LOW: 1 };
  return actions.sort((a, b) => rank[b.priority] - rank[a.priority] || (b.score ?? 0) - (a.score ?? 0) || a.title.localeCompare(b.title)).slice(0, 50);
}
