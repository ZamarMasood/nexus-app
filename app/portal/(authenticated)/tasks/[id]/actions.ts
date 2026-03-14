"use server";

import { revalidatePath } from "next/cache";
import { createPortalComment, getPortalTaskById } from "@/lib/db/portal";

export async function submitPortalComment(
  taskId: string,
  content: string,
  clientId: string
): Promise<{ error: string } | null> {
  if (!content.trim()) return { error: "Comment cannot be empty." };

  try {
    // Verify the task belongs to this client before allowing comment
    const task = await getPortalTaskById(taskId, clientId);
    if (!task) return { error: "Task not found or access denied." };

    await createPortalComment(taskId, content.trim(), clientId);
    revalidatePath(`/portal/tasks/${taskId}`);
    return null;
  } catch (err) {
    return { error: "Failed to send comment. Please try again." };
  }
}
