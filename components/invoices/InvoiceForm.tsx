"use client";

import { useState, useEffect } from "react";
import { Loader2, Users, Hash, DollarSign, CalendarDays, FileText } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { createInvoiceAction } from "@/app/dashboard/invoices/actions";
import { getClients } from "@/lib/db/clients";
import { revalidateDashboard } from "@/app/dashboard/actions";
import type { Client, Invoice, InvoiceStatus } from "@/lib/types";

interface InvoiceFormProps {
  onSuccess: (invoice: Invoice) => void;
  onCancel:  () => void;
}

const STATUS_OPTIONS: { value: InvoiceStatus; label: string; color: string }[] = [
  { value: "pending", label: "Pending", color: "text-amber-400"   },
  { value: "paid",    label: "Paid",    color: "text-emerald-400" },
  { value: "overdue", label: "Overdue", color: "text-rose-400"    },
];

const LABEL = "block text-[11px] font-semibold uppercase tracking-widest text-faint-app mb-1";
const FIELD = "w-full rounded-lg border border-surface bg-surface-inset px-3 py-2.5 text-[13px] text-primary-app placeholder:text-dim-app outline-none focus:border-violet-500/50 focus:ring-1 focus:ring-violet-500/30 transition-[border-color,box-shadow] duration-150";
const SELECT_TRIGGER = "w-full rounded-lg border border-surface bg-surface-inset h-[42px] text-[13px] text-primary-app focus:ring-1 focus:ring-violet-500/40 focus:border-violet-500/50 data-[placeholder]:text-dim-app";
const SELECT_CONTENT = "bg-surface-card border-surface text-primary-app";
const SELECT_ITEM    = "text-[13px] text-primary-app focus:bg-violet-500/10 focus:text-violet-300 cursor-pointer";

function generateInvoiceNumber(): string {
  const now = new Date();
  const ym  = `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, "0")}`;
  const seq = Math.floor(Math.random() * 9000) + 1000;
  return `INV-${ym}-${seq}`;
}

export function InvoiceForm({ onSuccess, onCancel }: InvoiceFormProps) {
  const [clients, setClients]           = useState<Client[]>([]);
  const [loadingClients, setLoadingClients] = useState(true);
  const [form, setForm] = useState({
    client_id:      "",
    invoice_number: generateInvoiceNumber(),
    amount:         "",
    due_date:       "",
    status:         "pending" as InvoiceStatus,
  });
  const [error, setError]   = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [step, setStep]     = useState<"idle" | "saving" | "generating">("idle");

  useEffect(() => {
    getClients()
      .then(setClients)
      .catch(() => setError("Failed to load clients."))
      .finally(() => setLoadingClients(false));
  }, []);

  function field(key: keyof typeof form) {
    return (e: React.ChangeEvent<HTMLInputElement>) =>
      setForm((prev) => ({ ...prev, [key]: e.target.value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.client_id)                       { setError("Please select a client."); return; }
    if (!form.invoice_number.trim())           { setError("Invoice number is required."); return; }
    if (!form.amount || isNaN(parseFloat(form.amount))) { setError("Enter a valid amount."); return; }

    setError(null);
    setLoading(true);
    setStep("saving");

    try {
      const invoice = await createInvoiceAction({
        client_id:      form.client_id,
        invoice_number: form.invoice_number.trim(),
        amount:         parseFloat(form.amount),
        due_date:       form.due_date || null,
        status:         form.status,
      });

      setStep("generating");
      try {
        const res  = await fetch("/api/generate-invoice-pdf", {
          method:  "POST",
          headers: { "Content-Type": "application/json" },
          body:    JSON.stringify({ invoiceId: invoice.id }),
        });
        const json = await res.json() as { pdf_url?: string; invoice?: Invoice; error?: string };
        if (json.invoice) { await revalidateDashboard(); onSuccess(json.invoice); return; }
      } catch {
        // PDF generation failed — still succeed with created invoice
      }

      await revalidateDashboard();
      onSuccess(invoice);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      setLoading(false);
      setStep("idle");
    }
  }

  const buttonLabel =
    step === "saving"     ? "Saving invoice…"  :
    step === "generating" ? "Generating PDF…"  :
    "Create Invoice";

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {error && (
        <div className="flex items-center gap-2 rounded-lg bg-rose-500/10 border border-rose-500/20 px-3 py-2.5 text-sm text-rose-400">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-4">
        {/* Client — full width */}
        <div className="sm:col-span-2">
          <label className={LABEL}>
            <span className="flex items-center gap-1.5">
              <Users className="h-3 w-3" />
              Client <span className="text-rose-400 normal-case tracking-normal font-normal">*</span>
            </span>
          </label>
          <Select
            value={form.client_id}
            onValueChange={(v) => setForm((prev) => ({ ...prev, client_id: v }))}
            disabled={loadingClients}
          >
            <SelectTrigger id="if-client" className={SELECT_TRIGGER}>
              <SelectValue placeholder={loadingClients ? "Loading clients…" : "Select client"} />
            </SelectTrigger>
            <SelectContent className={SELECT_CONTENT}>
              {clients.map((c) => (
                <SelectItem key={c.id} value={c.id} className={SELECT_ITEM}>
                  {c.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Invoice number */}
        <div>
          <label className={LABEL}>
            <span className="flex items-center gap-1.5">
              <Hash className="h-3 w-3" />
              Invoice # <span className="text-rose-400 normal-case tracking-normal font-normal">*</span>
            </span>
          </label>
          <input
            id="if-num"
            value={form.invoice_number}
            onChange={field("invoice_number")}
            placeholder="INV-202503-0001"
            className={`${FIELD} font-mono`}
          />
        </div>

        {/* Status */}
        <div>
          <label className={LABEL}>Status</label>
          <Select
            value={form.status}
            onValueChange={(v) => setForm((prev) => ({ ...prev, status: v as InvoiceStatus }))}
          >
            <SelectTrigger id="if-status" className={SELECT_TRIGGER}>
              <SelectValue />
            </SelectTrigger>
            <SelectContent className={SELECT_CONTENT}>
              {STATUS_OPTIONS.map((o) => (
                <SelectItem key={o.value} value={o.value} className={`${SELECT_ITEM} ${o.color}`}>
                  {o.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Amount */}
        <div>
          <label className={LABEL}>
            <span className="flex items-center gap-1.5">
              <DollarSign className="h-3 w-3" />
              Amount <span className="text-rose-400 normal-case tracking-normal font-normal">*</span>
            </span>
          </label>
          <input
            id="if-amount"
            type="number"
            min="0"
            step="0.01"
            value={form.amount}
            onChange={field("amount")}
            placeholder="0.00"
            className={FIELD}
          />
        </div>

        {/* Due date */}
        <div>
          <label className={LABEL}>
            <span className="flex items-center gap-1.5">
              <CalendarDays className="h-3 w-3" />
              Due Date
            </span>
          </label>
          <input
            id="if-due"
            type="date"
            value={form.due_date}
            onChange={field("due_date")}
            className={FIELD}
          />
        </div>
      </div>

      {/* PDF hint */}
      <div className="flex items-center gap-2 rounded-lg bg-surface-inset border border-surface px-3 py-2.5">
        <FileText className="h-3.5 w-3.5 shrink-0 text-dim-app" />
        <p className="text-[11px] text-dim-app">
          A PDF will be automatically generated and stored after saving.
        </p>
      </div>

      <div className="flex justify-end gap-2 pt-2 border-t border-surface">
        <button
          type="button"
          onClick={onCancel}
          disabled={loading}
          className="rounded-lg px-4 py-2 text-sm font-medium text-secondary-app hover:text-primary-app hover:bg-surface-subtle transition-[background-color,color] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-500 disabled:opacity-50"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={loading}
          className="flex items-center gap-2 rounded-lg bg-violet-600 px-4 py-2 text-sm font-semibold text-white shadow-[0_4px_16px_rgba(139,92,246,0.3)] hover:bg-violet-500 hover:shadow-[0_4px_20px_rgba(139,92,246,0.4)] active:scale-[0.97] transition-[background-color,box-shadow,transform] disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-400"
        >
          {loading && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
          {buttonLabel}
        </button>
      </div>
    </form>
  );
}

export default InvoiceForm;
