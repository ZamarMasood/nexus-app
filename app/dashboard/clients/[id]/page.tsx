import { getClientsForSidebar, getClientById } from "@/lib/db/clients";
import { getProjectsForList } from "@/lib/db/projects";
import { getInvoicesForList } from "@/lib/db/invoices";
import { getTeamMemberByEmail } from "@/lib/db/team-members";
import { createSupabaseServerClient } from "@/lib/supabase-server";
import ClientDetailClient from "./ClientDetailClient";

export const dynamic = "force-dynamic";

interface ClientDetailPageProps {
  params: Promise<{ id: string }>;
}

export default async function ClientDetailPage({ params }: ClientDetailPageProps) {
  const { id } = await params;

  const supabase = createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  const member = user?.email ? await getTeamMemberByEmail(user.email) : null;
  const isAdmin = member?.user_role === 'admin';

  // Fetch limited sidebar list (20 recent) + specific client + related data in parallel
  const [sidebarClients, client, projects, invoices] = await Promise.all([
    getClientsForSidebar(5),
    getClientById(id),
    getProjectsForList(id),
    getInvoicesForList(id),
  ]);

  return (
    <ClientDetailClient
      clientId={id}
      initialSidebarClients={sidebarClients}
      initialClient={client}
      initialProjects={projects}
      initialInvoices={invoices}
      isAdmin={isAdmin}
    />
  );
}
