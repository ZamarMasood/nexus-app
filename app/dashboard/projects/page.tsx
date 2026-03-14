import { getProjects } from "@/lib/db/projects";
import { getClients } from "@/lib/db/clients";
import { getTaskCountsByProject } from "@/lib/db/tasks";
import ProjectsClient from "./ProjectsClient";

export default async function ProjectsPage() {
  // Fetch task counts (only project_id + status) instead of ALL task rows
  const [projects, clients, taskCounts] = await Promise.all([
    getProjects(),
    getClients(),
    getTaskCountsByProject(),
  ]);

  return (
    <ProjectsClient
      initialProjects={projects}
      clients={clients}
      taskCounts={taskCounts}
    />
  );
}
