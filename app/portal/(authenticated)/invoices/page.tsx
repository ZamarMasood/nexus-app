import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import {
  Layers,
  Download,
  Receipt,
  CheckCircle,
  Clock,
  TrendingUp,
  AlertCircle,
  Calendar,
  ChevronRight,
} from "lucide-react";
import { getPortalInvoices } from "@/lib/db/portal";
import type { Invoice, InvoiceStatus } from "@/lib/types";

const STATUS_CONFIG: Record<string, { label: string; bg: string; text: string; dot: string; icon: any }> = {
  paid:    { label: "Paid",    bg: "rgba(38,201,127,0.12)",  text: "#26c97f",  dot: "#26c97f",  icon: CheckCircle },
  pending: { label: "Pending", bg: "rgba(231,157,19,0.12)",  text: "#e79d13",  dot: "#e79d13",  icon: Clock },
  overdue: { label: "Overdue", bg: "rgba(229,72,77,0.12)",   text: "#e5484d",  dot: "#e5484d",  icon: AlertCircle },
};

function StatusBadge({ status }: { status: InvoiceStatus }) {
  const config = STATUS_CONFIG[status] ?? STATUS_CONFIG.pending;
  const Icon = config.icon;
  return (
    <span
      className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md text-xs font-medium capitalize"
      style={{ background: config.bg, color: config.text }}
    >
      <Icon size={10} />
      {config.label}
    </span>
  );
}

function formatCurrency(amount: number | null): string {
  if (amount == null) return "—";
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(amount);
}

function formatDate(dateStr: string | null): string {
  if (!dateStr) return "—";
  return new Date(dateStr).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

export default async function PortalInvoicesPage() {
  const cookieStore = cookies();
  const clientId = cookieStore.get("portal_client_id")?.value;
  if (!clientId) redirect("/portal/login");

  const invoices = await getPortalInvoices(clientId);

  const totalAmount = invoices.reduce((s, i) => s + (i.amount ?? 0), 0);
  const paidAmount = invoices.filter((i) => i.status === "paid").reduce((s, i) => s + (i.amount ?? 0), 0);
  const pendingAmount = invoices.filter((i) => i.status !== "paid").reduce((s, i) => s + (i.amount ?? 0), 0);
  const overdueCount = invoices.filter((i) => i.status === "overdue").length;
  const paidCount = invoices.filter((i) => i.status === "paid").length;
  const collectionRate = totalAmount > 0 ? Math.round((paidAmount / totalAmount) * 100) : 0;

  return (
    <div className="flex flex-col h-full bg-[#0d0d0d]">

      {/* Header toolbar */}
      <div className="flex items-center justify-between px-6 h-[60px] border-b border-[rgba(255,255,255,0.06)] shrink-0">
        <div className="flex items-center gap-3">
          <Layers size={16} className="text-[#555]" />
          <h1 className="text-[15px] font-medium text-[#e8e8e8]">Invoices</h1>
          <span className="text-[12px] text-[#555]">{invoices.length} total</span>
        </div>
      </div>

      {/* Main content */}
      <div className="flex-1 overflow-y-auto">
        <div className="p-6">

          {/* Stats cards */}
          {invoices.length > 0 && (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
              <div className="rounded-xl border border-[rgba(255,255,255,0.06)] bg-[#111111] p-4">
                <div className="flex items-center gap-2 mb-2">
                  <Receipt size={14} className="text-[#5e6ad2]" />
                  <span className="text-[11px] text-[#555]">Total Invoices</span>
                </div>
                <p className="text-[24px] font-medium text-[#e8e8e8]">{invoices.length}</p>
                <p className="text-[11px] text-[#555] mt-1">{formatCurrency(totalAmount)} total</p>
              </div>

              <div className="rounded-xl border border-[rgba(255,255,255,0.06)] bg-[#111111] p-4">
                <div className="flex items-center gap-2 mb-2">
                  <CheckCircle size={14} className="text-[#26c97f]" />
                  <span className="text-[11px] text-[#555]">Paid</span>
                </div>
                <p className="text-[24px] font-medium text-[#26c97f]">{paidCount}</p>
                <p className="text-[11px] text-[#555] mt-1">{formatCurrency(paidAmount)} collected</p>
              </div>

              <div className="rounded-xl border border-[rgba(255,255,255,0.06)] bg-[#111111] p-4">
                <div className="flex items-center gap-2 mb-2">
                  <Clock size={14} className="text-[#e79d13]" />
                  <span className="text-[11px] text-[#555]">Outstanding</span>
                </div>
                <p className="text-[24px] font-medium text-[#e79d13]">{invoices.filter((i) => i.status !== "paid").length}</p>
                <p className="text-[11px] text-[#555] mt-1">{formatCurrency(pendingAmount)} pending</p>
              </div>

              <div className="rounded-xl border border-[rgba(255,255,255,0.06)] bg-[#111111] p-4">
                <div className="flex items-center gap-2 mb-2">
                  <TrendingUp size={14} className="text-[#5e6ad2]" />
                  <span className="text-[11px] text-[#555]">Collection Rate</span>
                </div>
                <p className="text-[24px] font-medium text-[#e8e8e8]">{collectionRate}%</p>
                <div className="mt-2 h-1 rounded-full bg-[rgba(255,255,255,0.06)] overflow-hidden">
                  <div
                    className="h-full rounded-full"
                    style={{ width: `${collectionRate}%`, background: "#5e6ad2" }}
                  />
                </div>
              </div>
            </div>
          )}

          {/* Overdue warning */}
          {overdueCount > 0 && (
            <div className="mb-6 rounded-lg bg-[rgba(229,72,77,0.1)] border border-[rgba(229,72,77,0.2)] p-3">
              <div className="flex items-center gap-2">
                <AlertCircle size={14} className="text-[#e5484d]" />
                <span className="text-[12px] text-[#e5484d]">
                  {overdueCount === 1
                    ? "You have 1 overdue invoice."
                    : `You have ${overdueCount} overdue invoices.`}
                </span>
              </div>
            </div>
          )}

          {/* Invoices table */}
          {invoices.length === 0 ? (
            <div className="text-center py-12">
              <div className="flex h-14 w-14 mx-auto items-center justify-center rounded-lg bg-[#111111] border border-[rgba(255,255,255,0.06)] mb-4">
                <Receipt className="h-6 w-6 text-[#555]" />
              </div>
              <p className="text-[13px] text-[#888] mb-2">No invoices yet</p>
              <p className="text-[12px] text-[#444]">Your invoices will appear here once issued.</p>
            </div>
          ) : (
            <div className="rounded-lg border border-[rgba(255,255,255,0.06)] overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-[rgba(255,255,255,0.06)] bg-[#111111]">
                      <th className="px-5 py-3 text-left text-[11px] font-medium text-[#555] uppercase tracking-[0.06em]">
                        Invoice #
                      </th>
                      <th className="px-5 py-3 text-left text-[11px] font-medium text-[#555] uppercase tracking-[0.06em]">
                        Amount
                      </th>
                      <th className="px-5 py-3 text-left text-[11px] font-medium text-[#555] uppercase tracking-[0.06em]">
                        Status
                      </th>
                      <th className="px-5 py-3 text-left text-[11px] font-medium text-[#555] uppercase tracking-[0.06em] hidden sm:table-cell">
                        Due Date
                      </th>
                      <th className="px-5 py-3 w-8" />
                    </tr>
                  </thead>
                  <tbody>
                    {invoices.map((invoice) => {
                      const status = (invoice.status as InvoiceStatus) ?? "pending";
                      const isOverdue = status === "overdue";
                      const dueDate = invoice.due_date ? new Date(invoice.due_date) : null;
                      const today = new Date();
                      const isDueSoon =
                        dueDate &&
                        !isOverdue &&
                        (dueDate.getTime() - today.getTime()) / (1000 * 3600 * 24) <= 7;

                      return (
                        <tr
                          key={invoice.id}
                          className="group border-b border-[rgba(255,255,255,0.06)] last:border-0
                            hover:bg-[#1c1c1c] transition-colors duration-[120ms]"
                        >
                          <td className="px-5 py-3.5">
                            <span className="text-[13px] font-medium text-[#f0f0f0] font-mono">
                              {invoice.invoice_number ?? `#${invoice.id.slice(0, 8)}`}
                            </span>
                          </td>

                          <td className="px-5 py-3.5">
                            <span className="text-[13px] font-medium text-[#f0f0f0] tabular-nums">
                              {formatCurrency(invoice.amount)}
                            </span>
                          </td>

                          <td className="px-5 py-3.5">
                            <StatusBadge status={status} />
                          </td>

                          <td className="px-5 py-3.5 hidden sm:table-cell">
                            {invoice.due_date ? (
                              <div className="flex items-center gap-1.5">
                                <Calendar
                                  size={12}
                                  className={`flex-shrink-0 ${
                                    isOverdue ? "text-[#e5484d]" : isDueSoon ? "text-[#e79d13]" : "text-[#555]"
                                  }`}
                                />
                                <span
                                  className={`text-[12px] tabular-nums ${
                                    isOverdue ? "text-[#e5484d]" : isDueSoon ? "text-[#e79d13]" : "text-[#555]"
                                  }`}
                                >
                                  {formatDate(invoice.due_date)}
                                </span>
                              </div>
                            ) : (
                              <span className="text-[12px] text-[#3a3a3a]">—</span>
                            )}
                          </td>

                          <td className="px-5 py-3.5 text-right">
                            {invoice.pdf_url ? (
                              <a
                                href={invoice.pdf_url}
                                download
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md
                                  text-[12px] font-medium text-[#5e6ad2] bg-[rgba(94,106,210,0.15)]
                                  hover:bg-[#5e6ad2] hover:text-white
                                  transition-colors duration-150
                                  focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[rgba(94,106,210,0.35)]"
                              >
                                <Download size={12} />
                                PDF
                              </a>
                            ) : (
                              <ChevronRight
                                size={14}
                                className="text-[#3a3a3a] group-hover:text-[#555]
                                  transition-colors duration-150 ml-auto"
                              />
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
