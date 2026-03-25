import { getInvoices, getInvoicesByMember } from "@/lib/db/invoices";
import { getClientsForList, getClientsForListByMember } from "@/lib/db/clients";
import { getTeamMemberByEmail } from "@/lib/db/team-members";
import { createSupabaseServerClient } from "@/lib/supabase-server";
import InvoicesClient from "./InvoicesClient";

export const dynamic = "force-dynamic";

export default async function InvoicesPage() {
  const supabase = createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  const member = user?.email ? await getTeamMemberByEmail(user.email) : null;
  const isAdmin = member?.user_role === 'admin';
  const memberId = member?.id ?? '';

  const [invoices, clients] = await Promise.all([
    isAdmin ? getInvoices() : getInvoicesByMember(memberId),
    // Admin needs all clients for the "New Invoice" dropdown; members see only their clients
    isAdmin ? getClientsForList() : getClientsForListByMember(memberId),
  ]);

  return <InvoicesClient initialInvoices={invoices} clients={clients} isAdmin={isAdmin} />;
}
