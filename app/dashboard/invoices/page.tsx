import { getInvoices } from "@/lib/db/invoices";
import { getClientsForList } from "@/lib/db/clients";
import InvoicesClient from "./InvoicesClient";

export default async function InvoicesPage() {
  // Use lightweight client list (no portal_password) for dropdown/display
  const [invoices, clients] = await Promise.all([
    getInvoices(),
    getClientsForList(),
  ]);

  return <InvoicesClient initialInvoices={invoices} clients={clients} />;
}
