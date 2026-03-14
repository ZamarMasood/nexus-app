import { getProjects } from "@/lib/db/projects";
import { getClients } from "@/lib/db/clients";
import { getTasks } from "@/lib/db/tasks";
import ProjectsClient from "./ProjectsClient";

export default async function ProjectsPage() {
  const [projects, clients, tasks] = await Promise.all([
    getProjects(),
    getClients(),
    getTasks(),
  ]);

  return (
    <ProjectsClient
      initialProjects={projects}
      clients={clients}
      tasks={tasks}
    />
  );
}
