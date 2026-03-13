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
  { value: "active",   label: "Active",   color: "text-emerald-400" },
  { value: "inactive", label: "Inactive", color: "text-muted-app"   },
  { value: "paused",   label: "Paused",   color: "text-amber-400"   },
];

const LABEL = "block text-[11px] font-semibold uppercase tracking-widest text-faint-app mb-1";
const FIELD = "w-full rounded-lg border border-surface bg-surface-inset px-3 py-2.5 text-[13px] text-primary-app placeholder:text-dim-app outline-none focus:border-violet-500/50 focus:ring-1 focus:ring-violet-500/30 transition-[border-color,box-shadow] duration-150";
const SELECT_TRIGGER = "w-full rounded-lg border border-surface bg-surface-inset h-[42px] text-[13px] text-primary-app focus:ring-1 focus:ring-violet-500/40 focus:border-violet-500/50 data-[placeholder]:text-dim-app";
const SELECT_CONTENT = "bg-surface-card border-surface text-primary-app";
const SELECT_ITEM    = "text-[13px] text-primary-app focus:bg-violet-500/10 focus:text-violet-300 cursor-pointer";

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
    <form onSubmit={handleSubmit} className="space-y-4">
      {error && (
        <div className="flex items-center gap-2 rounded-lg bg-rose-500/10 border border-rose-500/20 px-3 py-2.5 text-sm text-rose-400">
          {error}
        </div>
      )}

      <div className="grid grid-cols-2 gap-x-4 gap-y-4">
        {/* Name */}
        <div>
          <label className={LABEL}>
            <span className="flex items-center gap-1.5">
              <Building2 className="h-3 w-3" />
              Name <span className="text-rose-400 normal-case tracking-normal font-normal">*</span>
            </span>
          </label>
          <input
            id="cf-name"
            value={form.name}
            onChange={field("name")}
            placeholder="Acme Corp"
            className={FIELD}
          />
        </div>

        {/* Email */}
        <div>
          <label className={LABEL}>
            <span className="flex items-center gap-1.5">
              <Mail className="h-3 w-3" />
              Email
            </span>
          </label>
          <input
            id="cf-email"
            type="email"
            value={form.email}
            onChange={field("email")}
            placeholder="hello@acme.com"
            className={FIELD}
          />
        </div>

        {/* Status */}
        <div>
          <label className={LABEL}>
            <span className="flex items-center gap-1.5">
              <Shield className="h-3 w-3" />
              Status
            </span>
          </label>
          <Select
            value={form.status}
            onValueChange={(v) => setForm((prev) => ({ ...prev, status: v as ClientStatus }))}
          >
            <SelectTrigger id="cf-status" className={SELECT_TRIGGER}>
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

        {/* Project type */}
        <div>
          <label className={LABEL}>
            <span className="flex items-center gap-1.5">
              <Briefcase className="h-3 w-3" />
              Project Type
            </span>
          </label>
          <input
            id="cf-project-type"
            value={form.project_type}
            onChange={field("project_type")}
            placeholder="Retainer, One-time…"
            className={FIELD}
          />
        </div>

        {/* Monthly rate */}
        <div>
          <label className={LABEL}>
            <span className="flex items-center gap-1.5">
              <DollarSign className="h-3 w-3" />
              Monthly Rate ($)
            </span>
          </label>
          <input
            id="cf-monthly-rate"
            type="number"
            min="0"
            step="0.01"
            value={form.monthly_rate}
            onChange={field("monthly_rate")}
            placeholder="0.00"
            className={FIELD}
          />
        </div>

        {/* Start date */}
        <div>
          <label className={LABEL}>
            <span className="flex items-center gap-1.5">
              <CalendarDays className="h-3 w-3" />
              Start Date
            </span>
          </label>
          <input
            id="cf-start-date"
            type="date"
            value={form.start_date}
            onChange={field("start_date")}
            className={FIELD}
          />
        </div>

        {/* Portal password */}
        <div className="col-span-2">
          <label className={LABEL}>
            <span className="flex items-center gap-1.5">
              <KeyRound className="h-3 w-3" />
              Portal Password
              {isEdit && (
                <span className="ml-1 text-[10px] font-normal text-dim-app normal-case tracking-normal">
                  — leave blank to keep current
                </span>
              )}
            </span>
          </label>
          <input
            id="cf-portal-pw"
            type="password"
            value={form.portal_password}
            onChange={field("portal_password")}
            placeholder={isEdit ? "Enter new password to change" : "Client portal access password"}
            autoComplete="new-password"
            className={FIELD}
          />
        </div>
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
          {loading ? "Saving…" : isEdit ? "Save Changes" : "Add Client"}
        </button>
      </div>
    </form>
  );
}

export default ClientForm;
