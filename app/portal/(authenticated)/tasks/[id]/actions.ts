"use server";

import { revalidatePath } from "next/cache";
import { createPortalComment } from "@/lib/db/portal";

export async function submitPortalComment(
  taskId: string,
  content: string,
  clientId: string
): Promise<{ error: string } | null> {
  if (!content.trim()) return { error: "Comment cannot be empty." };

  try {
    await createPortalComment(taskId, content.trim(), clientId);
    revalidatePath(`/portal/tasks/${taskId}`);
    return null;
  } catch (err) {
    return { error: "Failed to send comment. Please try again." };
  }
}
