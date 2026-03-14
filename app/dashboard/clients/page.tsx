import { getClients } from "@/lib/db/clients";
import { getProjectsForList } from "@/lib/db/projects";
import ClientsClient from "./ClientsClient";

export default async function ClientsPage() {
  // Use lightweight project list (only need client_id + status for counting)
  const [clients, projects] = await Promise.all([
    getClients(),
    getProjectsForList(),
  ]);

  return <ClientsClient initialClients={clients} projects={projects} />;
}
