import type { Metadata } from "next";
import { getInvoices, getInvoicesByMember } from "@/lib/db/invoices";

export const metadata: Metadata = { title: "Invoices" };
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
  const hasMember = Boolean(member);

  const [invoices, clients] = await Promise.all([
    !hasMember
      ? []
      : isAdmin ? getInvoices() : getInvoicesByMember(memberId),
    !hasMember
      ? []
      : isAdmin ? getClientsForList() : getClientsForListByMember(memberId),
  ]);

  return <InvoicesClient initialInvoices={invoices} clients={clients} isAdmin={isAdmin} />;
}
