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
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { getInvoiceById, updateInvoice } from "@/lib/db/invoices";
import { getClientById } from "@/lib/db/clients";
import { formatCurrency, formatDate } from "@/lib/utils";
import type { Invoice, Client, InvoiceStatus } from "@/lib/types";

const STATUS_BADGE: Record<InvoiceStatus, string> = {
  paid:    "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200",
  pending: "bg-amber-50 text-amber-700 ring-1 ring-amber-200",
  overdue: "bg-rose-50 text-rose-700 ring-1 ring-rose-200",
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
    } catch (err) {
      console.error("Failed to mark as paid:", err);
    } finally {
      setMarkingPaid(false);
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
      <div className="max-w-4xl space-y-4">
        <div className="h-5 w-24 animate-pulse rounded-lg bg-slate-200" />
        <div className="h-40 animate-pulse rounded-xl bg-slate-200" />
        <div className="h-96 animate-pulse rounded-xl bg-slate-200" />
      </div>
    );
  }

  if (error || !invoice) {
    return (
      <div className="rounded-xl bg-rose-50 px-6 py-4 text-sm text-rose-600 ring-1 ring-rose-200">
        {error ?? "Invoice not found."}
      </div>
    );
  }

  const status = (invoice.status ?? "pending") as InvoiceStatus;

  return (
    <div className="max-w-4xl space-y-6">
      {/* Back */}
      <button
        onClick={() => router.push("/dashboard/invoices")}
        className="flex items-center gap-1.5 rounded text-sm text-slate-500 transition-colors hover:text-slate-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-500"
      >
        <ArrowLeft className="h-3.5 w-3.5" />
        Invoices
      </button>

      {/* Invoice header card */}
      <div className="rounded-xl bg-white shadow-[0_1px_3px_rgba(0,0,0,0.08),0_4px_16px_rgba(0,0,0,0.04)] ring-1 ring-slate-100">
        {/* Top band */}
        <div className="flex items-start justify-between rounded-t-xl bg-[#0e0f14] px-6 py-5">
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-slate-500">
              Invoice
            </p>
            <p className="mt-1 font-mono text-xl font-bold text-white">
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
        <div className="grid grid-cols-3 gap-px bg-slate-100">
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
            <div key={label} className="bg-white px-6 py-4">
              <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-400">
                {label}
              </p>
              <p className="mt-0.5 text-sm font-semibold text-slate-900">{value}</p>
              {sub && <p className="mt-0.5 text-xs text-slate-500">{sub}</p>}
            </div>
          ))}
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2 border-t border-slate-100 px-6 py-4">
          {invoice.status !== "paid" && (
            <Button
              onClick={markAsPaid}
              disabled={markingPaid}
              className="gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white focus-visible:ring-emerald-500"
            >
              <CheckCircle className="h-4 w-4" />
              {markingPaid ? "Updating…" : "Mark as Paid"}
            </Button>
          )}
          {invoice.status === "paid" && (
            <div className="flex items-center gap-1.5 text-sm font-medium text-emerald-600">
              <Check className="h-4 w-4" />
              Paid
            </div>
          )}

          <Button
            variant="outline"
            onClick={copyPortalLink}
            className="gap-1.5 text-slate-600"
          >
            {copied ? (
              <>
                <Check className="h-4 w-4 text-emerald-500" />
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
              className="gap-1.5 text-slate-600"
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
              className="ml-auto inline-flex items-center gap-1.5 rounded-lg px-3 py-2 text-sm text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-500"
            >
              <ExternalLink className="h-3.5 w-3.5" />
              Open PDF
            </a>
          )}
        </div>
      </div>

      {/* PDF preview */}
      {invoice.pdf_url ? (
        <div className="overflow-hidden rounded-xl bg-white shadow-[0_1px_3px_rgba(0,0,0,0.08),0_4px_16px_rgba(0,0,0,0.04)] ring-1 ring-slate-100">
          <div className="flex items-center gap-2 border-b border-slate-100 px-5 py-3">
            <FileText className="h-4 w-4 text-slate-400" />
            <span className="text-sm font-medium text-slate-700">PDF Preview</span>
            <Button
              variant="outline"
              size="sm"
              onClick={generatePdf}
              disabled={generatingPdf}
              className="ml-auto gap-1.5 text-xs text-slate-500"
            >
              <RefreshCw className={`h-3 w-3 ${generatingPdf ? "animate-spin" : ""}`} />
              Regenerate
            </Button>
          </div>
          <iframe
            src={invoice.pdf_url}
            className="h-[700px] w-full"
            title={`Invoice ${invoice.invoice_number}`}
          />
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center gap-4 rounded-xl bg-white py-20 shadow-[0_1px_3px_rgba(0,0,0,0.08),0_4px_16px_rgba(0,0,0,0.04)] ring-1 ring-slate-100">
          <div className="flex h-14 w-14 items-center justify-center rounded-full bg-slate-100">
            <FileText className="h-6 w-6 text-slate-400" />
          </div>
          <div className="text-center">
            <p className="text-sm font-medium text-slate-700">No PDF generated yet</p>
            <p className="mt-1 text-xs text-slate-400">
              Click &ldquo;Generate PDF&rdquo; above to create and store the invoice PDF.
            </p>
          </div>
          <Button
            onClick={generatePdf}
            disabled={generatingPdf}
            className="gap-1.5 bg-violet-600 hover:bg-violet-700 text-white"
          >
            <RefreshCw className={`h-4 w-4 ${generatingPdf ? "animate-spin" : ""}`} />
            {generatingPdf ? "Generating…" : "Generate PDF"}
          </Button>
        </div>
      )}
    </div>
  );
}
