import { NextResponse } from "next/server";
import { requireUser } from "@/lib/auth/require-user";
import { getCurrentOrganization } from "@/lib/domains/organizations/current";
import { getMeeting } from "@/lib/domains/meetings/service";
import { buildMeetingIcs } from "@/lib/domains/meetings/ics";

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  await requireUser();
  const organization = await getCurrentOrganization();
  if (!organization) return new NextResponse("No current organization.", { status: 401 });
  const { id } = await params;
  const meeting = await getMeeting(organization.id, id);
  if (!meeting) return new NextResponse("Meeting not found.", { status: 404 });

  const ics = buildMeetingIcs(meeting);
  return new NextResponse(ics, {
    headers: {
      "Content-Type": "text/calendar; charset=utf-8",
      "Content-Disposition": `attachment; filename="meeting-${meeting.id}.ics"`,
      "Cache-Control": "no-store",
    },
  });
}
