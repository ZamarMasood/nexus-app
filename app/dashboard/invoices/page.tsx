"use client";

import { useEffect, useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { Plus, Receipt, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { getInvoices } from "@/lib/db/invoices";
import { getClients } from "@/lib/db/clients";
import { InvoiceForm } from "@/components/invoices/InvoiceForm";
import { formatCurrency, formatDate } from "@/lib/utils";
import type { Invoice, Client, InvoiceStatus } from "@/lib/types";

const STATUS_FILTERS: { value: InvoiceStatus | "all"; label: string }[] = [
  { value: "all", label: "All" },
  { value: "pending", label: "Pending" },
  { value: "paid", label: "Paid" },
  { value: "overdue", label: "Overdue" },
];

const STATUS_BADGE: Record<InvoiceStatus, string> = {
  paid:    "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200",
  pending: "bg-amber-50 text-amber-700 ring-1 ring-amber-200",
  overdue: "bg-rose-50 text-rose-700 ring-1 ring-rose-200",
};

export default function InvoicesPage() {
  const router = useRouter();
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<InvoiceStatus | "all">("all");
  const [createOpen, setCreateOpen] = useState(false);

  async function load() {
    try {
      const [inv, cl] = await Promise.all([getInvoices(), getClients()]);
      setInvoices(inv);
      setClients(cl);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load invoices.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); }, []);

  const clientMap = useMemo(() => {
    const m: Record<string, string> = {};
    for (const c of clients) m[c.id] = c.name;
    return m;
  }, [clients]);

  const filtered = useMemo(
    () =>
      filter === "all"
        ? invoices
        : invoices.filter((inv) => inv.status === filter),
    [invoices, filter]
  );

  const totals = useMemo(() => {
    const paid = invoices.filter((i) => i.status === "paid").reduce((s, i) => s + (i.amount ?? 0), 0);
    const outstanding = invoices.filter((i) => i.status !== "paid").reduce((s, i) => s + (i.amount ?? 0), 0);
    return { paid, outstanding };
  }, [invoices]);

  function handleInvoiceCreated(invoice: Invoice) {
    setInvoices((prev) => [invoice, ...prev]);
    setCreateOpen(false);
  }

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="h-8 w-48 animate-pulse rounded-lg bg-slate-200" />
        <div className="h-64 animate-pulse rounded-xl bg-slate-200" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-xl bg-rose-50 px-6 py-4 text-sm text-rose-600 ring-1 ring-rose-200">
        {error}
      </div>
    );
  }

  return (
    <>
      {/* Header */}
      <div className="mb-6 flex items-start justify-between">
        <div>
          <h1 className="font-display text-3xl font-bold tracking-[-0.03em] text-slate-900">
            Invoices
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            {invoices.length} invoice{invoices.length !== 1 ? "s" : ""} total
          </p>
        </div>
        <Button
          onClick={() => setCreateOpen(true)}
          className="gap-1.5 bg-violet-600 hover:bg-violet-700 text-white focus-visible:ring-violet-500"
        >
          <Plus className="h-4 w-4" />
          Create Invoice
        </Button>
      </div>

      {/* Summary cards */}
      <div className="mb-6 grid grid-cols-2 gap-4 sm:grid-cols-4">
        {[
          { label: "Total Invoices", value: String(invoices.length), accent: false },
          { label: "Paid", value: formatCurrency(totals.paid), accent: true },
          { label: "Outstanding", value: formatCurrency(totals.outstanding), accent: false },
          {
            label: "Overdue",
            value: String(invoices.filter((i) => i.status === "overdue").length),
            accent: false,
          },
        ].map(({ label, value, accent }) => (
          <div
            key={label}
            className="rounded-xl bg-white px-5 py-4 shadow-[0_1px_3px_rgba(0,0,0,0.07),0_4px_12px_rgba(0,0,0,0.04)] ring-1 ring-slate-100"
          >
            <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-400">
              {label}
            </p>
            <p
              className={`mt-1 text-xl font-bold tracking-tight ${
                accent ? "text-violet-600" : "text-slate-900"
              }`}
            >
              {value}
            </p>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="mb-4 flex gap-1.5">
        {STATUS_FILTERS.map(({ value, label }) => (
          <button
            key={value}
            onClick={() => setFilter(value)}
            className={[
              "rounded-lg px-3 py-1.5 text-xs font-medium transition-colors",
              "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-500",
              filter === value
                ? "bg-violet-600 text-white shadow-[0_1px_6px_rgba(124,58,237,0.35)]"
                : "bg-white text-slate-600 hover:bg-slate-100 ring-1 ring-slate-200",
            ].join(" ")}
          >
            {label}
          </button>
        ))}
      </div>

      {/* Table */}
      <div className="overflow-x-auto rounded-xl shadow-[0_1px_3px_rgba(0,0,0,0.08),0_4px_16px_rgba(0,0,0,0.04)] ring-1 ring-slate-100">
      <div className="min-w-[640px] overflow-hidden rounded-xl bg-white">
        {filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center gap-3 py-16">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-slate-100">
              <Receipt className="h-5 w-5 text-slate-400" />
            </div>
            <p className="text-sm text-slate-500">No invoices found.</p>
          </div>
        ) : (
          <table className="w-full">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50/70">
                {["Invoice #", "Client", "Amount", "Status", "Due Date"].map((h) => (
                  <th
                    key={h}
                    className="px-5 py-3 text-left text-[11px] font-semibold uppercase tracking-wide text-slate-400"
                  >
                    {h}
                  </th>
                ))}
                <th className="px-5 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {filtered.map((inv) => {
                const status = (inv.status ?? "pending") as InvoiceStatus;
                return (
                  <tr
                    key={inv.id}
                    onClick={() => router.push(`/dashboard/invoices/${inv.id}`)}
                    className="group cursor-pointer transition-colors hover:bg-violet-50/40 active:bg-violet-50/70"
                  >
                    <td className="px-5 py-3.5 font-mono text-sm font-medium text-slate-700 transition-colors group-hover:text-violet-700">
                      {inv.invoice_number ?? "—"}
                    </td>
                    <td className="px-5 py-3.5 text-sm text-slate-700">
                      {inv.client_id ? (clientMap[inv.client_id] ?? "—") : "—"}
                    </td>
                    <td className="px-5 py-3.5 text-sm font-semibold text-slate-900">
                      {inv.amount != null ? formatCurrency(inv.amount) : "—"}
                    </td>
                    <td className="px-5 py-3.5">
                      <span
                        className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium capitalize ${STATUS_BADGE[status]}`}
                      >
                        {status}
                      </span>
                    </td>
                    <td className="px-5 py-3.5 text-sm text-slate-500">
                      {inv.due_date ? formatDate(inv.due_date) : "—"}
                    </td>
                    <td className="px-5 py-3.5 text-right">
                      <ChevronRight className="ml-auto h-4 w-4 text-slate-300 transition-colors group-hover:text-violet-400" />
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
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="font-display text-lg tracking-tight">
              Create Invoice
            </DialogTitle>
          </DialogHeader>
          <InvoiceForm
            onSuccess={handleInvoiceCreated}
            onCancel={() => setCreateOpen(false)}
          />
        </DialogContent>
      </Dialog>
    </>
  );
}
