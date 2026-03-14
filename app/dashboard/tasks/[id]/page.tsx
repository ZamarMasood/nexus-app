import { getTaskByIdWithAssignee, getCommentsByTaskId, getFilesByTaskId } from "@/lib/db/tasks";
import TaskDetailClient from "./TaskDetailClient";

export const dynamic = "force-dynamic";

interface TaskDetailPageProps {
  params: Promise<{ id: string }>;
}

export default async function TaskDetailPage({ params }: TaskDetailPageProps) {
  const { id } = await params;

  const [task, comments, files] = await Promise.all([
    getTaskByIdWithAssignee(id),
    getCommentsByTaskId(id),
    getFilesByTaskId(id),
  ]);

  return (
    <TaskDetailClient
      task={task}
      initialComments={comments}
      initialFiles={files}
    />
  );
}
