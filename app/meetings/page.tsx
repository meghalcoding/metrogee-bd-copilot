import Link from "next/link";
import { CalendarDays, Plus } from "lucide-react";
import { AppShell } from "@/components/layout/app-shell";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { getCurrentOrganization } from "@/lib/domains/organizations/current";
import { listMeetings } from "@/lib/domains/meetings/service";

export default async function MeetingsPage() {
  const organization = await getCurrentOrganization();
  if (!organization) return <AppShell><div className="p-6">No current organization.</div></AppShell>;
  const meetings = await listMeetings(organization.id);
  const now = new Date();
  const upcoming = meetings.filter((item) => item.status === "SCHEDULED" && new Date(item.start_at) >= now);
  const past = meetings.filter((item) => !upcoming.some((up) => up.id === item.id));

  return (
    <AppShell>
      <div className="space-y-6">
        <section className="flex flex-col justify-between gap-4 rounded-xl border border-border bg-surface p-5 sm:flex-row sm:items-center sm:p-6">
          <div><p className="text-sm font-medium text-primary">Workspace</p><h1 className="mt-1">Meetings</h1><p className="mt-2 text-sm text-text-secondary">Schedule meetings once, keep them in the CRM, and add them to any external calendar.</p></div>
          <Button asChild><Link href="/meetings/new"><Plus className="size-4" />Schedule meeting</Link></Button>
        </section>

        <section className="rounded-xl border border-border bg-surface">
          <div className="flex items-center justify-between border-b border-border px-5 py-4"><div><h2 className="text-sm font-semibold">Upcoming</h2><p className="mt-1 text-xs text-text-muted">Your next scheduled meetings.</p></div><Badge variant="neutral">{upcoming.length}</Badge></div>
          {upcoming.length ? upcoming.map((meeting) => <MeetingRow key={meeting.id} meeting={meeting} />) : <div className="px-5 py-12 text-center text-sm text-text-secondary"><CalendarDays className="mx-auto mb-3 size-8 text-text-muted" />No upcoming meetings.</div>}
        </section>

        <section className="rounded-xl border border-border bg-surface">
          <div className="flex items-center justify-between border-b border-border px-5 py-4"><div><h2 className="text-sm font-semibold">History</h2><p className="mt-1 text-xs text-text-muted">Completed, cancelled, no-show, and past scheduled meetings.</p></div><Badge variant="neutral">{past.length}</Badge></div>
          {past.length ? past.map((meeting) => <MeetingRow key={meeting.id} meeting={meeting} />) : <div className="px-5 py-12 text-center text-sm text-text-secondary">No meeting history.</div>}
        </section>
      </div>
    </AppShell>
  );
}

function MeetingRow({ meeting }: { meeting: Awaited<ReturnType<typeof listMeetings>>[number] }) {
  const related = meeting.opportunity?.name ?? meeting.lead?.business?.name ?? meeting.business?.name ?? meeting.contact?.full_name ?? "CRM meeting";
  return <Link href={`/meetings/${meeting.id}`} className="flex flex-col gap-3 border-b border-border px-5 py-4 last:border-0 hover:bg-surface-muted/60 sm:flex-row sm:items-center sm:justify-between"><div className="min-w-0"><div className="flex flex-wrap items-center gap-2"><p className="truncate text-sm font-medium">{meeting.title}</p><Badge variant={meeting.status === "COMPLETED" ? "success" : meeting.status === "CANCELLED" || meeting.status === "NO_SHOW" ? "neutral" : "info"}>{meeting.status}</Badge></div><p className="mt-1 text-xs text-text-muted">{related}{meeting.contact?.full_name ? ` · ${meeting.contact.full_name}` : ""}</p></div><div className="shrink-0 text-left text-xs text-text-secondary sm:text-right"><div>{new Date(meeting.start_at).toLocaleString("en-IN", { dateStyle: "medium", timeStyle: "short" })}</div><div className="mt-1">to {new Date(meeting.end_at).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" })}</div></div></Link>;
}
