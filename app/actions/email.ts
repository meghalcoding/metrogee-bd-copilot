"use server";

import { revalidatePath } from "next/cache";
import { requireUser } from "@/lib/auth/require-user";
import { getCurrentOrganization } from "@/lib/domains/organizations/current";
import { createActivity } from "@/lib/domains/activities/service";
import { getContact } from "@/lib/domains/contacts/service";
import { getLead } from "@/lib/domains/leads/service";
import { sendSmtpEmail } from "@/lib/domains/integrations/smtp";

async function context() {
  const user = await requireUser();
  const organization = await getCurrentOrganization();
  if (!organization) throw new Error("No current organization.");
  return { user, organization };
}

export async function sendEmailAction(input: {
  contactId: string;
  leadId?: string;
  subject: string;
  body: string;
}) {
  const { user, organization } = await context();
  const contact = await getContact(organization.id, input.contactId);
  if (!contact) throw new Error("Contact not found.");
  if (!contact.email) throw new Error("This contact does not have an email address.");

  let lead = null;
  if (input.leadId) {
    lead = await getLead(organization.id, input.leadId);
    if (!lead) throw new Error("Lead not found.");
    if (lead.primary_contact_id && lead.primary_contact_id !== contact.id) {
      throw new Error("The selected contact is not the lead's primary contact.");
    }
  }

  const subject = input.subject.trim();
  const body = input.body.trim();
  if (!subject) throw new Error("Subject is required.");
  if (!body) throw new Error("Message is required.");

  const result = await sendSmtpEmail(organization.id, {
    to: contact.email,
    subject,
    text: body,
  });

  const activity = await createActivity(organization.id, {
    business_id: contact.business_id,
    lead_id: input.leadId ?? null,
    contact_id: contact.id,
    type: "EMAIL",
    direction: "OUTBOUND",
    subject,
    body_preview: body.slice(0, 500),
    provider: "CUSTOM_SMTP",
    provider_event_id: result.messageId,
    user_id: user.id,
    metadata_json: { message_id: result.messageId, recipient: contact.email },
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

  revalidatePath("/activities");
  revalidatePath(`/businesses/${contact.business_id}`);
  return activity;
}
