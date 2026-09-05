import Link from "next/link";
import { CalendarDays, Clock3, Plus } from "lucide-react";
import { AppShell } from "@/components/layout/app-shell";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { getCurrentOrganization } from "@/lib/domains/organizations/current";
import { listMeetings } from "@/lib/domains/meetings/service";

const statusVariant: Record<string, "success" | "info" | "warning" | "neutral" | "danger"> = {
  SCHEDULED: "info",
  COMPLETED: "success",
  CANCELLED: "neutral",
  NO_SHOW: "warning",
};

export default async function MeetingsPage() {
  const organization = await getCurrentOrganization();
  if (!organization) return <AppShell><div className="p-6">No current organization.</div></AppShell>;
  const meetings = await listMeetings(organization.id);
  const now = new Date();
  const upcoming = meetings.filter((m) => m.status === "SCHEDULED" && new Date(m.start_at) >= now);
  const past = meetings.filter((m) => !upcoming.some((u) => u.id === m.id));

  return (
    <AppShell>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
          <div>
            <p className="text-sm font-medium text-primary">Workspace</p>
            <h1 className="mt-1 text-2xl font-semibold tracking-tight">Meetings</h1>
            <p className="mt-1.5 text-sm text-text-secondary">
              {upcoming.length > 0
                ? `${upcoming.length} upcoming · ${past.length} in history`
                : "Schedule meetings and keep them in the CRM."}
            </p>
          </div>
          <Button asChild>
            <Link href="/meetings/new"><Plus className="size-4" />Schedule meeting</Link>
          </Button>
        </div>

        {/* Upcoming */}
        <section className="rounded-xl border border-border bg-surface">
          <div className="flex items-center justify-between border-b border-border px-5 py-4">
            <div>
              <h2 className="text-sm font-semibold">Upcoming</h2>
              <p className="mt-0.5 text-xs text-text-muted">Scheduled and not yet started.</p>
            </div>
            <Badge variant="neutral">{upcoming.length}</Badge>
          </div>
          {upcoming.length ? (
            <div className="divide-y divide-border">
              {upcoming.map((m) => <MeetingRow key={m.id} meeting={m} />)}
            </div>
          ) : (
            <div className="flex flex-col items-center px-5 py-12 text-center">
              <CalendarDays className="mb-3 size-8 text-text-muted" strokeWidth={1.4} />
              <p className="text-sm text-text-secondary">No upcoming meetings.</p>
              <Button asChild variant="secondary" size="sm" className="mt-4">
                <Link href="/meetings/new">Schedule one</Link>
              </Button>
            </div>
          )}
        </section>

        {/* History */}
        <section className="rounded-xl border border-border bg-surface">
          <div className="flex items-center justify-between border-b border-border px-5 py-4">
            <div>
              <h2 className="text-sm font-semibold">History</h2>
              <p className="mt-0.5 text-xs text-text-muted">Completed, cancelled, and no-show meetings.</p>
            </div>
            <Badge variant="neutral">{past.length}</Badge>
          </div>
          {past.length ? (
            <div className="divide-y divide-border">
              {past.map((m) => <MeetingRow key={m.id} meeting={m} />)}
            </div>
          ) : (
            <div className="px-5 py-10 text-center text-sm text-text-secondary">No meeting history yet.</div>
          )}
        </section>
      </div>
    </AppShell>
  );
}

function MeetingRow({ meeting }: { meeting: Awaited<ReturnType<typeof listMeetings>>[number] }) {
  const related =
    meeting.opportunity?.name ??
    meeting.lead?.business?.name ??
    meeting.business?.name ??
    meeting.contact?.full_name ??
    "CRM meeting";
  const variant = statusVariant[meeting.status] ?? "neutral";
  const start = new Date(meeting.start_at);
  const end = new Date(meeting.end_at);

  return (
    <Link
      href={`/meetings/${meeting.id}`}
      className="group flex flex-col gap-3 px-5 py-4 transition-colors hover:bg-surface-muted/50 sm:flex-row sm:items-center sm:justify-between"
    >
      <div className="min-w-0">
        <div className="flex flex-wrap items-center gap-2">
          <p className="text-sm font-medium text-foreground truncate group-hover:text-primary transition-colors">
            {meeting.title}
          </p>
          <Badge variant={variant}>{meeting.status}</Badge>
        </div>
        <p className="mt-1 text-xs text-text-muted">
          {related}
          {meeting.contact?.full_name ? ` · ${meeting.contact.full_name}` : ""}
        </p>
      </div>
      <div className="flex shrink-0 items-center gap-2 text-xs text-text-secondary sm:flex-col sm:items-end sm:gap-0.5">
        <div className="flex items-center gap-1.5">
          <Clock3 className="size-3 text-text-muted" />
          <span>
            {start.toLocaleDateString("en-IN", { day: "numeric", month: "short" })}
            {" · "}
            {start.toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" })}
            {" – "}
            {end.toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" })}
          </span>
        </div>
      </div>
    </Link>
  );
}
