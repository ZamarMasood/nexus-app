import { getTaskByIdWithAssignee, getCommentsByTaskId, getFilesByTaskId, getTasksByAssignee } from "@/lib/db/tasks";
import { getProjectById } from "@/lib/db/projects";
import { getTeamMemberByEmail } from "@/lib/db/team-members";
import { createSupabaseServerClient } from "@/lib/supabase-server";
import TaskDetailClient from "./TaskDetailClient";

export const dynamic = "force-dynamic";

interface TaskDetailPageProps {
  params: Promise<{ id: string }>;
}

export default async function TaskDetailPage({ params }: TaskDetailPageProps) {
  const { id } = await params;

  const supabase = createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  const member = user?.email ? await getTeamMemberByEmail(user.email) : null;
  const isAdmin = member?.user_role === 'admin';

  const [task, comments, files] = await Promise.all([
    getTaskByIdWithAssignee(id),
    getCommentsByTaskId(id),
    getFilesByTaskId(id),
  ]);

  // Fetch sidebar tasks for the same assignee + project name in parallel
  const [assigneeTasks, project] = await Promise.all([
    task.assignee_id ? getTasksByAssignee(task.assignee_id) : Promise.resolve([]),
    task.project_id ? getProjectById(task.project_id).catch(() => null) : Promise.resolve(null),
  ]);

  return (
    <TaskDetailClient
      task={task}
      initialComments={comments}
      initialFiles={files}
      sidebarTasks={assigneeTasks}
      projectName={project?.name ?? null}
      isAdmin={isAdmin}
      currentMemberId={member?.id}
    />
  );
}
