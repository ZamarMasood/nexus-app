import type { Metadata } from "next";
import { getInvoicesPaginated, getInvoicesByMemberPaginated } from "@/lib/db/invoices";

export const metadata: Metadata = { title: "Invoices" };
import { getClientsForList, getClientsForListByMember } from "@/lib/db/clients";
import { getTeamMemberByEmail } from "@/lib/db/team-members";
import { createSupabaseServerClient } from "@/lib/supabase-server";
import InvoicesClient from "./InvoicesClient";

export const dynamic = "force-dynamic";

const PAGE_SIZE = 5;

export default async function InvoicesPage() {
  const supabase = createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  const member = user?.email ? await getTeamMemberByEmail(user.email) : null;
  const isAdmin = member?.user_role === 'admin';
  const memberId = member?.id ?? '';
  const hasMember = Boolean(member);

  const [invoicesResult, clients] = await Promise.all([
    !hasMember
      ? { data: [], total: 0 }
      : isAdmin
        ? getInvoicesPaginated(0, PAGE_SIZE)
        : getInvoicesByMemberPaginated(memberId, 0, PAGE_SIZE),
    !hasMember
      ? []
      : isAdmin ? getClientsForList() : getClientsForListByMember(memberId),
  ]);

  return (
    <InvoicesClient
      initialInvoices={invoicesResult.data}
      totalInvoices={invoicesResult.total}
      clients={clients}
      isAdmin={isAdmin}
    />
  );
}
