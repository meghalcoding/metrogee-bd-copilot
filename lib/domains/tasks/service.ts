import { createClient } from "@/lib/supabase/server";
import type { TaskInput, TaskPriority, TaskStatus } from "./types";

function cleanOptional(value: string | null | undefined) {
  const trimmed = value?.trim();
  return trimmed ? trimmed : null;
}

function normalizeInput(input: TaskInput) {
  const title = input.title.trim();
  if (title.length < 1 || title.length > 200) {
    throw new Error("Task title must be between 1 and 200 characters.");
  }

  const relatedCount = [input.business_id, input.lead_id, input.opportunity_id].filter(Boolean).length;
  if (relatedCount === 0) {
    throw new Error("A task must be related to a business, lead, or opportunity.");
  }

  return {
    business_id: cleanOptional(input.business_id),
    lead_id: cleanOptional(input.lead_id),
    opportunity_id: cleanOptional(input.opportunity_id),
    assigned_to: cleanOptional(input.assigned_to),
    type: input.type,
    title,
    description: cleanOptional(input.description),
    status: input.status ?? "OPEN",
    priority: input.priority ?? "NORMAL",
    due_at: input.due_at || null,
    source_rule_id: cleanOptional(input.source_rule_id),
  };
}

export async function listTasks(organizationId: string, filters?: {
  businessId?: string;
  leadId?: string;
  opportunityId?: string;
  status?: TaskStatus;
}) {
  const supabase = await createClient();
  let query = supabase
    .from("tasks")
    .select("*, business:businesses!tasks_business_id_organization_id_fkey(name), lead:leads!tasks_lead_id_organization_id_fkey(id,stage,business:businesses!leads_business_id_organization_id_fkey(name)), opportunity:opportunities!tasks_opportunity_id_organization_id_fkey(id,name,stage,status)")
    .eq("organization_id", organizationId)
    .order("due_at", { ascending: true, nullsFirst: false })
    .order("created_at", { ascending: false });

  if (filters?.businessId) query = query.eq("business_id", filters.businessId);
  if (filters?.leadId) query = query.eq("lead_id", filters.leadId);
  if (filters?.opportunityId) query = query.eq("opportunity_id", filters.opportunityId);
  if (filters?.status) query = query.eq("status", filters.status);

  const { data, error } = await query;
  if (error) throw error;
  return data ?? [];
}

export async function getTask(organizationId: string, taskId: string) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("tasks")
    .select("*")
    .eq("organization_id", organizationId)
    .eq("id", taskId)
    .maybeSingle();

  if (error) throw error;
  return data;
}

export async function createTask(organizationId: string, createdBy: string, input: TaskInput) {
  const supabase = await createClient();
  const normalized = normalizeInput(input);

  const { data, error } = await supabase
    .from("tasks")
    .insert({ ...normalized, organization_id: organizationId, created_by: createdBy })
    .select("*")
    .single();

  if (error) throw error;
  return data;
}

export async function updateTask(organizationId: string, taskId: string, input: TaskInput) {
  const supabase = await createClient();
  const current = await getTask(organizationId, taskId);
  if (!current) throw new Error("Task not found.");

  const normalized = normalizeInput(input);
  const completed = normalized.status === "COMPLETED";

  const { data, error } = await supabase
    .from("tasks")
    .update({
      ...normalized,
      completed_at: completed ? current.completed_at ?? new Date().toISOString() : null,
    })
    .eq("organization_id", organizationId)
    .eq("id", taskId)
    .select("*")
    .single();

  if (error) throw error;
  return data;
}

export async function completeTask(organizationId: string, taskId: string) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("tasks")
    .update({
      status: "COMPLETED" as TaskStatus,
      completed_at: new Date().toISOString(),
    })
    .eq("organization_id", organizationId)
    .eq("id", taskId)
    .neq("status", "COMPLETED")
    .select("*")
    .maybeSingle();

  if (error) throw error;
  return data;
}

export function assertTaskPriority(priority: string): asserts priority is TaskPriority {
  if (!["LOW", "NORMAL", "HIGH", "URGENT"].includes(priority)) {
    throw new Error("Invalid task priority.");
  }
}
