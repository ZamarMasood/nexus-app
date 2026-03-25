import { getTasksWithAssignees, getTasksWithAssigneesByMember } from "@/lib/db/tasks";
import { getTeamMemberByEmail } from "@/lib/db/team-members";
import { createSupabaseServerClient } from "@/lib/supabase-server";
import TasksClient from "./TasksClient";

export const dynamic = "force-dynamic";

export default async function TasksPage() {
  const supabase = createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  const member = user?.email ? await getTeamMemberByEmail(user.email) : null;
  const isAdmin = member?.user_role === 'admin';
  const memberId = member?.id ?? '';

  const tasks = isAdmin
    ? await getTasksWithAssignees()
    : await getTasksWithAssigneesByMember(memberId);

  return <TasksClient initialTasks={tasks} isAdmin={isAdmin} />;
}
