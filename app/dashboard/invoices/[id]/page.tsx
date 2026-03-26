import { getInvoicesForList, getInvoiceById } from "@/lib/db/invoices";
import { getClientsForList } from "@/lib/db/clients";
import { getTeamMemberByEmail } from "@/lib/db/team-members";
import { createSupabaseServerClient } from "@/lib/supabase-server";
import InvoiceDetailClient from "./InvoiceDetailClient";

export const dynamic = "force-dynamic";

interface InvoiceDetailPageProps {
  params: Promise<{ id: string }>;
}

export default async function InvoiceDetailPage({ params }: InvoiceDetailPageProps) {
  const { id } = await params;

  const supabase = createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  const member = user?.email ? await getTeamMemberByEmail(user.email) : null;
  const isAdmin = member?.user_role === 'admin';

  // Fetch lightweight lists for sidebar + the specific invoice in parallel
  const [allInvoices, clients, invoice] = await Promise.all([
    getInvoicesForList(),
    getClientsForList(),
    getInvoiceById(id),
  ]);

  return (
    <InvoiceDetailClient
      invoiceId={id}
      allInvoices={allInvoices}
      clients={clients}
      initialInvoice={invoice}
      isAdmin={isAdmin}
    />
  );
}
