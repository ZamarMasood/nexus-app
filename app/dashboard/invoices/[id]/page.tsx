"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  ArrowLeft,
  CheckCircle,
  Send,
  FileText,
  RefreshCw,
  Check,
  ExternalLink,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { getInvoiceById, updateInvoice } from "@/lib/db/invoices";
import { getClientById } from "@/lib/db/clients";
import { formatCurrency, formatDate } from "@/lib/utils";
import type { Invoice, Client, InvoiceStatus } from "@/lib/types";

const STATUS_BADGE: Record<InvoiceStatus, string> = {
  paid:    "bg-emerald-400/10 text-emerald-400 ring-1 ring-emerald-400/20",
  pending: "bg-amber-400/10 text-amber-400 ring-1 ring-amber-400/20",
  overdue: "bg-rose-400/10 text-rose-400 ring-1 ring-rose-400/20",
};

export default function InvoiceDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;

  const [invoice, setInvoice] = useState<Invoice | null>(null);
  const [client, setClient] = useState<Client | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [markingPaid, setMarkingPaid] = useState(false);
  const [generatingPdf, setGeneratingPdf] = useState(false);
  const [copied, setCopied] = useState(false);
  const [showPdf, setShowPdf] = useState(true);
  const [pdfCacheBust, setPdfCacheBust] = useState(() => Date.now());

  const load = useCallback(async () => {
    try {
      const inv = await getInvoiceById(id);
      setInvoice(inv);
      if (inv.client_id) {
        const cl = await getClientById(inv.client_id);
        setClient(cl);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load invoice.");
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => { load(); }, [load]);

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
      const json = await res.json() as { invoice?: Invoice; error?: string };
      if (json.invoice) { setInvoice(json.invoice); setPdfCacheBust(Date.now()); }
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
      const json = await res.json() as { pdf_url?: string; invoice?: Invoice; error?: string };
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

  if (loading) {
    return (
      <div className="p-6 sm:p-8 lg:p-10">
        <div className="max-w-4xl mx-auto space-y-4">
          <div className="h-5 w-24 animate-pulse rounded-lg bg-overlay-xs" />
          <div className="h-40 animate-pulse rounded-xl bg-overlay-xs" />
          <div className="h-96 animate-pulse rounded-xl bg-overlay-xs" />
        </div>
      </div>
    );
  }

  if (error || !invoice) {
    return (
      <div className="p-6 sm:p-8 lg:p-10">
        <div className="rounded-xl bg-rose-500/10 border border-rose-500/20 px-6 py-4 text-sm text-rose-400">
          {error ?? "Invoice not found."}
        </div>
      </div>
    );
  }

  const status = (invoice.status ?? "pending") as InvoiceStatus;

  return (
    <div className="p-6 sm:p-8 lg:p-10">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Back */}
        <button
          onClick={() => router.push("/dashboard/invoices")}
          className="flex items-center gap-1.5 rounded text-sm text-faint-app transition-colors hover:text-muted-app focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-500"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          Invoices
        </button>

        {/* Invoice header card */}
        <div className="overflow-hidden rounded-xl border border-surface bg-surface-card">
          {/* Top band */}
          <div className="flex items-start justify-between border-b border-surface bg-surface-inset px-6 py-5">
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-dim-app">
                Invoice
              </p>
              <p className="mt-1 font-mono text-xl font-bold text-bright">
                {invoice.invoice_number ?? "—"}
              </p>
            </div>
            <span
              className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold capitalize ${STATUS_BADGE[status]}`}
            >
              {status}
            </span>
          </div>

          {/* Details grid */}
          <div className="grid grid-cols-3 divide-x divide-surface">
            {[
              {
                label: "Client",
                value: client?.name ?? "—",
                sub: client?.email ?? undefined,
              },
              {
                label: "Amount",
                value: invoice.amount != null ? formatCurrency(invoice.amount) : "—",
                sub: undefined,
              },
              {
                label: "Due Date",
                value: invoice.due_date ? formatDate(invoice.due_date) : "—",
                sub: undefined,
              },
            ].map(({ label, value, sub }) => (
              <div key={label} className="px-6 py-4">
                <p className="text-[11px] font-semibold uppercase tracking-wide text-dim-app">
                  {label}
                </p>
                <p className="mt-0.5 text-sm font-semibold text-secondary-app">{value}</p>
                {sub && <p className="mt-0.5 text-xs text-faint-app">{sub}</p>}
              </div>
            ))}
          </div>

          {/* Actions */}
          <div className="flex items-center gap-2 border-t border-surface px-6 py-4">
            {invoice.status !== "paid" && (
              <Button
                onClick={markAsPaid}
                disabled={markingPaid}
                className="gap-1.5 bg-emerald-600 hover:bg-emerald-500 text-white focus-visible:ring-emerald-500"
              >
                <CheckCircle className="h-4 w-4" />
                {markingPaid ? "Updating…" : "Mark as Paid"}
              </Button>
            )}
            {invoice.status === "paid" && (
              <div className="flex items-center gap-1.5 text-sm font-medium text-emerald-400">
                <Check className="h-4 w-4" />
                Paid
              </div>
            )}

            <Button
              variant="outline"
              onClick={copyPortalLink}
              className="gap-1.5 border-surface bg-surface-subtle text-muted-app hover:bg-overlay-sm hover:text-primary-app"
            >
              {copied ? (
                <>
                  <Check className="h-4 w-4 text-emerald-400" />
                  Copied!
                </>
              ) : (
                <>
                  <Send className="h-4 w-4" />
                  Send to Client
                </>
              )}
            </Button>

            {!invoice.pdf_url && (
              <Button
                variant="outline"
                onClick={generatePdf}
                disabled={generatingPdf}
                className="gap-1.5 border-surface bg-surface-subtle text-muted-app hover:bg-overlay-sm hover:text-primary-app"
              >
                <RefreshCw className={`h-4 w-4 ${generatingPdf ? "animate-spin" : ""}`} />
                {generatingPdf ? "Generating…" : "Generate PDF"}
              </Button>
            )}

            {invoice.pdf_url && (
              <a
                href={invoice.pdf_url}
                target="_blank"
                rel="noopener noreferrer"
                className="ml-auto inline-flex items-center gap-1.5 rounded-lg px-3 py-2 text-sm text-faint-app transition-colors hover:bg-overlay-xs hover:text-muted-app focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-500"
              >
                <ExternalLink className="h-3.5 w-3.5" />
                Open PDF
              </a>
            )}
          </div>
        </div>

        {/* PDF preview */}
        {invoice.pdf_url ? (
          <div className="overflow-hidden rounded-xl border border-surface bg-surface-card">
            <div className="flex items-center gap-2 border-b border-surface px-5 py-3">
              <FileText className="h-4 w-4 text-faint-app" />
              <span className="text-sm font-medium text-muted-app">PDF Preview</span>
              <div className="ml-auto flex items-center gap-1.5">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={generatePdf}
                  disabled={generatingPdf}
                  className="gap-1.5 border-surface bg-surface-subtle text-xs text-faint-app hover:bg-overlay-sm hover:text-muted-app"
                >
                  <RefreshCw className={`h-3 w-3 ${generatingPdf ? "animate-spin" : ""}`} />
                  Regenerate
                </Button>
                <button
                  onClick={() => setShowPdf(false)}
                  className="flex h-7 w-7 items-center justify-center rounded-md text-faint-app transition-colors hover:bg-overlay-xs hover:text-muted-app focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-500"
                  aria-label="Close PDF preview"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>
            {showPdf && (
              <iframe
                src={`${invoice.pdf_url}?t=${pdfCacheBust}#toolbar=0`}
                className="h-[700px] w-full"
                title={`Invoice ${invoice.invoice_number}`}
              />
            )}
            {!showPdf && (
              <div className="flex items-center justify-center gap-2 py-6">
                <button
                  onClick={() => setShowPdf(true)}
                  className="inline-flex items-center gap-1.5 rounded-lg px-3 py-2 text-sm text-faint-app transition-colors hover:bg-overlay-xs hover:text-muted-app focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-500"
                >
                  <FileText className="h-4 w-4" />
                  Show PDF Preview
                </button>
              </div>
            )}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center gap-4 rounded-xl border border-surface bg-surface-card py-20">
            <div className="flex h-14 w-14 items-center justify-center rounded-full border border-surface bg-surface-inset">
              <FileText className="h-6 w-6 text-faint-app" />
            </div>
            <div className="text-center">
              <p className="text-sm font-medium text-secondary-app">No PDF generated yet</p>
              <p className="mt-1 text-xs text-faint-app">
                Click &ldquo;Generate PDF&rdquo; above to create and store the invoice PDF.
              </p>
            </div>
            <Button
              onClick={generatePdf}
              disabled={generatingPdf}
              className="gap-1.5 bg-violet-600 hover:bg-violet-500 text-white shadow-[0_4px_14px_rgba(139,92,246,0.4)]"
            >
              <RefreshCw className={`h-4 w-4 ${generatingPdf ? "animate-spin" : ""}`} />
              {generatingPdf ? "Generating…" : "Generate PDF"}
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
