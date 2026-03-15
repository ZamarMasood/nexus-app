"use server";

import { revalidatePath } from "next/cache";
import { supabaseAdmin } from "@/lib/supabase-admin";
import type { TaskStatus } from "@/lib/types";

export async function updateTaskStatusAction(
  taskId: string,
  status: TaskStatus
): Promise<{ error: string } | null> {
  const { error } = await supabaseAdmin
    .from("tasks")
    .update({ status })
    .eq("id", taskId);

  if (error) {
    return { error: `Failed to update task: ${error.message}` };
  }

  revalidatePath("/dashboard", "layout");
  return null;
}
