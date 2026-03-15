"use client";

import { useState, useMemo, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Plus, Receipt, ChevronRight, DollarSign, Clock, AlertTriangle, TrendingUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { InvoiceForm } from "@/components/invoices/InvoiceForm";
import { formatCurrency, formatDate } from "@/lib/utils";
import type { ClientListItem } from "@/lib/db/clients";
import type { Invoice, InvoiceStatus } from "@/lib/types";

const STATUS_FILTERS: { value: InvoiceStatus | "all"; label: string }[] = [
  { value: "all",     label: "All"     },
  { value: "pending", label: "Pending" },
  { value: "paid",    label: "Paid"    },
  { value: "overdue", label: "Overdue" },
];

const STATUS_BADGE: Record<InvoiceStatus, string> = {
  paid:    "bg-emerald-400/10 text-emerald-400 ring-1 ring-emerald-400/20",
  pending: "bg-amber-400/10 text-amber-400 ring-1 ring-amber-400/20",
  overdue: "bg-rose-400/10 text-rose-400 ring-1 ring-rose-400/20",
};

const STATUS_DOT: Record<InvoiceStatus, string> = {
  paid:    "bg-emerald-400",
  pending: "bg-amber-400",
  overdue: "bg-rose-400",
};

interface InvoicesClientProps {
  initialInvoices: Invoice[];
  clients: ClientListItem[];
}

export default function InvoicesClient({ initialInvoices, clients }: InvoicesClientProps) {
  const router = useRouter();
  const [invoices, setInvoices] = useState<Invoice[]>(initialInvoices);
  const [filter, setFilter]     = useState<InvoiceStatus | "all">("all");
  const [createOpen, setCreateOpen] = useState(false);

  // Sync local state when server re-renders with fresh data (after router.refresh)
  useEffect(() => { setInvoices(initialInvoices); }, [initialInvoices]);

  const clientMap = useMemo(() => {
    const m: Record<string, string> = {};
    for (const c of clients) m[c.id] = c.name;
    return m;
  }, [clients]);

  const filtered = useMemo(
    () => filter === "all" ? invoices : invoices.filter((inv) => inv.status === filter),
    [invoices, filter]
  );

  const totals = useMemo(() => {
    const paid        = invoices.filter((i) => i.status === "paid").reduce((s, i) => s + (i.amount ?? 0), 0);
    const pending     = invoices.filter((i) => i.status === "pending").reduce((s, i) => s + (i.amount ?? 0), 0);
    const overdue     = invoices.filter((i) => i.status === "overdue").reduce((s, i) => s + (i.amount ?? 0), 0);
    const overdueCount = invoices.filter((i) => i.status === "overdue").length;
    return { paid, pending, overdue, overdueCount };
  }, [invoices]);

  function handleInvoiceCreated(invoice: Invoice) {
    setInvoices((prev) => [invoice, ...prev]);
    setCreateOpen(false);
    router.refresh();
  }

  const summaryCards = [
    {
      label:     "Total Invoices",
      value:     String(invoices.length),
      icon:      Receipt,
      accent:    "from-surface-inset/60 to-transparent",
      iconBg:    "bg-surface-inset",
      iconColor: "text-muted-app",
    },
    {
      label:     "Collected",
      value:     formatCurrency(totals.paid),
      icon:      TrendingUp,
      accent:    "from-emerald-500/20 to-emerald-600/5",
      iconBg:    "bg-emerald-500/10",
      iconColor: "text-emerald-400",
    },
    {
      label:     "Pending",
      value:     formatCurrency(totals.pending),
      icon:      Clock,
      accent:    "from-amber-500/20 to-amber-600/5",
      iconBg:    "bg-amber-500/10",
      iconColor: "text-amber-400",
    },
    {
      label:     totals.overdueCount > 0 ? `${totals.overdueCount} Overdue` : "Overdue",
      value:     totals.overdue > 0 ? formatCurrency(totals.overdue) : "None",
      icon:      totals.overdueCount > 0 ? AlertTriangle : DollarSign,
      accent:    totals.overdueCount > 0 ? "from-rose-500/20 to-rose-600/5" : "",
      iconBg:    totals.overdueCount > 0 ? "bg-rose-500/10" : "bg-surface-inset",
      iconColor: totals.overdueCount > 0 ? "text-rose-400" : "text-faint-app",
      valueColor: totals.overdueCount > 0 ? "text-rose-400" : undefined,
    },
  ];

  return (
    <div className="p-6 sm:p-8 lg:p-10">

      {/* Header */}
      <div className="mb-6 flex flex-wrap items-start justify-between gap-3 animate-in" style={{ animationDelay: "0ms" }}>
        <div>
          <h1 className="text-2xl font-bold tracking-[-0.03em] text-bright">Invoices</h1>
          <p className="mt-0.5 text-sm text-faint-app">
            {invoices.length} invoice{invoices.length !== 1 ? "s" : ""} total
          </p>
        </div>
        <Button
          onClick={() => setCreateOpen(true)}
          className="gap-1.5 bg-violet-600 hover:bg-violet-500 text-white shadow-[0_4px_24px_rgba(139,92,246,0.35),0_1px_4px_rgba(0,0,0,0.4)] hover:shadow-[0_4px_28px_rgba(139,92,246,0.5)] transition-[background-color,box-shadow] focus-visible:ring-violet-500"
        >
          <Plus className="h-4 w-4" />
          Create Invoice
        </Button>
      </div>

      {/* Summary cards */}
      <div className="mb-6 grid grid-cols-2 gap-4 sm:grid-cols-4">
        {summaryCards.map(({ label, value, icon: Icon, accent, iconBg, iconColor, valueColor }, i) => (
          <div
            key={label}
            className="relative overflow-hidden rounded-2xl border border-surface bg-surface-card p-5 animate-in"
            style={{ animationDelay: `${80 + i * 60}ms` }}
          >
            {accent && (
              <>
                <div className={`absolute inset-x-0 top-0 h-px bg-gradient-to-r ${accent}`} />
                <div className={`absolute inset-x-0 top-0 h-16 bg-gradient-to-b ${accent} opacity-40`} />
              </>
            )}
            <div className="relative">
              <div className={`mb-3 flex h-9 w-9 items-center justify-center rounded-xl ${iconBg}`}>
                <Icon className={`h-4 w-4 ${iconColor}`} />
              </div>
              <p className={`text-[22px] font-bold tracking-[-0.03em] leading-none ${valueColor ?? "text-bright"}`}>
                {value}
              </p>
              <p className="mt-2 text-[11px] font-medium text-dim-app">{label}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="mb-4 flex gap-1.5 animate-in" style={{ animationDelay: "340ms" }}>
        {STATUS_FILTERS.map(({ value, label }) => (
          <button
            key={value}
            onClick={() => setFilter(value)}
            className={[
              "rounded-lg px-3 py-1.5 text-xs font-medium transition-[background-color,color,box-shadow]",
              "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-500",
              filter === value
                ? "bg-violet-600 text-white shadow-[0_1px_6px_rgba(124,58,237,0.35)]"
                : "bg-surface-subtle text-secondary-app hover:bg-surface-inset border border-surface",
            ].join(" ")}
          >
            {label}
          </button>
        ))}
      </div>

      {/* Table */}
      <div
        className="rounded-xl border border-surface animate-in"
        style={{ animationDelay: "400ms" }}
      >
        <div className="overflow-hidden rounded-xl bg-surface-card">
          {filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center gap-3 py-16 text-center">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-surface-inset border border-surface">
                <Receipt className="h-5 w-5 text-faint-app" />
              </div>
              <p className="text-sm font-medium text-muted-app">No invoices found</p>
              <p className="text-xs text-dim-app">
                {filter !== "all" ? `No ${filter} invoices` : "Create your first invoice to get started"}
              </p>
            </div>
          ) : (
            <table className="w-full">
              <thead>
                <tr className="border-b border-surface bg-overlay-xs">
                  {[
                    { label: "Invoice #", hide: false },
                    { label: "Client",    hide: true  },
                    { label: "Amount",    hide: false },
                    { label: "Status",    hide: false },
                    { label: "Due Date",  hide: true  },
                  ].map(({ label, hide }) => (
                    <th key={label} className={`px-3 sm:px-5 py-3 text-left text-[10px] font-semibold uppercase tracking-widest text-dim-app ${hide ? "hidden sm:table-cell" : ""}`}>
                      {label}
                    </th>
                  ))}
                  <th className="px-5 py-3" />
                </tr>
              </thead>
              <tbody>
                {filtered.map((inv, i) => {
                  const status = (inv.status ?? "pending") as InvoiceStatus;
                  return (
                    <tr
                      key={inv.id}
                      onClick={() => router.push(`/dashboard/invoices/${inv.id}`)}
                      className="group cursor-pointer border-b border-surface last:border-0 transition-[background-color] duration-100 hover:bg-overlay-sm animate-in"
                      style={{ animationDelay: `${460 + i * 35}ms` }}
                    >
                      <td className="px-3 sm:px-5 py-3.5 font-mono text-sm font-semibold text-primary-app transition-colors group-hover:text-violet-400">
                        {inv.invoice_number ?? "—"}
                      </td>
                      <td className="hidden sm:table-cell px-5 py-3.5 text-sm text-secondary-app group-hover:text-primary-app transition-colors">
                        {inv.client_id ? (clientMap[inv.client_id] ?? "—") : "—"}
                      </td>
                      <td className="px-3 sm:px-5 py-3.5 text-sm font-bold text-bright tabular-nums">
                        {inv.amount != null ? formatCurrency(inv.amount) : "—"}
                      </td>
                      <td className="px-3 sm:px-5 py-3.5">
                        <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium capitalize ${STATUS_BADGE[status]}`}>
                          <span className={`h-1.5 w-1.5 rounded-full ${STATUS_DOT[status]}`} />
                          {status}
                        </span>
                      </td>
                      <td className="hidden sm:table-cell px-5 py-3.5 text-sm text-muted-app tabular-nums">
                        {inv.due_date ? formatDate(inv.due_date) : "—"}
                      </td>
                      <td className="px-3 sm:px-5 py-3.5 text-right">
                        <ChevronRight className="ml-auto h-4 w-4 text-dim-app transition-[color,transform] duration-150 group-hover:text-violet-400 group-hover:translate-x-0.5" />
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* Create invoice dialog */}
      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent className="max-w-lg bg-surface-card border-surface text-primary-app">
          <DialogHeader>
            <DialogTitle className="text-lg font-semibold tracking-[-0.02em] text-bright">
              Create Invoice
            </DialogTitle>
          </DialogHeader>
          <InvoiceForm onSuccess={handleInvoiceCreated} onCancel={() => setCreateOpen(false)} />
        </DialogContent>
      </Dialog>
    </div>
  );
}
