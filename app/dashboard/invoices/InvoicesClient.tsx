"use client";

import { useState, useMemo, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import {
  ChevronRight,
  ChevronLeft,
  Layers,
  Plus,
  Search,
  Receipt,
  DollarSign,
  Calendar,
  AlertCircle,
  CheckCircle,
  Clock,
  TrendingUp
} from "lucide-react";
import {
  Dialog,
  DialogContent,
} from "@/components/ui/dialog";
import { InvoiceForm } from "@/components/invoices/InvoiceForm";
import { formatCurrency, formatDate } from "@/lib/utils";
import { useWorkspaceSlug } from "@/app/dashboard/workspace-context";
import { fetchInvoicesPageAction } from "@/app/dashboard/invoices/actions";
import { EmptyState } from "@/components/layout/EmptyState";
import type { ClientListItem } from "@/lib/db/clients";
import type { Invoice, InvoiceStatus } from "@/lib/types";

const PAGE_SIZE = 5;

const STATUS_CONFIG: Record<string, { label: string; bg: string; text: string; dot: string; icon: any }> = {
  paid: {
    label: "Paid",
    bg: 'rgba(38,201,127,0.12)',
    text: '#26c97f',
    dot: '#26c97f',
    icon: CheckCircle
  },
  pending: {
    label: "Pending",
    bg: 'rgba(231,157,19,0.12)',
    text: '#e79d13',
    dot: '#e79d13',
    icon: Clock
  },
  overdue: {
    label: "Overdue",
    bg: 'rgba(229,72,77,0.12)',
    text: '#e5484d',
    dot: '#e5484d',
    icon: AlertCircle
  },
};

function StatusBadge({ status }: { status: InvoiceStatus }) {
  const config = STATUS_CONFIG[status] ?? STATUS_CONFIG.pending;
  const Icon = config.icon;

  return (
    <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md text-xs font-medium capitalize"
      style={{ background: config.bg, color: config.text }}>
      <Icon size={10} />
      {config.label}
    </span>
  );
}

interface InvoicesClientProps {
  initialInvoices: Invoice[];
  totalInvoices: number;
  clients: ClientListItem[];
  isAdmin: boolean;
}

export default function InvoicesClient({ initialInvoices, totalInvoices, clients: initialClients, isAdmin }: InvoicesClientProps) {
  const router = useRouter();
  const slug = useWorkspaceSlug();
  const [invoices, setInvoices] = useState<Invoice[]>(initialInvoices);
  const [total, setTotal] = useState(totalInvoices);
  const [clients, setClients] = useState<ClientListItem[]>(initialClients);
  const [currentPage, setCurrentPage] = useState(0);
  const [loading, setLoading] = useState(false);
  const [filter, setFilter] = useState<InvoiceStatus | "all">("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [createOpen, setCreateOpen] = useState(false);

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  useEffect(() => {
    setInvoices(initialInvoices);
    setTotal(totalInvoices);
    setClients(initialClients);
    setCurrentPage(0);
  }, [initialInvoices, totalInvoices, initialClients]);

  const fetchPage = useCallback(async (page: number) => {
    setLoading(true);
    try {
      const result = await fetchInvoicesPageAction(page, PAGE_SIZE);
      setInvoices(result.invoices);
      setTotal(result.total);
      setClients(result.clients);
      setCurrentPage(page);
    } finally {
      setLoading(false);
    }
  }, []);

  const clientMap = useMemo(() => {
    const m: Record<string, string> = {};
    for (const c of clients) m[c.id] = c.name;
    return m;
  }, [clients]);

  // Calculate stats from current page
  const totalAmount = invoices.reduce((sum, inv) => sum + (inv.amount || 0), 0);
  const paidAmount = invoices
    .filter(inv => inv.status === "paid")
    .reduce((sum, inv) => sum + (inv.amount || 0), 0);
  const pendingAmount = invoices
    .filter(inv => inv.status === "pending")
    .reduce((sum, inv) => sum + (inv.amount || 0), 0);
  const overdueCount = invoices.filter(inv => inv.status === "overdue").length;
  const paidCount = invoices.filter(inv => inv.status === "paid").length;
  const collectionRate = totalAmount > 0 ? Math.round((paidAmount / totalAmount) * 100) : 0;

  // Filter invoices (client-side on current page)
  const filteredInvoices = useMemo(() => {
    let filtered = filter === "all" ? invoices : invoices.filter((inv) => inv.status === filter);

    if (searchQuery) {
      filtered = filtered.filter(inv => {
        const invoiceNumber = inv.invoice_number?.toLowerCase() || "";
        const clientName = inv.client_id ? (clientMap[inv.client_id]?.toLowerCase() || "") : "";
        return invoiceNumber.includes(searchQuery.toLowerCase()) ||
               clientName.includes(searchQuery.toLowerCase());
      });
    }

    return filtered;
  }, [invoices, filter, searchQuery, clientMap]);

  async function handleInvoiceCreated() {
    setCreateOpen(false);
    await fetchPage(0);
    router.refresh();
  }

  return (
    <div className="flex flex-col h-full bg-[#0d0d0d]">

      {/* Header toolbar */}
      <div className="flex items-center justify-between px-6 h-[60px] border-b border-[rgba(255,255,255,0.06)] shrink-0">
        <div className="flex items-center gap-3">
          <Layers size={16} className="text-[#555]" />
          <h1 className="text-[15px] font-medium text-[#e8e8e8]">Invoices</h1>
          <span className="text-[12px] text-[#555]">{total} total</span>
        </div>
        {isAdmin && (
          <button
            onClick={() => setCreateOpen(true)}
            className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium
              bg-[#5e6ad2] hover:bg-[#6872e5] text-white transition-colors duration-150"
          >
            <Plus size={14} />
            Create Invoice
          </button>
        )}
      </div>

      {/* Main content */}
      <div className="flex-1 overflow-y-auto">
        <div className="p-6">

          {/* Stats cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            <div className="rounded-xl border border-[rgba(255,255,255,0.06)] bg-[#111111] p-4">
              <div className="flex items-center gap-2 mb-2">
                <Receipt size={14} className="text-[#5e6ad2]" />
                <span className="text-[11px] text-[#555]">Total Invoices</span>
              </div>
              <p className="text-[24px] font-medium text-[#e8e8e8]">{total}</p>
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
                <span className="text-[11px] text-[#555]">Pending</span>
              </div>
              <p className="text-[24px] font-medium text-[#e79d13]">{invoices.filter(i => i.status === "pending").length}</p>
              <p className="text-[11px] text-[#555] mt-1">{formatCurrency(pendingAmount)} outstanding</p>
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
                  style={{ width: `${collectionRate}%`, background: '#5e6ad2', transition: 'width 300ms ease-out' }}
                />
              </div>
            </div>
          </div>

          {/* Warning for overdue invoices */}
          {overdueCount > 0 && (
            <div className="mb-6 rounded-lg bg-[rgba(229,72,77,0.1)] border border-[rgba(229,72,77,0.2)] p-3">
              <div className="flex items-center gap-2">
                <AlertCircle size={14} className="text-[#e5484d]" />
                <span className="text-[12px] text-[#e5484d]">
                  {overdueCount} {overdueCount === 1 ? 'invoice is' : 'invoices are'} overdue. Please follow up with clients.
                </span>
              </div>
            </div>
          )}

          {/* Search and Filter */}
          <div className="flex flex-col sm:flex-row gap-3 mb-6">
            <div className="flex-1 relative">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#555]" />
              <input
                type="text"
                placeholder="Search by invoice number or client..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-3 py-2 rounded-lg
                  bg-[#111111] border border-[rgba(255,255,255,0.08)]
                  text-[13px] text-[#f0f0f0] placeholder:text-[#555]
                  focus:outline-none focus:border-[rgba(94,106,210,0.5)]
                  transition-colors duration-150"
              />
            </div>
            <div className="flex gap-2">
              {["all", "pending", "paid", "overdue"].map((filterValue) => (
                <button
                  key={filterValue}
                  onClick={() => setFilter(filterValue as InvoiceStatus | "all")}
                  className={`px-3 py-1.5 rounded-lg text-[12px] font-medium transition-colors duration-150
                    ${filter === filterValue
                      ? 'bg-[#5e6ad2] text-white'
                      : 'bg-[#111111] text-[#888] hover:text-[#e8e8e8] border border-[rgba(255,255,255,0.08)]'}`}
                >
                  {filterValue === "all" ? "All" : filterValue.charAt(0).toUpperCase() + filterValue.slice(1)}
                </button>
              ))}
            </div>
          </div>

          {/* Invoices Table */}
          {filteredInvoices.length === 0 && !loading ? (
            <div className="text-center py-12">
              <p className="text-[13px] text-[#888] mb-2">
                {searchQuery || filter !== "all" ? "No invoices found" : "No invoices yet"}
              </p>
              {isAdmin && !searchQuery && filter === "all" && (
                <button
                  onClick={() => setCreateOpen(true)}
                  className="text-[12px] text-[#5e6ad2] hover:text-[#7e8ae6] transition-colors duration-150"
                >
                  Create your first invoice →
                </button>
              )}
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
                      <th className="px-5 py-3 text-left text-[11px] font-medium text-[#555] uppercase tracking-[0.06em] hidden sm:table-cell">
                        Client
                      </th>
                      <th className="px-5 py-3 text-left text-[11px] font-medium text-[#555] uppercase tracking-[0.06em]">
                        Amount
                      </th>
                      <th className="px-5 py-3 text-left text-[11px] font-medium text-[#555] uppercase tracking-[0.06em]">
                        Status
                      </th>
                      <th className="px-5 py-3 text-left text-[11px] font-medium text-[#555] uppercase tracking-[0.06em] hidden md:table-cell">
                        Due Date
                      </th>
                      <th className="px-5 py-3 w-8" />
                     </tr>
                  </thead>
                  <tbody className={loading ? 'opacity-50 pointer-events-none' : ''}>
                    {filteredInvoices.map((inv) => {
                      const status = (inv.status ?? "pending") as InvoiceStatus;
                      const isOverdue = status === "overdue";
                      const dueDate = inv.due_date ? new Date(inv.due_date) : null;
                      const today = new Date();
                      const isDueSoon = dueDate && !isOverdue &&
                        (dueDate.getTime() - today.getTime()) / (1000 * 3600 * 24) <= 7;

                      return (
                        <tr
                          key={inv.id}
                          onClick={() => router.push(`/${slug}/invoices/${inv.id}`)}
                          className="group border-b border-[rgba(255,255,255,0.06)] last:border-0
                            hover:bg-[#1c1c1c] cursor-pointer transition-colors duration-[120ms]"
                        >
                          <td className="px-5 py-3.5">
                            <div>
                              <span className="text-[13px] font-medium text-[#f0f0f0] font-mono">
                                {inv.invoice_number ?? "—"}
                              </span>
                              {inv.client_id && (
                                <span className="text-[11px] text-[#555] block truncate sm:hidden mt-0.5">
                                  {clientMap[inv.client_id] ?? "—"}
                                </span>
                              )}
                            </div>
                          </td>

                          <td className="px-5 py-3.5 hidden sm:table-cell">
                            <span className="text-[13px] text-[#888]">
                              {inv.client_id ? (clientMap[inv.client_id] ?? "—") : "—"}
                            </span>
                          </td>

                          <td className="px-5 py-3.5">
                            <span className="text-[13px] font-medium text-[#f0f0f0] tabular-nums">
                              {inv.amount != null ? formatCurrency(inv.amount) : "—"}
                            </span>
                          </td>

                          <td className="px-5 py-3.5">
                            <StatusBadge status={status} />
                          </td>

                          <td className="px-5 py-3.5 hidden md:table-cell">
                            {inv.due_date ? (
                              <div className="flex items-center gap-1.5">
                                <Calendar size={12} className={`flex-shrink-0 ${isOverdue ? 'text-[#e5484d]' : isDueSoon ? 'text-[#e79d13]' : 'text-[#555]'}`} />
                                <span className={`text-[12px] tabular-nums ${isOverdue ? 'text-[#e5484d]' : isDueSoon ? 'text-[#e79d13]' : 'text-[#555]'}`}>
                                  {formatDate(inv.due_date)}
                                  {isDueSoon && !isOverdue && " (Soon)"}
                                </span>
                              </div>
                            ) : (
                              <span className="text-[12px] text-[#3a3a3a]">—</span>
                            )}
                          </td>

                          <td className="px-5 py-3.5 text-right">
                            <ChevronRight size={14} className="text-[#3a3a3a] group-hover:text-[#555]
                              transition-colors duration-150 ml-auto" />
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {/* Pagination controls */}
              {totalPages > 1 && (
                <div className="flex items-center justify-between px-5 py-3
                  border-t border-[rgba(255,255,255,0.06)] bg-[#111111]">
                  <span className="text-[12px] text-[#555]">
                    Page {currentPage + 1} of {totalPages}
                  </span>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => fetchPage(currentPage - 1)}
                      disabled={currentPage === 0 || loading}
                      className="flex items-center gap-1 px-3 py-1.5 rounded-md text-[12px] font-medium
                        text-[#888] hover:text-[#e8e8e8] hover:bg-white/5
                        disabled:opacity-30 disabled:cursor-not-allowed disabled:hover:bg-transparent disabled:hover:text-[#888]
                        transition-colors duration-150"
                    >
                      <ChevronLeft size={14} />
                      Previous
                    </button>
                    <div className="flex items-center gap-1">
                      {Array.from({ length: totalPages }, (_, i) => (
                        <button
                          key={i}
                          onClick={() => fetchPage(i)}
                          disabled={loading}
                          className={`w-8 h-8 rounded-md text-[12px] font-medium transition-colors duration-150
                            ${i === currentPage
                              ? 'bg-[#5e6ad2] text-white'
                              : 'text-[#888] hover:text-[#e8e8e8] hover:bg-white/5'
                            }
                            disabled:cursor-not-allowed`}
                        >
                          {i + 1}
                        </button>
                      ))}
                    </div>
                    <button
                      onClick={() => fetchPage(currentPage + 1)}
                      disabled={currentPage >= totalPages - 1 || loading}
                      className="flex items-center gap-1 px-3 py-1.5 rounded-md text-[12px] font-medium
                        text-[#888] hover:text-[#e8e8e8] hover:bg-white/5
                        disabled:opacity-30 disabled:cursor-not-allowed disabled:hover:bg-transparent disabled:hover:text-[#888]
                        transition-colors duration-150"
                    >
                      Next
                      <ChevronRight size={14} />
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent className="
          bg-[#111111] border border-[rgba(255,255,255,0.08)] rounded-xl
          shadow-2xl p-0 gap-0 max-w-[560px] w-full">
          <div className="flex items-center justify-between px-6 pt-5 pb-4
            border-b border-[rgba(255,255,255,0.06)]">
            <div>
              <h3 className="text-[15px] font-medium text-[#f0f0f0]">Create Invoice</h3>
              <p className="text-[11px] text-[#555] mt-1">Generate a new invoice for a client</p>
            </div>
          </div>
          <div className="p-6">
            <InvoiceForm onSuccess={handleInvoiceCreated} onCancel={() => setCreateOpen(false)} />
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
