"use server";

import { revalidatePath } from "next/cache";
import { supabaseAdmin } from "@/lib/supabase-admin";
import { createTask } from "@/lib/db/tasks";
import { getCallerOrgId } from "@/lib/db/team-members";
import { createTaskStatus, deleteTaskStatus, getTaskStatuses, type TaskStatusRow } from "@/lib/db/task-statuses";
import type { Task, TaskInsert, TaskStatus } from "@/lib/types";

export async function createTaskAction(
  payload: Omit<TaskInsert, "org_id">
): Promise<Task> {
  const org_id = await getCallerOrgId();
  const task = await createTask({ ...payload, org_id });

  // Auto-add assignee to project_members so they can see this task
  if (payload.assignee_id && payload.project_id) {
    await (supabaseAdmin as any)
      .from("project_members")
      .upsert(
        { project_id: payload.project_id, member_id: payload.assignee_id, org_id },
        { onConflict: "project_id,member_id", ignoreDuplicates: true }
      );
  }

  revalidatePath("/dashboard", "layout");
  return task;
}

export async function updateTaskStatusAction(
  taskId: string,
  status: TaskStatus
): Promise<{ error: string } | null> {
  try {
    const orgId = await getCallerOrgId();
    const { data, error } = await supabaseAdmin
      .from("tasks")
      .update({ status })
      .eq("id", taskId)
      .eq("org_id", orgId)
      .select("id, status")
      .single();

    if (error) {
      return { error: `Failed to update task: ${error.message}` };
    }

    if (!data) {
      return { error: "Task not found" };
    }

    revalidatePath("/dashboard", "layout");
    return null;
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return { error: message };
  }
}

/** Create a custom board column. Inserts before "Done". */
export async function createCustomStatusAction(
  label: string,
  color: string
): Promise<{ status?: TaskStatusRow; error?: string }> {
  try {
    const orgId = await getCallerOrgId();
    // Generate slug from label: "In Testing" → "in_testing"
    const slug = label.trim().toLowerCase().replace(/\s+/g, '_').replace(/[^a-z0-9_]/g, '');
    if (!slug) return { error: 'Invalid status name' };

    // Check for duplicate slug
    const existing = await getTaskStatuses(orgId);
    if (existing.some((s) => s.slug === slug)) {
      return { error: 'A status with this name already exists' };
    }

    const status = await createTaskStatus(orgId, slug, label.trim(), color);
    revalidatePath("/dashboard", "layout");
    return { status };
  } catch (err) {
    return { error: err instanceof Error ? err.message : 'Failed to create status' };
  }
}

/** Delete a custom board column. Moves its tasks to "To Do". */
export async function deleteCustomStatusAction(
  statusId: string
): Promise<{ error?: string }> {
  try {
    const orgId = await getCallerOrgId();
    await deleteTaskStatus(statusId, orgId);
    revalidatePath("/dashboard", "layout");
    return {};
  } catch (err) {
    return { error: err instanceof Error ? err.message : 'Failed to delete status' };
  }
}
