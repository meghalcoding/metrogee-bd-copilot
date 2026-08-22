"use server";

import { revalidatePath } from "next/cache";
import { requireUser } from "@/lib/auth/require-user";
import { getCurrentOrganization } from "@/lib/domains/organizations/current";
import { completeTask, createTask, updateTask } from "@/lib/domains/tasks/service";
import type { TaskInput } from "@/lib/domains/tasks/types";

async function context() {
  const user = await requireUser();
  const organization = await getCurrentOrganization();
  if (!organization) throw new Error("No current organization.");
  return { user, organization };
}

export async function createTaskAction(input: TaskInput) {
  const { user, organization } = await context();
  const result = await createTask(organization.id, user.id, {
    ...input,
    assigned_to: input.assigned_to ?? user.id,
  });

  revalidatePath("/tasks");
  if (input.lead_id) revalidatePath(`/leads/${input.lead_id}`);
  if (input.opportunity_id) revalidatePath(`/opportunities/${input.opportunity_id}`);
  if (input.business_id) revalidatePath(`/businesses/${input.business_id}`);
  return result;
}

export async function updateTaskAction(taskId: string, input: TaskInput) {
  const { organization } = await context();
  const result = await updateTask(organization.id, taskId, input);
  revalidatePath("/tasks");
  revalidatePath(`/tasks/${taskId}/edit`);
  if (input.lead_id) revalidatePath(`/leads/${input.lead_id}`);
  if (input.opportunity_id) revalidatePath(`/opportunities/${input.opportunity_id}`);
  return result;
}

export async function completeTaskAction(taskId: string) {
  const { organization } = await context();
  const result = await completeTask(organization.id, taskId);
  revalidatePath("/tasks");
  if (result?.lead_id) revalidatePath(`/leads/${result.lead_id}`);
  if (result?.opportunity_id) revalidatePath(`/opportunities/${result.opportunity_id}`);
  return result;
}
