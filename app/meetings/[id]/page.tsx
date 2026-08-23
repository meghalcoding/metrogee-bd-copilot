import Link from "next/link";
import { ArrowLeft, ExternalLink } from "lucide-react";
import { AppShell } from "@/components/layout/app-shell";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { MeetingActions } from "@/components/meetings/meeting-actions";
import { getCurrentOrganization } from "@/lib/domains/organizations/current";
import { getMeeting } from "@/lib/domains/meetings/service";
import { requireUser } from "@/lib/auth/require-user";
import { notFound } from "next/navigation";

export default async function MeetingDetailPage({ params }: { params: Promise<{ id: string }> }) {
  await requireUser();
  const organization = await getCurrentOrganization();
  if (!organization) return null;
  const { id } = await params;
  const meeting = await getMeeting(organization.id, id);
  if (!meeting) notFound();
  const relatedHref = meeting.opportunity ? `/opportunities/${meeting.opportunity.id}` : meeting.lead ? `/leads/${meeting.lead.id}` : meeting.business ? `/businesses/${meeting.business.id}` : "/meetings";

  return <AppShell><div className="mx-auto max-w-4xl space-y-6">
    <Link href="/meetings" className="inline-flex items-center gap-2 text-sm font-medium text-text-secondary hover:text-foreground"><ArrowLeft className="size-4" />Meetings</Link>
    <section className="rounded-xl border border-border bg-surface p-5 sm:p-6"><div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-start"><div><div className="flex flex-wrap items-center gap-2"><h1>{meeting.title}</h1><Badge>{meeting.status}</Badge></div><p className="mt-2 text-sm text-text-secondary">{new Date(meeting.start_at).toLocaleString("en-IN", { dateStyle: "full", timeStyle: "short" })} — {new Date(meeting.end_at).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" })}</p></div><Button asChild variant="secondary"><Link href={relatedHref}><ExternalLink className="size-4" />Open related record</Link></Button></div>
      <div className="mt-6 grid gap-5 sm:grid-cols-2"><Metric label="Business" value={meeting.business?.name ?? "—"}/><Metric label="Contact" value={meeting.contact?.full_name ?? "—"}/><Metric label="Lead" value={meeting.lead?.stage ?? "—"}/><Metric label="Opportunity" value={meeting.opportunity?.name ?? "—"}/><Metric label="Location" value={meeting.location ?? "—"}/><Metric label="Timezone" value={meeting.timezone ?? "Asia/Kolkata"}/></div>
      {meeting.description ? <div className="mt-6 rounded-lg border border-border bg-background p-4"><div className="text-xs font-medium text-text-muted">Agenda / notes</div><p className="mt-2 whitespace-pre-wrap text-sm text-text-secondary">{meeting.description}</p></div> : null}
      <div className="mt-6 border-t border-border pt-5"><MeetingActions meeting={meeting} /></div>
    </section>
  </div></AppShell>;
}
function Metric({label,value}:{label:string;value:string}) { return <div><div className="text-xs text-text-muted">{label}</div><div className="mt-1 text-sm font-medium">{value}</div></div>; }
