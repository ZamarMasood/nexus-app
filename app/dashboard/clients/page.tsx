import { getClients } from "@/lib/db/clients";
import { getProjects } from "@/lib/db/projects";
import ClientsClient from "./ClientsClient";

export default async function ClientsPage() {
  const [clients, projects] = await Promise.all([
    getClients(),
    getProjects(),
  ]);

  return <ClientsClient initialClients={clients} projects={projects} />;
}
