import { getProjectsForList, getProjectById } from "@/lib/db/projects";
import { getClientsForList } from "@/lib/db/clients";
import { getTasksWithAssignees } from "@/lib/db/tasks";
import { getIsAdminByEmail } from "@/lib/db/team-members";
import { createSupabaseServerClient } from "@/lib/supabase-server";
import ProjectDetailClient from "./ProjectDetailClient";

export const dynamic = "force-dynamic";

interface ProjectDetailPageProps {
  params: Promise<{ id: string }>;
}

export default async function ProjectDetailPage({ params }: ProjectDetailPageProps) {
  const { id } = await params;

  const supabase = createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  const isAdmin = user?.email ? await getIsAdminByEmail(user.email) : false;

  const [allProjects, clients, project, tasks] = await Promise.all([
    getProjectsForList(),
    getClientsForList(),
    getProjectById(id),
    getTasksWithAssignees(id),
  ]);

  return (
    <ProjectDetailClient
      projectId={id}
      allProjects={allProjects}
      clients={clients}
      initialProject={project}
      initialTasks={tasks}
      isAdmin={isAdmin}
    />
  );
}
