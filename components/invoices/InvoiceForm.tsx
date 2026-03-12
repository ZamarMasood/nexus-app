"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { createInvoice } from "@/lib/db/invoices";
import { getClients } from "@/lib/db/clients";
import type { Client, Invoice, InvoiceStatus } from "@/lib/types";

interface InvoiceFormProps {
  onSuccess: (invoice: Invoice) => void;
  onCancel: () => void;
}

const STATUS_OPTIONS: { value: InvoiceStatus; label: string }[] = [
  { value: "pending", label: "Pending" },
  { value: "paid", label: "Paid" },
  { value: "overdue", label: "Overdue" },
];

function generateInvoiceNumber(): string {
  const now = new Date();
  const ym = `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, "0")}`;
  const seq = Math.floor(Math.random() * 9000) + 1000;
  return `INV-${ym}-${seq}`;
}

export function InvoiceForm({ onSuccess, onCancel }: InvoiceFormProps) {
  const [clients, setClients] = useState<Client[]>([]);
  const [loadingClients, setLoadingClients] = useState(true);
  const [form, setForm] = useState({
    client_id: "",
    invoice_number: generateInvoiceNumber(),
    amount: "",
    due_date: "",
    status: "pending" as InvoiceStatus,
  });
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState<"idle" | "saving" | "generating">("idle");

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
    if (!form.client_id) { setError("Please select a client."); return; }
    if (!form.invoice_number.trim()) { setError("Invoice number is required."); return; }
    if (!form.amount || isNaN(parseFloat(form.amount))) { setError("Enter a valid amount."); return; }

    setError(null);
    setLoading(true);
    setStep("saving");

    try {
      const invoice = await createInvoice({
        client_id: form.client_id,
        invoice_number: form.invoice_number.trim(),
        amount: parseFloat(form.amount),
        due_date: form.due_date || null,
        status: form.status,
      });

      setStep("generating");
      try {
        const res = await fetch("/api/generate-invoice-pdf", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ invoiceId: invoice.id }),
        });
        const json = await res.json() as { pdf_url?: string; invoice?: Invoice; error?: string };
        if (json.invoice) {
          onSuccess(json.invoice);
          return;
        }
      } catch {
        // PDF generation failed — still succeed with the created invoice
      }

      onSuccess(invoice);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      setLoading(false);
      setStep("idle");
    }
  }

  const buttonLabel =
    step === "saving"
      ? "Saving invoice…"
      : step === "generating"
        ? "Generating PDF…"
        : "Create Invoice";

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {error && (
        <p className="rounded-lg bg-rose-50 px-3 py-2 text-sm text-rose-600 ring-1 ring-rose-200">
          {error}
        </p>
      )}

      <div className="grid grid-cols-2 gap-x-4 gap-y-3">
        <div className="col-span-2 space-y-1.5">
          <Label htmlFor="if-client">
            Client <span className="text-rose-500">*</span>
          </Label>
          <Select
            value={form.client_id}
            onValueChange={(v) => setForm((prev) => ({ ...prev, client_id: v }))}
            disabled={loadingClients}
          >
            <SelectTrigger id="if-client">
              <SelectValue placeholder={loadingClients ? "Loading…" : "Select client"} />
            </SelectTrigger>
            <SelectContent>
              {clients.map((c) => (
                <SelectItem key={c.id} value={c.id}>
                  {c.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="if-num">
            Invoice # <span className="text-rose-500">*</span>
          </Label>
          <Input
            id="if-num"
            value={form.invoice_number}
            onChange={field("invoice_number")}
            placeholder="INV-202503-0001"
          />
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="if-status">Status</Label>
          <Select
            value={form.status}
            onValueChange={(v) =>
              setForm((prev) => ({ ...prev, status: v as InvoiceStatus }))
            }
          >
            <SelectTrigger id="if-status">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {STATUS_OPTIONS.map((o) => (
                <SelectItem key={o.value} value={o.value}>
                  {o.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="if-amount">
            Amount ($) <span className="text-rose-500">*</span>
          </Label>
          <Input
            id="if-amount"
            type="number"
            min="0"
            step="0.01"
            value={form.amount}
            onChange={field("amount")}
            placeholder="0.00"
          />
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="if-due">Due Date</Label>
          <Input
            id="if-due"
            type="date"
            value={form.due_date}
            onChange={field("due_date")}
          />
        </div>
      </div>

      <p className="text-[11px] text-slate-400">
        A PDF will be automatically generated and stored after saving.
      </p>

      <div className="flex justify-end gap-2 pt-1">
        <Button type="button" variant="ghost" onClick={onCancel} disabled={loading}>
          Cancel
        </Button>
        <Button
          type="submit"
          disabled={loading}
          className="bg-violet-600 hover:bg-violet-700 focus-visible:ring-violet-500 text-white"
        >
          {buttonLabel}
        </Button>
      </div>
    </form>
  );
}

export default InvoiceForm;
