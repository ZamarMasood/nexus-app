import { getInvoicesForList, getInvoiceById } from "@/lib/db/invoices";
import { getClientsForList } from "@/lib/db/clients";
import InvoiceDetailClient from "./InvoiceDetailClient";

export const dynamic = "force-dynamic";

interface InvoiceDetailPageProps {
  params: Promise<{ id: string }>;
}

export default async function InvoiceDetailPage({ params }: InvoiceDetailPageProps) {
  const { id } = await params;

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
    />
  );
}
