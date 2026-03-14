import { getClientsForList, getClientById } from "@/lib/db/clients";
import { getProjectsForList } from "@/lib/db/projects";
import { getInvoicesForList } from "@/lib/db/invoices";
import ClientDetailClient from "./ClientDetailClient";

interface ClientDetailPageProps {
  params: Promise<{ id: string }>;
}

export default async function ClientDetailPage({ params }: ClientDetailPageProps) {
  const { id } = await params;

  // Fetch lightweight sidebar list + specific client + related data in parallel
  const [allClients, client, projects, invoices] = await Promise.all([
    getClientsForList(),
    getClientById(id),
    getProjectsForList(id),
    getInvoicesForList(id),
  ]);

  return (
    <ClientDetailClient
      clientId={id}
      allClients={allClients}
      initialClient={client}
      initialProjects={projects}
      initialInvoices={invoices}
    />
  );
}
