"use client";

import { useState, useMemo, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  Search,
  CheckCircle,
  Send,
  FileText,
  RefreshCw,
  Check,
  Download,
  Receipt,
  ArrowLeft,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { getInvoiceById, updateInvoice } from "@/lib/db/invoices";
import type { InvoiceListItem } from "@/lib/db/invoices";
import type { ClientListItem } from "@/lib/db/clients";
import { formatCurrency, formatDate } from "@/lib/utils";
import type { Invoice, InvoiceStatus } from "@/lib/types";

const STATUS_BADGE: Record<InvoiceStatus, string> = {
  paid: "bg-emerald-400/10 text-emerald-400 ring-1 ring-emerald-400/20",
  pending: "bg-amber-400/10 text-amber-400 ring-1 ring-amber-400/20",
  overdue: "bg-rose-400/10 text-rose-400 ring-1 ring-rose-400/20",
};

const STATUS_DOT: Record<InvoiceStatus, string> = {
  paid: "bg-emerald-400",
  pending: "bg-amber-400",
  overdue: "bg-rose-400",
};

interface InvoiceDetailClientProps {
  invoiceId: string;
  allInvoices: InvoiceListItem[];
  clients: ClientListItem[];
  initialInvoice: Invoice;
}

function findClientInList(clientId: string | null, clients: ClientListItem[]) {
  if (!clientId) return null;
  return clients.find((c) => c.id === clientId) ?? null;
}

export default function InvoiceDetailClient({
  invoiceId,
  allInvoices,
  clients,
  initialInvoice,
}: InvoiceDetailClientProps) {
  const router = useRouter();
  const [selectedId, setSelectedId] = useState(invoiceId);
  const [search, setSearch] = useState("");
  // Initialize from server-fetched props — no loading on first render
  const [invoice, setInvoice] = useState<Invoice | null>(initialInvoice);
  const [client, setClient] = useState<ClientListItem | null>(() => findClientInList(initialInvoice.client_id, clients));
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [markingPaid, setMarkingPaid] = useState(false);
  const [generatingPdf, setGeneratingPdf] = useState(false);
  const [copied, setCopied] = useState(false);
  const [showPdf, setShowPdf] = useState(false);
  const [pdfCacheBust, setPdfCacheBust] = useState(() => Date.now());

  const clientMap = useMemo(() => {
    const m: Record<string, string> = {};
    for (const c of clients) m[c.id] = c.name;
    return m;
  }, [clients]);

  const filteredInvoices = useMemo(() => {
    if (!search.trim()) return allInvoices;
    const q = search.toLowerCase();
    return allInvoices.filter((inv) => {
      const clientName = inv.client_id ? clientMap[inv.client_id] ?? "" : "";
      return (
        (inv.invoice_number ?? "").toLowerCase().includes(q) ||
        clientName.toLowerCase().includes(q) ||
        (inv.amount != null && formatCurrency(inv.amount).toLowerCase().includes(q))
      );
    });
  }, [allInvoices, search, clientMap]);

  // Only fetch when SWITCHING to a different invoice (not on initial mount)
  useEffect(() => {
    if (selectedId === invoiceId) return; // initial data comes from server props
    async function load() {
      setLoading(true);
      setError(null);
      setShowPdf(false);
      try {
        const inv = await getInvoiceById(selectedId);
        setInvoice(inv);
        setClient(findClientInList(inv.client_id, clients));
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load invoice.");
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [selectedId, invoiceId, clients]);

  function selectInvoice(id: string) {
    if (id === selectedId) return;
    setSelectedId(id);
    window.history.replaceState(null, "", `/dashboard/invoices/${id}`);
  }

  async function markAsPaid() {
    if (!invoice) return;
    setMarkingPaid(true);
    try {
      const updated = await updateInvoice(invoice.id, { status: "paid" });
      setInvoice(updated);
      setGeneratingPdf(true);
      const res = await fetch("/api/generate-invoice-pdf", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ invoiceId: updated.id }),
      });
      const json = (await res.json()) as { invoice?: Invoice; error?: string };
      if (json.invoice) {
        setInvoice(json.invoice);
        setPdfCacheBust(Date.now());
      }
    } catch (err) {
      console.error("Failed to mark as paid:", err);
    } finally {
      setMarkingPaid(false);
      setGeneratingPdf(false);
    }
  }

  async function generatePdf() {
    if (!invoice) return;
    setGeneratingPdf(true);
    try {
      const res = await fetch("/api/generate-invoice-pdf", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ invoiceId: invoice.id }),
      });
      const json = (await res.json()) as { pdf_url?: string; invoice?: Invoice; error?: string };
      if (json.invoice) {
        setInvoice(json.invoice);
        setPdfCacheBust(Date.now());
      } else if (json.error) {
        setError(json.error);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "PDF generation failed.");
    } finally {
      setGeneratingPdf(false);
    }
  }

  function copyPortalLink() {
    const url = `${window.location.origin}/portal/login`;
    navigator.clipboard.writeText(url).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    });
  }

  const status = invoice ? ((invoice.status ?? "pending") as InvoiceStatus) : "pending";

  return (
    <div className="p-4 sm:p-6 lg:p-8">
      {/* Mobile back button */}
      <button
        onClick={() => router.push("/dashboard/invoices")}
        className="flex lg:hidden items-center gap-1.5 mb-4 rounded text-sm text-faint-app transition-colors hover:text-muted-app focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-500"
      >
        <ArrowLeft className="h-3.5 w-3.5" />
        Back to Invoices
      </button>

      <div className="flex gap-6 items-start">
        {/* ── Left sidebar — Invoice list card ─────────────────────── */}
        <aside className="hidden lg:flex w-[300px] shrink-0 flex-col rounded-xl border border-surface bg-surface-card overflow-hidden sticky top-6 h-[calc(100vh-112px)]">
          <div className="px-4 pt-4 pb-3 border-b border-surface/60">
            <div className="flex items-center gap-2 mb-3">
              <button
                onClick={() => router.push("/dashboard/invoices")}
                className="flex items-center justify-center h-7 w-7 rounded-lg text-faint-app hover:text-bright hover:bg-surface-subtle transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-500"
                title="Back to Invoices"
              >
                <ArrowLeft className="h-4 w-4" />
              </button>
              <h2 className="text-[15px] font-bold tracking-[-0.02em] text-bright flex items-center gap-2">
                <Receipt className="h-4 w-4 text-violet-400" />
                Invoices
              </h2>
            </div>
            <div className="relative">
              <Search className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-app" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search invoices…"
                className="w-full rounded-lg bg-surface-subtle border border-surface pl-9 pr-3 py-2 text-[13px] text-primary-app placeholder:text-muted-app outline-none focus:border-violet-500/40 transition-[border-color] duration-150"
              />
            </div>
          </div>

          <div className="flex-1 overflow-y-auto">
            {filteredInvoices.length === 0 ? (
              <div className="flex flex-col items-center justify-center gap-2 py-12 text-center px-4">
                <Receipt className="h-5 w-5 text-faint-app" />
                <p className="text-xs text-dim-app">No invoices found</p>
              </div>
            ) : (
              filteredInvoices.map((inv) => {
                const invStatus = (inv.status ?? "pending") as InvoiceStatus;
                const isActive = inv.id === selectedId;
                return (
                  <button
                    key={inv.id}
                    onClick={() => selectInvoice(inv.id)}
                    className={[
                      "w-full text-left px-4 py-3 border-b border-surface/40 last:border-0 transition-[background-color] duration-150 group",
                      "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-violet-500",
                      isActive
                        ? "bg-violet-500/[0.08]"
                        : "hover:bg-overlay-xs",
                    ].join(" ")}
                  >
                    <div className="flex items-center justify-between gap-2 mb-1">
                      <span className={["font-mono text-[13px] font-semibold", isActive ? "text-violet-400" : "text-primary-app group-hover:text-violet-400"].join(" ")}>
                        {inv.invoice_number ?? "—"}
                      </span>
                      <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-medium capitalize ${STATUS_BADGE[invStatus]}`}>
                        <span className={`h-1.5 w-1.5 rounded-full ${STATUS_DOT[invStatus]}`} />
                        {invStatus}
                      </span>
                    </div>
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-[12px] text-secondary-app truncate">
                        {inv.client_id ? clientMap[inv.client_id] ?? "Unknown" : "No client"}
                      </span>
                      <span className="text-[12px] font-semibold text-bright tabular-nums shrink-0">
                        {inv.amount != null ? formatCurrency(inv.amount) : "—"}
                      </span>
                    </div>
                    {inv.due_date && (
                      <p className="mt-1 text-[11px] text-dim-app">Due {formatDate(inv.due_date)}</p>
                    )}
                  </button>
                );
              })
            )}
          </div>
        </aside>

        {/* ── Right panel — Invoice detail ────────────────────────────── */}
        <div className="flex-1 min-w-0">
        {loading ? (
          <div className="space-y-6 animate-pulse">
            {/* Skeleton: invoice header card */}
            <div className="rounded-xl border border-surface bg-surface-card overflow-hidden">
              <div className="flex items-start justify-between border-b border-surface bg-surface-inset px-6 py-5">
                <div className="space-y-2">
                  <div className="h-3 w-16 rounded bg-overlay-xs" />
                  <div className="h-6 w-32 rounded bg-overlay-xs" />
                </div>
                <div className="h-6 w-20 rounded-full bg-overlay-xs" />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 divide-y sm:divide-y-0 sm:divide-x divide-surface">
                {[0, 1, 2].map((i) => (
                  <div key={i} className="px-6 py-4 space-y-2">
                    <div className="h-3 w-14 rounded bg-overlay-xs" />
                    <div className="h-4 w-24 rounded bg-overlay-xs" />
                  </div>
                ))}
              </div>
              <div className="flex gap-2 border-t border-surface px-6 py-4">
                <div className="h-9 w-32 rounded-lg bg-overlay-xs" />
                <div className="h-9 w-32 rounded-lg bg-overlay-xs" />
              </div>
            </div>
            {/* Skeleton: PDF section */}
            <div className="rounded-xl border border-surface bg-surface-card p-6">
              <div className="flex flex-col items-center gap-4 py-8">
                <div className="h-14 w-14 rounded-full bg-overlay-xs" />
                <div className="h-4 w-40 rounded bg-overlay-xs" />
                <div className="h-3 w-56 rounded bg-overlay-xs" />
              </div>
            </div>
          </div>
        ) : error || !invoice ? (
          <div className="">
            <div className="rounded-xl bg-rose-500/10 border border-rose-500/20 px-6 py-4 text-sm text-rose-400">
              {error ?? "Invoice not found."}
            </div>
          </div>
        ) : (
          <div className="space-y-4 sm:space-y-6 animate-in">
            {/* Invoice header card */}
            <div className="overflow-hidden rounded-xl border border-surface bg-surface-card">
              {/* Top band — invoice number + status */}
              <div className="flex items-start justify-between border-b border-surface bg-surface-inset px-4 sm:px-6 py-4 sm:py-5">
                <div>
                  <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-dim-app">Invoice</p>
                  <p className="mt-1 font-mono text-lg sm:text-xl font-bold text-bright">{invoice.invoice_number ?? "—"}</p>
                </div>
                <span className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold capitalize ${STATUS_BADGE[status]}`}>
                  {status}
                </span>
              </div>

              {/* Details — 2-col on mobile, 3-col on sm+ */}
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-x-4 gap-y-3 px-4 sm:px-6 py-4">
                <div className="col-span-2 sm:col-span-1">
                  <p className="text-[11px] font-semibold uppercase tracking-wide text-dim-app">Client</p>
                  <p className="mt-0.5 text-sm font-semibold text-secondary-app">{client?.name ?? "—"}</p>
                  {client?.email && <p className="mt-0.5 text-xs text-faint-app truncate">{client.email}</p>}
                </div>
                <div>
                  <p className="text-[11px] font-semibold uppercase tracking-wide text-dim-app">Amount</p>
                  <p className="mt-0.5 text-sm font-semibold text-secondary-app">{invoice.amount != null ? formatCurrency(invoice.amount) : "—"}</p>
                </div>
                <div>
                  <p className="text-[11px] font-semibold uppercase tracking-wide text-dim-app">Due Date</p>
                  <p className="mt-0.5 text-sm font-semibold text-secondary-app">{invoice.due_date ? formatDate(invoice.due_date) : "—"}</p>
                </div>
              </div>

              {/* Actions */}
              <div className="border-t border-surface px-4 sm:px-6 py-3 sm:py-4 space-y-3">
                {/* Status row */}
                {invoice.status !== "paid" ? (
                  <Button onClick={markAsPaid} disabled={markingPaid} size="sm" className="w-full sm:w-auto gap-1.5 bg-emerald-600 hover:bg-emerald-500 text-white focus-visible:ring-emerald-500">
                    <CheckCircle className="h-3.5 w-3.5" />
                    {markingPaid ? "Updating…" : "Mark as Paid"}
                  </Button>
                ) : (
                  <div className="flex items-center gap-1.5 text-sm font-medium text-emerald-400">
                    <Check className="h-4 w-4" /> Paid
                  </div>
                )}
                {/* Action buttons — equal width on mobile */}
                <div className="grid grid-cols-2 sm:flex gap-2">
                  <Button variant="outline" size="sm" onClick={copyPortalLink} className="gap-1.5 border-surface bg-surface-subtle text-muted-app hover:bg-overlay-sm hover:text-primary-app justify-center">
                    {copied ? (<><Check className="h-3.5 w-3.5 text-emerald-400" /> Copied!</>) : (<><Send className="h-3.5 w-3.5" /> Send to Client</>)}
                  </Button>
                  {invoice.pdf_url ? (
                    <a href={invoice.pdf_url} download className="inline-flex items-center justify-center gap-1.5 rounded-md border border-surface bg-surface-subtle px-2.5 py-1.5 text-xs font-medium text-muted-app hover:bg-overlay-sm hover:text-primary-app transition-[background-color,color] duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-500">
                      <Download className="h-3.5 w-3.5" /> Download PDF
                    </a>
                  ) : (
                    <Button variant="outline" size="sm" onClick={generatePdf} disabled={generatingPdf} className="gap-1.5 border-surface bg-surface-subtle text-muted-app hover:bg-overlay-sm hover:text-primary-app justify-center">
                      <RefreshCw className={`h-3.5 w-3.5 ${generatingPdf ? "animate-spin" : ""}`} />
                      {generatingPdf ? "Generating…" : "Generate PDF"}
                    </Button>
                  )}
                </div>
              </div>
            </div>

            {/* PDF section */}
            {invoice.pdf_url ? (
              <div className="overflow-hidden rounded-xl border border-surface bg-surface-card">
                <div className="flex items-center justify-between gap-3 border-b border-surface px-4 sm:px-5 py-3 sm:py-4">
                  <div className="flex items-center gap-2">
                    <FileText className="h-4 w-4 shrink-0 text-violet-400" />
                    <span className="text-sm font-semibold text-muted-app">Invoice PDF</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button variant="outline" size="sm" onClick={generatePdf} disabled={generatingPdf} className="gap-1 border-surface bg-surface-subtle text-xs text-faint-app hover:bg-overlay-sm hover:text-muted-app hidden sm:inline-flex">
                      <RefreshCw className={`h-3 w-3 ${generatingPdf ? "animate-spin" : ""}`} /> Regenerate
                    </Button>
                    <Button size="sm" onClick={() => setShowPdf((v) => !v)} className="gap-1.5 bg-violet-600 hover:bg-violet-500 text-white shadow-[0_2px_10px_rgba(139,92,246,0.35)] transition-[background-color,box-shadow] text-xs">
                      <FileText className="h-3.5 w-3.5" /> {showPdf ? "Hide" : "View PDF"}
                    </Button>
                  </div>
                </div>
                {showPdf && (
                  <iframe src={`${invoice.pdf_url}?t=${pdfCacheBust}#toolbar=0`} className="h-[400px] sm:h-[750px] w-full" title={`Invoice ${invoice.invoice_number}`} />
                )}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center gap-3 rounded-xl border border-surface bg-surface-card py-10 sm:py-16">
                <div className="flex h-12 w-12 sm:h-14 sm:w-14 items-center justify-center rounded-full border border-surface bg-surface-inset">
                  <FileText className="h-5 w-5 sm:h-6 sm:w-6 text-faint-app" />
                </div>
                <div className="text-center px-4">
                  <p className="text-sm font-semibold text-secondary-app">No PDF generated yet</p>
                  <p className="mt-1 text-xs text-faint-app">Generate a PDF to preview and share.</p>
                </div>
                <Button size="sm" onClick={generatePdf} disabled={generatingPdf} className="gap-1.5 bg-violet-600 hover:bg-violet-500 text-white shadow-[0_4px_14px_rgba(139,92,246,0.4)]">
                  <RefreshCw className={`h-3.5 w-3.5 ${generatingPdf ? "animate-spin" : ""}`} />
                  {generatingPdf ? "Generating…" : "Generate PDF"}
                </Button>
              </div>
            )}
          </div>
        )}
        </div>
      </div>
    </div>
  );
}
