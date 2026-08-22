import { AppShell } from "@/components/layout/app-shell";
import { Badge } from "@/components/ui/badge";
import { requireUser } from "@/lib/auth/require-user";
import { getCurrentOrganization } from "@/lib/domains/organizations/current";
import { listActivities } from "@/lib/domains/activities/service";

export default async function ActivitiesPage() {
  await requireUser();
  const organization = await getCurrentOrganization();
  if (!organization) return null;
  const activities = await listActivities(organization.id);

  return <AppShell><div className="space-y-6">
    <div><p className="text-sm font-medium text-primary">CRM</p><h1 className="mt-1">Activities</h1><p className="mt-2 text-sm text-text-secondary">Immutable history of calls, emails, meetings, notes and other sales events.</p></div>
    <div className="overflow-hidden rounded-xl border border-border bg-surface">
      {activities.length ? activities.map((activity) => <div key={activity.id} className="border-b border-border px-5 py-4 last:border-0">
        <div className="flex flex-wrap items-center gap-2"><Badge>{activity.type}</Badge>{activity.direction ? <Badge variant="neutral">{activity.direction}</Badge> : null}<span className="text-xs text-text-muted">{new Date(activity.occurred_at).toLocaleString()}</span></div>
        {activity.subject ? <p className="mt-2 text-sm font-medium">{activity.subject}</p> : null}
        {activity.body_preview ? <p className="mt-1 text-sm text-text-secondary">{activity.body_preview}</p> : null}
      </div>) : <div className="px-6 py-12 text-center"><p className="font-medium">No activities yet</p><p className="mt-1 text-sm text-text-secondary">Record the first sales interaction from a related record.</p></div>}
    </div>
  </div></AppShell>;
}
