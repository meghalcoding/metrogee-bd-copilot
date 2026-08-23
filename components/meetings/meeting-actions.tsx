"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { updateMeetingStatusAction } from "@/app/actions/meetings";
import type { MeetingStatus } from "@/lib/domains/meetings/types";
import { buildGoogleCalendarUrl, buildOutlookCalendarUrl } from "@/lib/domains/meetings/ics";
import type { MeetingRecord } from "@/lib/domains/meetings/types";
import { Button } from "@/components/ui/button";

export function MeetingActions({ meeting }: { meeting: MeetingRecord }) {
  const router = useRouter();
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");

  async function setStatus(status: MeetingStatus) {
    setPending(true);
    setError("");
    try {
      await updateMeetingStatusAction(meeting.id, status);
      router.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not update meeting.");
    } finally {
      setPending(false);
    }
  }

  function downloadIcs() {
    window.open(`/api/meetings/${meeting.id}/ics`, "_blank", "noopener,noreferrer");
  }

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap gap-2">
        {meeting.status === "SCHEDULED" ? (
          <>
            <Button disabled={pending} onClick={() => setStatus("COMPLETED")}>Mark completed</Button>
            <Button variant="secondary" disabled={pending} onClick={() => setStatus("NO_SHOW")}>No-show</Button>
            <Button variant="secondary" disabled={pending} onClick={() => setStatus("CANCELLED")}>Cancel</Button>
          </>
        ) : null}
        <Button variant="secondary" onClick={downloadIcs}>Download .ics</Button>
      </div>
      <div className="flex flex-wrap gap-2 text-xs">
        <a className="rounded-md border border-border bg-background px-3 py-2 font-medium text-text-secondary hover:text-foreground" href={buildGoogleCalendarUrl(meeting)} target="_blank" rel="noreferrer">Add to Google Calendar</a>
        <a className="rounded-md border border-border bg-background px-3 py-2 font-medium text-text-secondary hover:text-foreground" href={buildOutlookCalendarUrl(meeting)} target="_blank" rel="noreferrer">Add to Outlook</a>
      </div>
      {error ? <p className="text-sm text-danger">{error}</p> : null}
    </div>
  );
}
