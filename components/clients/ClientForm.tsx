"use client";

import { useState } from "react";
import { Loader2, Building2, Mail, Shield, Briefcase, DollarSign, CalendarDays, KeyRound } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { createClientAction, updateClientAction } from "@/app/dashboard/clients/actions";
import type { Client, ClientStatus } from "@/lib/types";

interface ClientFormProps {
  client?:   Client;
  onSuccess: (client: Client) => void;
  onCancel:  () => void;
}

const STATUS_OPTIONS: { value: ClientStatus; label: string; color: string }[] = [
  { value: "active",   label: "Active",   color: "text-[#26c97f]" },
  { value: "inactive", label: "Inactive", color: "text-[#888]"    },
  { value: "paused",   label: "Paused",   color: "text-[#e79d13]" },
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

export function ClientForm({ client, onSuccess, onCancel }: ClientFormProps) {
  const isEdit = !!client;
  const [form, setForm] = useState({
    name:            client?.name ?? "",
    email:           client?.email ?? "",
    status:          (client?.status as ClientStatus) ?? "active",
    project_type:    client?.project_type ?? "",
    monthly_rate:    client?.monthly_rate?.toString() ?? "",
    start_date:      client?.start_date ?? "",
    portal_password: "",
  });
  const [error, setError]     = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  function field(key: keyof typeof form) {
    return (e: React.ChangeEvent<HTMLInputElement>) =>
      setForm((prev) => ({ ...prev, [key]: e.target.value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.name.trim()) { setError("Name is required."); return; }
    setError(null);
    setLoading(true);
    try {
      const payload = {
        name:            form.name.trim(),
        email:           form.email.trim() || null,
        status:          form.status || "active",
        project_type:    form.project_type.trim() || null,
        monthly_rate:    form.monthly_rate ? parseFloat(form.monthly_rate) : null,
        start_date:      form.start_date || null,
        portal_password: form.portal_password.trim() || null,
      };
      const result = isEdit
        ? await updateClientAction(client.id, payload)
        : await createClientAction(payload);
      onSuccess(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      {error && (
        <div className="rounded-md px-3 py-2 text-[13px] text-[#e5484d]
          bg-[rgba(229,72,77,0.1)] border border-[rgba(229,72,77,0.2)]">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-3 gap-y-3">
        <div>
          <label className={LABEL}>
            <span className="flex items-center gap-1.5">
              <Building2 className="h-3 w-3" />
              Name <span className="text-[#e5484d] normal-case tracking-normal font-normal">*</span>
            </span>
          </label>
          <input value={form.name} onChange={field("name")} placeholder="Acme Corp" className={FIELD} />
        </div>

        <div>
          <label className={LABEL}>
            <span className="flex items-center gap-1.5"><Mail className="h-3 w-3" /> Email</span>
          </label>
          <input type="email" value={form.email} onChange={field("email")} placeholder="hello@acme.com" className={FIELD} />
        </div>

        <div>
          <label className={LABEL}>
            <span className="flex items-center gap-1.5"><Shield className="h-3 w-3" /> Status</span>
          </label>
          <Select value={form.status} onValueChange={(v) => setForm((prev) => ({ ...prev, status: v as ClientStatus }))}>
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
            <span className="flex items-center gap-1.5"><Briefcase className="h-3 w-3" /> Project Type</span>
          </label>
          <input value={form.project_type} onChange={field("project_type")} placeholder="Retainer, One-time..." className={FIELD} />
        </div>

        <div>
          <label className={LABEL}>
            <span className="flex items-center gap-1.5"><DollarSign className="h-3 w-3" /> Monthly Rate ($)</span>
          </label>
          <input type="number" min="0" step="0.01" value={form.monthly_rate} onChange={field("monthly_rate")} placeholder="0.00" className={FIELD} />
        </div>

        <div>
          <label className={LABEL}>
            <span className="flex items-center gap-1.5"><CalendarDays className="h-3 w-3" /> Start Date</span>
          </label>
          <input type="date" value={form.start_date} onChange={field("start_date")} className={FIELD} />
        </div>

        <div className="col-span-2">
          <label className={LABEL}>
            <span className="flex items-center gap-1.5">
              <KeyRound className="h-3 w-3" />
              Portal Password
              {isEdit && (
                <span className="ml-1 text-[10px] font-normal text-[#3a3a3a] normal-case tracking-normal">
                  — leave blank to keep current
                </span>
              )}
            </span>
          </label>
          <input
            type="password" value={form.portal_password} onChange={field("portal_password")}
            placeholder={isEdit ? "Enter new password to change" : "Client portal access password"}
            autoComplete="new-password" className={FIELD}
          />
        </div>
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
          {loading ? "Saving..." : isEdit ? "Save changes" : "Add client"}
        </button>
      </div>
    </form>
  );
}

export default ClientForm;
