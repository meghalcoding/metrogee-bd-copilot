"use server";

import { revalidatePath } from "next/cache";
import { requireUser } from "@/lib/auth/require-user";
import { getCurrentOrganization } from "@/lib/domains/organizations/current";
import {
  archiveContact,
  createContact,
  updateContact,
} from "@/lib/domains/contacts/service";
import type { ContactInput } from "@/lib/domains/contacts/types";

async function organizationContext() {
  await requireUser();
  const organization = await getCurrentOrganization();
  if (!organization) throw new Error("No current organization.");
  return organization;
}

export async function createContactAction(businessId: string, input: ContactInput) {
  const organization = await organizationContext();
  const result = await createContact(organization.id, businessId, input);
  revalidatePath(`/businesses/${businessId}`);
  return result;
}

export async function updateContactAction(contactId: string, businessId: string, input: ContactInput) {
  const organization = await organizationContext();
  const result = await updateContact(organization.id, contactId, input);
  revalidatePath(`/businesses/${businessId}`);
  return result;
}

export async function archiveContactAction(contactId: string, businessId: string) {
  const organization = await organizationContext();
  await archiveContact(organization.id, contactId);
  revalidatePath(`/businesses/${businessId}`);
}
