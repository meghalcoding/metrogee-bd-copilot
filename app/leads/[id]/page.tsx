import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, ExternalLink, Pencil, Plus } from "lucide-react";
import { AppShell } from "@/components/layout/app-shell";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ActivityForm } from "@/components/activities/activity-form";
import { requireUser } from "@/lib/auth/require-user";
import { getCurrentOrganization } from "@/lib/domains/organizations/current";
import { getLead, listLeadStageHistory } from "@/lib/domains/leads/service";
import { listLeadOpportunities } from "@/lib/domains/opportunities/service";
import { listActivities } from "@/lib/domains/activities/service";
import { listTasks } from "@/lib/domains/tasks/service";

export default async function LeadDetailPage({ params }: { params: Promise<{ id: string }> }) {
  await requireUser();
  const { id } = await params;
  const organization = await getCurrentOrganization();
  if (!organization) return null;

  const lead = await getLead(organization.id, id);
  if (!lead) notFound();

  const [history, opportunities, activities, tasks] = await Promise.all([
    listLeadStageHistory(organization.id, id),
    listLeadOpportunities(organization.id, id),
    listActivities(organization.id, { leadId: id }),
    listTasks(organization.id, { leadId: id }),
  ]);

  return (
    <AppShell>
      <div className="space-y-6">
        <Link href="/leads" className="inline-flex items-center gap-2 text-sm font-medium text-text-secondary hover:text-foreground"><ArrowLeft className="size-4" />Leads</Link>

        <section className="flex flex-col justify-between gap-4 rounded-xl border border-border bg-surface p-5 sm:flex-row sm:items-start sm:p-6">
          <div>
            <div className="flex flex-wrap items-center gap-2"><h1>{lead.business?.name ?? "Lead"}</h1><Badge>{lead.stage}</Badge><Badge>{lead.status}</Badge></div>
            <p className="mt-2 text-sm text-text-secondary">{lead.primary_contact?.full_name ?? "No primary contact"}{lead.primary_contact?.job_title ? ` · ${lead.primary_contact.job_title}` : ""}</p>
          </div>
          <Button asChild variant="secondary"><Link href={`/leads/${id}/edit`}><Pencil className="size-4" />Edit lead</Link></Button>
        </section>

        <div className="grid gap-6 lg:grid-cols-[1.1fr_.9fr]">
          <section className="rounded-xl border border-border bg-surface p-5">
            <div className="flex items-center justify-between"><h2 className="text-sm font-semibold">Sales state</h2><Button asChild size="sm"><Link href={`/opportunities/new?lead=${id}`}><Plus className="size-4" />Opportunity</Link></Button></div>
            <dl className="mt-5 grid grid-cols-2 gap-5 text-sm"><Metric label="Qualification" value={lead.qualification_status}/><Metric label="Opportunity score" value={lead.opportunity_score ?? "—"}/><Metric label="Priority score" value={lead.priority_score ?? "—"}/><Metric label="Next action" value={lead.next_action_at ? new Date(lead.next_action_at).toLocaleString() : "—"}/><Metric label="Last contacted" value={lead.last_contacted_at ? new Date(lead.last_contacted_at).toLocaleString() : "—"}/><Metric label="Source" value={lead.source ?? "Manual"}/></dl>
          </section>

          <section className="rounded-xl border border-border bg-surface p-5"><h2 className="text-sm font-semibold">Stage history</h2><div className="mt-5 space-y-4">{history.length ? history.map((item) => <div key={item.id} className="border-l-2 border-border pl-3"><div className="text-sm font-medium">{item.from_stage ?? "—"} → {item.to_stage}</div><div className="mt-1 text-xs text-text-muted">{new Date(item.changed_at).toLocaleString()}{item.reason ? ` · ${item.reason}` : ""}</div></div>) : <p className="text-sm text-text-secondary">No stage changes recorded yet.</p>}</div></section>
        </div>

        <section className="rounded-xl border border-border bg-surface p-5">
          <div className="flex items-center justify-between"><div><h2 className="text-sm font-semibold">Record activity</h2><p className="mt-1 text-xs text-text-muted">Activity is historical and cannot be edited or deleted.</p></div><Badge variant="neutral">{activities.length} recorded</Badge></div>
          <div className="mt-5"><ActivityForm leadId={id} businessId={lead.business?.id} contactId={lead.primary_contact?.id} /></div>
        </section>

        <div className="grid gap-6 lg:grid-cols-2">
          <section className="rounded-xl border border-border bg-surface">
            <div className="flex items-center justify-between border-b border-border px-5 py-4"><div><h2 className="text-sm font-semibold">Next actions</h2><p className="mt-1 text-xs text-text-muted">Tasks are actionable work, not history.</p></div><Button asChild size="sm"><Link href={`/tasks/new?lead=${id}`}><Plus className="size-4" />Task</Link></Button></div>
            {tasks.length ? tasks.slice(0, 8).map((task) => <Link key={task.id} href={`/tasks/${task.id}/edit`} className="flex items-center justify-between border-b border-border px-5 py-4 last:border-0 hover:bg-surface-muted/60"><div><p className="text-sm font-medium">{task.title}</p><p className="mt-1 text-xs text-text-muted">{task.status} · {task.priority}</p></div><span className="text-xs text-text-muted">{task.due_at ? new Date(task.due_at).toLocaleString() : "No due date"}</span></Link>) : <div className="px-5 py-10 text-center text-sm text-text-secondary">No tasks for this lead.</div>}
          </section>

          <section className="rounded-xl border border-border bg-surface">
            <div className="border-b border-border px-5 py-4"><h2 className="text-sm font-semibold">Recent activity</h2></div>
            {activities.length ? activities.slice(0, 8).map((activity) => <div key={activity.id} className="border-b border-border px-5 py-4 last:border-0"><div className="flex items-center gap-2"><Badge>{activity.type}</Badge><span className="text-xs text-text-muted">{new Date(activity.occurred_at).toLocaleString()}</span></div><p className="mt-2 text-sm font-medium">{activity.subject ?? "Activity"}</p>{activity.body_preview ? <p className="mt-1 text-xs text-text-secondary">{activity.body_preview}</p> : null}</div>) : <div className="px-5 py-10 text-center text-sm text-text-secondary">No activity recorded for this lead.</div>}
          </section>
        </div>

        <section className="rounded-xl border border-border bg-surface">
          <div className="flex items-center justify-between border-b border-border px-5 py-4"><h2 className="text-sm font-semibold">Opportunities</h2><Link href={lead.business?.id ? `/businesses/${lead.business.id}` : "/businesses"} className="inline-flex items-center gap-1 text-xs font-medium text-primary">Business <ExternalLink className="size-3"/></Link></div>
          {opportunities.length ? opportunities.map((opp) => <Link key={opp.id} href={`/opportunities/${opp.id}`} className="flex items-center justify-between border-b border-border px-5 py-4 last:border-0 hover:bg-surface-muted/60"><div><p className="text-sm font-medium">{opp.name}</p><p className="mt-1 text-xs text-text-muted">{opp.stage} · {opp.status}</p></div><p className="text-sm font-semibold">{opp.value_amount != null ? `${opp.currency} ${Number(opp.value_amount).toLocaleString()}` : "—"}</p></Link>) : <div className="px-5 py-10 text-center text-sm text-text-secondary">No opportunities yet.</div>}
        </section>
      </div>
    </AppShell>
  );
}

function Metric({label,value}:{label:string;value:string|number}) {
  return <div><dt className="text-xs text-text-muted">{label}</dt><dd className="mt-1 font-medium">{value}</dd></div>;
}
