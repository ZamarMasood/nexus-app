import { getInvoices } from "@/lib/db/invoices";
import { getClients } from "@/lib/db/clients";
import InvoicesClient from "./InvoicesClient";

export default async function InvoicesPage() {
  const [invoices, clients] = await Promise.all([
    getInvoices(),
    getClients(),
  ]);

  return <InvoicesClient initialInvoices={invoices} clients={clients} />;
}
