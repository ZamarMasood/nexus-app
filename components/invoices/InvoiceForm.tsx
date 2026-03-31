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
  { value: "pending", label: "Pending", color: "text-[#e79d13]" },
  { value: "paid",    label: "Paid",    color: "text-[#26c97f]" },
  { value: "overdue", label: "Overdue", color: "text-[#e5484d]" },
];

const LABEL = "block text-[12px] font-medium text-[#8a8a8a] uppercase tracking-[0.04em] mb-1.5";
const FIELD = `w-full px-3 py-2 rounded-md bg-[#1a1a1a] border border-[rgba(255,255,255,0.10)]
  text-[#f0f0f0] text-[13px] placeholder:text-[#555]
  focus:outline-none focus:border-[rgba(255,255,255,0.16)]
  focus:ring-1 focus:ring-[rgba(94,106,210,0.35)]
  transition-colors duration-150`;
const SELECT_TRIGGER = `w-full rounded-md border border-[rgba(255,255,255,0.10)] bg-[#1a1a1a]
  h-[38px] text-[13px] text-[#f0f0f0]
  focus:ring-1 focus:ring-[rgba(94,106,210,0.35)] focus:border-[rgba(255,255,255,0.16)]
  data-[placeholder]:text-[#555]`;
const SELECT_CONTENT = "bg-[#1c1c1c] border-[rgba(255,255,255,0.10)] text-[#f0f0f0]";
const SELECT_ITEM = "text-[13px] text-[#8a8a8a] focus:bg-white/5 focus:text-[#f0f0f0] cursor-pointer";

function generateInvoiceNumber(): string {
  const now = new Date();
  const ym  = `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, "0")}`;
  const seq = Math.floor(Math.random() * 9000) + 1000;
  return `INV-${ym}-${seq}`;
}

export function InvoiceForm({ onSuccess, onCancel }: InvoiceFormProps) {
  const [clients, setClients]               = useState<Client[]>([]);
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
    step === "saving"     ? "Saving invoice..."  :
    step === "generating" ? "Generating PDF..."  :
    "Create invoice";

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      {error && (
        <div className="rounded-md px-3 py-2 text-[13px] text-[#e5484d]
          bg-[rgba(229,72,77,0.1)] border border-[rgba(229,72,77,0.2)]">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-3 gap-y-3">
        <div className="sm:col-span-2">
          <label className={LABEL}>
            <span className="flex items-center gap-1.5">
              <Users className="h-3 w-3" />
              Client <span className="text-[#e5484d] normal-case tracking-normal font-normal">*</span>
            </span>
          </label>
          <Select value={form.client_id} onValueChange={(v) => setForm((prev) => ({ ...prev, client_id: v }))} disabled={loadingClients}>
            <SelectTrigger className={SELECT_TRIGGER}>
              <SelectValue placeholder={loadingClients ? "Loading clients..." : "Select client"} />
            </SelectTrigger>
            <SelectContent className={SELECT_CONTENT}>
              {clients.map((c) => (
                <SelectItem key={c.id} value={c.id} className={SELECT_ITEM}>{c.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div>
          <label className={LABEL}>
            <span className="flex items-center gap-1.5">
              <Hash className="h-3 w-3" />
              Invoice # <span className="text-[#e5484d] normal-case tracking-normal font-normal">*</span>
            </span>
          </label>
          <input value={form.invoice_number} onChange={field("invoice_number")} placeholder="INV-202503-0001" className={`${FIELD} font-mono`} />
        </div>

        <div>
          <label className={LABEL}>Status</label>
          <Select value={form.status} onValueChange={(v) => setForm((prev) => ({ ...prev, status: v as InvoiceStatus }))}>
            <SelectTrigger className={SELECT_TRIGGER}><SelectValue /></SelectTrigger>
            <SelectContent className={SELECT_CONTENT}>
              {STATUS_OPTIONS.map((o) => (
                <SelectItem key={o.value} value={o.value} className={`${SELECT_ITEM} ${o.color}`}>{o.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div>
          <label className={LABEL}>
            <span className="flex items-center gap-1.5">
              <DollarSign className="h-3 w-3" />
              Amount <span className="text-[#e5484d] normal-case tracking-normal font-normal">*</span>
            </span>
          </label>
          <input type="number" min="0" step="0.01" value={form.amount} onChange={field("amount")} placeholder="0.00" className={FIELD} />
        </div>

        <div>
          <label className={LABEL}>
            <span className="flex items-center gap-1.5"><CalendarDays className="h-3 w-3" /> Due Date</span>
          </label>
          <input type="date" value={form.due_date} onChange={field("due_date")} className={FIELD} />
        </div>
      </div>

      <div className="flex items-center gap-2 rounded-md bg-[#1a1a1a] border border-[rgba(255,255,255,0.06)] px-3 py-2">
        <FileText className="h-3.5 w-3.5 shrink-0 text-[#3a3a3a]" />
        <p className="text-[11px] text-[#3a3a3a]">
          A PDF will be automatically generated and stored after saving.
        </p>
      </div>

      <div className="flex justify-end gap-2 pt-3 border-t border-[rgba(255,255,255,0.06)]">
        <button type="button" onClick={onCancel} disabled={loading}
          className="px-3 py-1.5 rounded-md text-[13px] font-medium text-[#8a8a8a]
            hover:bg-white/5 hover:text-[#f0f0f0] transition-colors duration-150
            disabled:opacity-50">
          Cancel
        </button>
        <button type="submit" disabled={loading}
          className="flex items-center gap-2 px-3 py-1.5 rounded-md text-[13px] font-medium
            bg-[#5e6ad2] hover:bg-[#6872e5] text-white
            active:scale-[0.98] transition-colors duration-150
            disabled:opacity-50">
          {loading && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
          {buttonLabel}
        </button>
      </div>
    </form>
  );
}

export default InvoiceForm;
