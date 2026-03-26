import type { Metadata } from "next";
import { getClients, getClientsByMember } from "@/lib/db/clients";

export const metadata: Metadata = { title: "Clients" };
import { getProjectsForList, getProjectsForListByMember } from "@/lib/db/projects";
import { getTeamMemberByEmail } from "@/lib/db/team-members";
import { createSupabaseServerClient } from "@/lib/supabase-server";
import ClientsClient from "./ClientsClient";

export const dynamic = "force-dynamic";

export default async function ClientsPage() {
  const supabase = createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  const member = user?.email ? await getTeamMemberByEmail(user.email) : null;
  const isAdmin = member?.user_role === 'admin';
  const memberId = member?.id ?? '';
  const hasMember = Boolean(member);

  const [clients, projects] = await Promise.all([
    !hasMember
      ? []
      : isAdmin ? getClients() : getClientsByMember(memberId),
    !hasMember
      ? []
      : isAdmin ? getProjectsForList() : getProjectsForListByMember(memberId),
  ]);

  return <ClientsClient initialClients={clients} projects={projects} isAdmin={isAdmin} />;
}
