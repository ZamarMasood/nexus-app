"use server";

import { revalidatePath } from "next/cache";
import { supabaseAdmin } from "@/lib/supabase-admin";
import type { TaskStatus } from "@/lib/types";

export async function updateTaskStatusAction(
  taskId: string,
  status: TaskStatus
): Promise<{ error: string } | null> {
  try {
    const { data, error } = await supabaseAdmin
      .from("tasks")
      .update({ status })
      .eq("id", taskId)
      .select("id, status")
      .single();

    if (error) {
      console.error("[updateTaskStatus] Supabase error:", error.message, { taskId, status });
      return { error: `Failed to update task: ${error.message}` };
    }

    if (!data) {
      console.error("[updateTaskStatus] No row updated — task may not exist:", { taskId, status });
      return { error: "Task not found" };
    }

    revalidatePath("/dashboard", "layout");
    return null;
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    console.error("[updateTaskStatus] Unexpected error:", message, { taskId, status });
    return { error: message };
  }
}
