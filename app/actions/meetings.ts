"use server";

import { revalidatePath } from "next/cache";
import { requireUser } from "@/lib/auth/require-user";
import { getCurrentOrganization } from "@/lib/domains/organizations/current";
import { createMeeting, updateMeetingStatus } from "@/lib/domains/meetings/service";
import { createActivity } from "@/lib/domains/activities/service";
import type { MeetingInput, MeetingStatus } from "@/lib/domains/meetings/types";

async function context() {
  const user = await requireUser();
  const organization = await getCurrentOrganization();
  if (!organization) throw new Error("No current organization.");
  return { user, organization };
}

export async function createMeetingAction(input: MeetingInput) {
  const { user, organization } = await context();
  const meeting = await createMeeting(organization.id, user.id, input);
  await createActivity(organization.id, {
    business_id: meeting.business_id,
    lead_id: meeting.lead_id,
    contact_id: meeting.contact_id,
    opportunity_id: meeting.opportunity_id,
    user_id: user.id,
    type: "SYSTEM",
    direction: "SYSTEM",
    subject: `Meeting scheduled: ${meeting.title}`,
    body_preview: `Scheduled for ${new Date(meeting.start_at).toLocaleString("en-IN", { dateStyle: "medium", timeStyle: "short" })}.`,
    provider: "CRM_CALENDAR",
    provider_event_id: meeting.id,
    metadata_json: { meeting_id: meeting.id, status: "SCHEDULED" },
  });
  revalidatePath("/meetings");
  if (meeting.lead_id) revalidatePath(`/leads/${meeting.lead_id}`);
  if (meeting.opportunity_id) revalidatePath(`/opportunities/${meeting.opportunity_id}`);
  if (meeting.business_id) revalidatePath(`/businesses/${meeting.business_id}`);
  return meeting;
}

export async function updateMeetingStatusAction(id: string, status: MeetingStatus) {
  const { user, organization } = await context();
  const meeting = await updateMeetingStatus(organization.id, id, status);
  if (["COMPLETED", "NO_SHOW"].includes(status)) {
    await createActivity(organization.id, {
      business_id: meeting.business_id,
      lead_id: meeting.lead_id,
      contact_id: meeting.contact_id,
      opportunity_id: meeting.opportunity_id,
      user_id: user.id,
      type: "MEETING",
      direction: "OUTBOUND",
      subject: `${status === "COMPLETED" ? "Meeting completed" : "Meeting marked no-show"}: ${meeting.title}`,
      body_preview: status === "COMPLETED" ? "Meeting outcome recorded as completed." : "Meeting outcome recorded as no-show.",
      provider: "CRM_CALENDAR",
      provider_event_id: `${meeting.id}:${status}`,
      metadata_json: { meeting_id: meeting.id, status },
      occurred_at: new Date().toISOString(),
    });
  }
  revalidatePath("/meetings");
  revalidatePath(`/meetings/${id}`);
  if (meeting.lead_id) revalidatePath(`/leads/${meeting.lead_id}`);
  if (meeting.opportunity_id) revalidatePath(`/opportunities/${meeting.opportunity_id}`);
  if (meeting.business_id) revalidatePath(`/businesses/${meeting.business_id}`);
  return meeting;
}
