import type { Metadata } from "next";
import { getTasksWithAssignees, getTasksWithAssigneesByMember } from "@/lib/db/tasks";
import { getProjectsForList } from "@/lib/db/projects";
import { getTaskStatuses } from "@/lib/db/task-statuses";

export const metadata: Metadata = { title: "Tasks" };
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
  const hasMember = Boolean(member);

  const [tasks, projects, statuses] = await Promise.all([
    !hasMember
      ? Promise.resolve([])
      : isAdmin
        ? getTasksWithAssignees()
        : getTasksWithAssigneesByMember(memberId),
    hasMember ? getProjectsForList() : Promise.resolve([]),
    hasMember ? getTaskStatuses(member!.org_id!) : Promise.resolve([]),
  ]);

  // Build a project name map for the client
  const projectMap: Record<string, string> = {};
  for (const p of projects) {
    projectMap[p.id] = p.name;
  }

  return (
    <TasksClient
      initialTasks={tasks}
      statuses={statuses}
      isAdmin={isAdmin}
      currentMemberId={memberId}
      projectMap={projectMap}
    />
  );
}
