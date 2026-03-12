"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  ArrowLeft,
  Edit2,
  Eye,
  EyeOff,
  RefreshCw,
  Copy,
  Check,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { getClientById, updateClient } from "@/lib/db/clients";
import { getProjects } from "@/lib/db/projects";
import { getInvoices } from "@/lib/db/invoices";
import { ClientForm } from "@/components/clients/ClientForm";
import { formatCurrency, formatDate } from "@/lib/utils";
import type { Client, Project, Invoice, ClientStatus, InvoiceStatus } from "@/lib/types";

// ─── Badge style maps ─────────────────────────────────────────────────────────

const CLIENT_STATUS_BADGE: Record<ClientStatus, string> = {
  active: "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200",
  paused: "bg-amber-50 text-amber-700 ring-1 ring-amber-200",
  inactive: "bg-slate-100 text-slate-500 ring-1 ring-slate-200",
};

const PROJECT_STATUS_BADGE: Record<string, string> = {
  active: "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200",
  completed: "bg-slate-100 text-slate-500 ring-1 ring-slate-200",
  paused: "bg-amber-50 text-amber-700 ring-1 ring-amber-200",
};

const INVOICE_STATUS_BADGE: Record<InvoiceStatus, string> = {
  paid: "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200",
  pending: "bg-amber-50 text-amber-700 ring-1 ring-amber-200",
  overdue: "bg-rose-50 text-rose-700 ring-1 ring-rose-200",
};

// ─── Main page ────────────────────────────────────────────────────────────────

export default function ClientDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;

  const [client, setClient] = useState<Client | null>(null);
  const [projects, setProjects] = useState<Project[]>([]);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<"projects" | "invoices">("projects");
  const [isEditing, setIsEditing] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [copied, setCopied] = useState(false);
  const [resetting, setResetting] = useState(false);

  const load = useCallback(async () => {
    try {
      const [c, p, inv] = await Promise.all([
        getClientById(id),
        getProjects(id),
        getInvoices(id),
      ]);
      setClient(c);
      setProjects(p);
      setInvoices(inv);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load client.");
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    load();
  }, [load]);

  async function handlePasswordReset() {
    if (!client) return;
    const newPassword = Math.random().toString(36).slice(2, 10).toUpperCase();
    setResetting(true);
    try {
      const updated = await updateClient(client.id, { portal_password: newPassword });
      setClient(updated);
    } catch (err) {
      console.error("Failed to reset password:", err);
    } finally {
      setResetting(false);
    }
  }

  async function copyPassword() {
    if (!client?.portal_password) return;
    await navigator.clipboard.writeText(client.portal_password);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  }

  if (loading) {
    return (
      <div className="max-w-4xl space-y-4">
        <div className="h-5 w-24 animate-pulse rounded-lg bg-slate-200" />
        <div className="h-40 animate-pulse rounded-xl bg-slate-200" />
        <div className="h-64 animate-pulse rounded-xl bg-slate-200" />
      </div>
    );
  }

  if (error || !client) {
    return (
      <div className="rounded-xl bg-rose-50 px-6 py-4 text-sm text-rose-600 ring-1 ring-rose-200">
        {error ?? "Client not found."}
      </div>
    );
  }

  const status = (client.status ?? "inactive") as ClientStatus;

  return (
    <div className="max-w-4xl space-y-6">
      {/* Back */}
      <button
        onClick={() => router.push("/dashboard/clients")}
        className="flex items-center gap-1.5 rounded text-sm text-slate-500 transition-colors hover:text-slate-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-500"
      >
        <ArrowLeft className="h-3.5 w-3.5" />
        Clients
      </button>

      {/* Client info card */}
      <div className="overflow-hidden rounded-xl bg-white shadow-[0_1px_3px_rgba(0,0,0,0.08),0_4px_16px_rgba(0,0,0,0.04)] ring-1 ring-slate-100">
        <div className="flex items-start justify-between px-6 pt-6 pb-5">
          <div>
            <div className="flex items-center gap-3">
              <h1 className="font-display text-2xl font-bold tracking-[-0.03em] text-slate-900">
                {client.name}
              </h1>
              <span
                className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium capitalize ${CLIENT_STATUS_BADGE[status]}`}
              >
                {status}
              </span>
            </div>
            {client.email && (
              <p className="mt-0.5 text-sm text-slate-500">{client.email}</p>
            )}
          </div>
          {!isEditing && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsEditing(true)}
              className="gap-1.5 text-slate-500 hover:text-slate-900"
            >
              <Edit2 className="h-3.5 w-3.5" />
              Edit
            </Button>
          )}
        </div>

        {isEditing ? (
          <div className="border-t border-slate-100 px-6 py-5">
            <ClientForm
              client={client}
              onSuccess={(updated) => {
                setClient(updated);
                setIsEditing(false);
              }}
              onCancel={() => setIsEditing(false)}
            />
          </div>
        ) : (
          <div className="grid grid-cols-3 gap-4 border-t border-slate-100 px-6 py-5">
            <InfoField
              label="Monthly Rate"
              value={
                client.monthly_rate != null
                  ? formatCurrency(client.monthly_rate)
                  : "—"
              }
            />
            <InfoField
              label="Start Date"
              value={client.start_date ? formatDate(client.start_date) : "—"}
            />
            <InfoField
              label="Project Type"
              value={client.project_type ?? "—"}
            />
          </div>
        )}
      </div>

      {/* Projects / Invoices tabs */}
      <div className="overflow-hidden rounded-xl bg-white shadow-[0_1px_3px_rgba(0,0,0,0.08),0_4px_16px_rgba(0,0,0,0.04)] ring-1 ring-slate-100">
        <div className="flex gap-0.5 border-b border-slate-100 px-4 pt-3">
          {(["projects", "invoices"] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={[
                "rounded-t-lg px-4 py-2 text-sm font-medium capitalize transition-colors",
                "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-500",
                activeTab === tab
                  ? "border-b-2 border-violet-500 text-violet-700"
                  : "text-slate-500 hover:text-slate-800",
              ].join(" ")}
            >
              {tab}
              <span className="ml-2 rounded-full bg-slate-100 px-1.5 py-0.5 text-[10px] font-semibold text-slate-500">
                {tab === "projects" ? projects.length : invoices.length}
              </span>
            </button>
          ))}
        </div>
        <div className="p-4">
          {activeTab === "projects" && <ProjectsTab projects={projects} />}
          {activeTab === "invoices" && <InvoicesTab invoices={invoices} />}
        </div>
      </div>

      {/* Portal access */}
      <div className="rounded-xl bg-white shadow-[0_1px_3px_rgba(0,0,0,0.08),0_4px_16px_rgba(0,0,0,0.04)] ring-1 ring-slate-100">
        <div className="px-6 py-5">
          <h2 className="mb-4 text-sm font-semibold text-slate-900">
            Portal Access
          </h2>
          <div className="flex items-center gap-2">
            <div className="flex-1 rounded-lg bg-slate-50 px-4 py-2.5 font-mono text-sm tracking-wide text-slate-700 ring-1 ring-slate-200">
              {client.portal_password ? (
                showPassword ? (
                  client.portal_password
                ) : (
                  "•".repeat(Math.min(client.portal_password.length, 12))
                )
              ) : (
                <span className="font-sans text-xs italic text-slate-400">
                  Not set
                </span>
              )}
            </div>
            <button
              onClick={() => setShowPassword((v) => !v)}
              title={showPassword ? "Hide" : "Show"}
              className="rounded-lg p-2 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-500"
            >
              {showPassword ? (
                <EyeOff className="h-4 w-4" />
              ) : (
                <Eye className="h-4 w-4" />
              )}
            </button>
            <button
              onClick={copyPassword}
              disabled={!client.portal_password}
              title="Copy password"
              className="rounded-lg p-2 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-700 disabled:opacity-30 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-500"
            >
              {copied ? (
                <Check className="h-4 w-4 text-emerald-500" />
              ) : (
                <Copy className="h-4 w-4" />
              )}
            </button>
            <Button
              variant="outline"
              size="sm"
              onClick={handlePasswordReset}
              disabled={resetting}
              className="gap-1.5 text-slate-600"
            >
              <RefreshCw
                className={`h-3.5 w-3.5 ${resetting ? "animate-spin" : ""}`}
              />
              Reset
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function InfoField({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-400">
        {label}
      </p>
      <p className="mt-0.5 text-sm font-medium text-slate-700">{value}</p>
    </div>
  );
}

function ProjectsTab({ projects }: { projects: Project[] }) {
  if (projects.length === 0) {
    return (
      <p className="py-8 text-center text-sm text-slate-400">
        No projects yet.
      </p>
    );
  }
  return (
    <table className="w-full">
      <thead>
        <tr className="border-b border-slate-100">
          {["Name", "Status", "Value", "Deadline"].map((h) => (
            <th
              key={h}
              className="px-2 pb-2 text-left text-[11px] font-semibold uppercase tracking-wide text-slate-400"
            >
              {h}
            </th>
          ))}
        </tr>
      </thead>
      <tbody className="divide-y divide-slate-50">
        {projects.map((p) => {
          const badge =
            PROJECT_STATUS_BADGE[p.status ?? "active"] ??
            PROJECT_STATUS_BADGE["active"];
          return (
            <tr key={p.id}>
              <td className="px-2 py-3 text-sm font-medium text-slate-800">
                {p.name}
              </td>
              <td className="px-2 py-3">
                <span
                  className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium capitalize ${badge}`}
                >
                  {p.status ?? "active"}
                </span>
              </td>
              <td className="px-2 py-3 text-sm text-slate-600">
                {p.total_value != null ? formatCurrency(p.total_value) : "—"}
              </td>
              <td className="px-2 py-3 text-sm text-slate-500">
                {p.deadline ? formatDate(p.deadline) : "—"}
              </td>
            </tr>
          );
        })}
      </tbody>
    </table>
  );
}

function InvoicesTab({ invoices }: { invoices: Invoice[] }) {
  if (invoices.length === 0) {
    return (
      <p className="py-8 text-center text-sm text-slate-400">
        No invoices yet.
      </p>
    );
  }
  return (
    <table className="w-full">
      <thead>
        <tr className="border-b border-slate-100">
          {["Invoice #", "Amount", "Status", "Due Date"].map((h) => (
            <th
              key={h}
              className="px-2 pb-2 text-left text-[11px] font-semibold uppercase tracking-wide text-slate-400"
            >
              {h}
            </th>
          ))}
        </tr>
      </thead>
      <tbody className="divide-y divide-slate-50">
        {invoices.map((inv) => {
          const invStatus = (inv.status ?? "pending") as InvoiceStatus;
          return (
            <tr key={inv.id}>
              <td className="px-2 py-3 font-mono text-sm text-slate-700">
                {inv.invoice_number ?? "—"}
              </td>
              <td className="px-2 py-3 text-sm font-medium text-slate-800">
                {inv.amount != null ? formatCurrency(inv.amount) : "—"}
              </td>
              <td className="px-2 py-3">
                <span
                  className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium capitalize ${INVOICE_STATUS_BADGE[invStatus]}`}
                >
                  {invStatus}
                </span>
              </td>
              <td className="px-2 py-3 text-sm text-slate-500">
                {inv.due_date ? formatDate(inv.due_date) : "—"}
              </td>
            </tr>
          );
        })}
      </tbody>
    </table>
  );
}
