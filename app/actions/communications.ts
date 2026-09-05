"use server";

import { revalidatePath } from "next/cache";
import { requireUser } from "@/lib/auth/require-user";
import { getCurrentOrganization } from "@/lib/domains/organizations/current";
import { getContact } from "@/lib/domains/contacts/service";
import { getLead } from "@/lib/domains/leads/service";
import { createActivity } from "@/lib/domains/activities/service";

const CALL_OUTCOMES = [
  "CONNECTED",
  "NO_ANSWER",
  "BUSY",
  "VOICEMAIL",
  "WRONG_NUMBER",
  "CALLBACK_REQUESTED",
  "NOT_INTERESTED",
] as const;

const WHATSAPP_OUTCOMES = [
  "SENT",
  "DELIVERED",
  "REPLIED",
  "NO_RESPONSE",
  "WRONG_NUMBER",
] as const;

type CommunicationKind = "CALL" | "WHATSAPP";

async function context() {
  const user = await requireUser();
  const organization = await getCurrentOrganization();
  if (!organization) throw new Error("No current organization.");
  return { user, organization };
}

export async function recordCommunicationAction(input: {
  contactId: string;
  leadId?: string;
  kind: CommunicationKind;
  outcome: string;
  notes?: string;
}) {
  const { user, organization } = await context();
  const contact = await getContact(organization.id, input.contactId);
  if (!contact) throw new Error("Contact not found.");

  const outcomes = input.kind === "CALL" ? CALL_OUTCOMES : WHATSAPP_OUTCOMES;
  if (!outcomes.includes(input.outcome as never)) {
    throw new Error("Invalid communication outcome.");
  }

  let lead = null;
  if (input.leadId) {
    lead = await getLead(organization.id, input.leadId);
    if (!lead) throw new Error("Lead not found.");
    if (lead.business_id !== contact.business_id) {
      throw new Error("The selected contact does not belong to the lead's business.");
    }
  }

  const subject =
    input.kind === "CALL"
      ? `Call · ${input.outcome.replaceAll("_", " ")}`
      : `WhatsApp · ${input.outcome.replaceAll("_", " ")}`;

  const note = input.notes?.trim();
  const activity = await createActivity(organization.id, {
    business_id: contact.business_id,
    lead_id: input.leadId ?? null,
    contact_id: contact.id,
    type: input.kind,
    direction: "OUTBOUND",
    subject,
    body_preview: note || `${input.kind === "CALL" ? "Phone call" : "WhatsApp message"} recorded as ${input.outcome.replaceAll("_", " ").toLowerCase()}.`,
    provider: input.kind === "CALL" ? "PHONE_NATIVE" : "WHATSAPP_LINK",
    user_id: user.id,
    metadata_json: {
      channel: input.kind,
      outcome: input.outcome,
      notes: note || null,
    },
  });

  if (lead) {
    const supabase = await (await import("@/lib/supabase/server")).createClient();
    const { error } = await supabase
      .from("leads")
      .update({ last_contacted_at: new Date().toISOString() })
      .eq("organization_id", organization.id)
      .eq("id", lead.id)
      .is("deleted_at", null);
    if (error) throw error;
    revalidatePath(`/leads/${lead.id}`);
  }

  revalidatePath(`/businesses/${contact.business_id}`);
  revalidatePath("/activities");
  return activity;
}
