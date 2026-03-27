"use server";

import { revalidatePath } from "next/cache";
import { supabaseAdmin } from "@/lib/supabase-admin";
import { createTask } from "@/lib/db/tasks";
import { getCallerOrgId } from "@/lib/db/team-members";
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
