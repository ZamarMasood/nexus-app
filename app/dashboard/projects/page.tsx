import type { Metadata } from "next";
import { getProjects, getProjectsByMember } from "@/lib/db/projects";

export const metadata: Metadata = { title: "Projects" };
import { getClients, getClientsByMember } from "@/lib/db/clients";
import {
  getTaskCountsByProject,
  getTaskCountsByProjectFiltered,
} from "@/lib/db/tasks";
import { getTeamMemberByEmail } from "@/lib/db/team-members";
import { createSupabaseServerClient } from "@/lib/supabase-server";
import ProjectsClient from "./ProjectsClient";

export const dynamic = "force-dynamic";

export default async function ProjectsPage() {
  const supabase = createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  const member = user?.email ? await getTeamMemberByEmail(user.email) : null;
  const isAdmin = member?.user_role === 'admin';
  const memberId = member?.id ?? '';

  const projects = isAdmin
    ? await getProjects()
    : await getProjectsByMember(memberId);

  // For task counts: admin gets all, member gets only their projects
  const projectIds = projects.map((p) => p.id);
  const [clients, taskCounts] = await Promise.all([
    // Admin needs all clients for the "New Project" dropdown
    isAdmin ? getClients() : getClientsByMember(memberId),
    isAdmin
      ? getTaskCountsByProject()
      : getTaskCountsByProjectFiltered(projectIds),
  ]);

  return (
    <ProjectsClient
      initialProjects={projects}
      clients={clients}
      taskCounts={taskCounts}
      isAdmin={isAdmin}
    />
  );
}
