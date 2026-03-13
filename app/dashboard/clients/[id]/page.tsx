"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  ArrowLeft,
  Edit2,
  RefreshCw,
  Copy,
  Check,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { getClientById } from "@/lib/db/clients";
import { resetPortalPasswordAction } from "@/app/dashboard/clients/actions";
import { getProjects } from "@/lib/db/projects";
import { getInvoices } from "@/lib/db/invoices";
import { ClientForm } from "@/components/clients/ClientForm";
import { formatCurrency, formatDate } from "@/lib/utils";
import type { Client, Project, Invoice, ClientStatus, InvoiceStatus } from "@/lib/types";

// ─── Badge style maps ─────────────────────────────────────────────────────────

const CLIENT_STATUS_BADGE: Record<ClientStatus, string> = {
  active: "bg-emerald-400/10 text-emerald-400 ring-1 ring-emerald-400/20",
  paused: "bg-amber-400/10 text-amber-400 ring-1 ring-amber-400/20",
  inactive: "bg-surface-subtle text-faint-app ring-1 ring-surface",
};

const PROJECT_STATUS_BADGE: Record<string, string> = {
  active: "bg-emerald-400/10 text-emerald-400 ring-1 ring-emerald-400/20",
  completed: "bg-surface-subtle text-faint-app ring-1 ring-surface",
  paused: "bg-amber-400/10 text-amber-400 ring-1 ring-amber-400/20",
};

const INVOICE_STATUS_BADGE: Record<InvoiceStatus, string> = {
  paid: "bg-emerald-400/10 text-emerald-400 ring-1 ring-emerald-400/20",
  pending: "bg-amber-400/10 text-amber-400 ring-1 ring-amber-400/20",
  overdue: "bg-rose-400/10 text-rose-400 ring-1 ring-rose-400/20",
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
  const [copied, setCopied] = useState(false);
  const [resetting, setResetting] = useState(false);
  const [newPlainPassword, setNewPlainPassword] = useState<string | null>(null);

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
    setResetting(true);
    try {
      const { client: updated, plainPassword } = await resetPortalPasswordAction(client.id);
      setClient(updated);
      setNewPlainPassword(plainPassword);
    } catch (err) {
      console.error("Failed to reset password:", err);
    } finally {
      setResetting(false);
    }
  }

  async function copyPassword() {
    const text = newPlainPassword;
    if (!text) return;
    await navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  }

  if (loading) {
    return (
      <div className="p-6 sm:p-8 lg:p-10 max-w-4xl mx-auto space-y-4">
        <div className="h-5 w-24 animate-pulse rounded-lg bg-overlay-xs" />
        <div className="h-40 animate-pulse rounded-xl bg-overlay-xs" />
        <div className="h-64 animate-pulse rounded-xl bg-overlay-xs" />
      </div>
    );
  }

  if (error || !client) {
    return (
      <div className="rounded-xl bg-rose-500/10 px-6 py-4 text-sm text-rose-400 ring-1 ring-rose-500/20">
        {error ?? "Client not found."}
      </div>
    );
  }

  const status = (client.status ?? "inactive") as ClientStatus;

  return (
    <div className="p-6 sm:p-8 lg:p-10 max-w-4xl mx-auto space-y-6">
      {/* Back */}
      <button
        onClick={() => router.push("/dashboard/clients")}
        className="flex items-center gap-1.5 rounded text-sm text-faint-app transition-colors hover:text-muted-app focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-500"
      >
        <ArrowLeft className="h-3.5 w-3.5" />
        Clients
      </button>

      {/* Client info card */}
      <div className="overflow-hidden rounded-xl bg-surface-card border border-surface">
        <div className="flex items-start justify-between px-6 pt-6 pb-5">
          <div>
            <div className="flex items-center gap-3">
              <h1 className="font-display text-2xl font-bold tracking-[-0.03em] text-bright">
                {client.name}
              </h1>
              <span
                className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium capitalize ${CLIENT_STATUS_BADGE[status]}`}
              >
                {status}
              </span>
            </div>
            {client.email && (
              <p className="mt-0.5 text-sm text-faint-app">{client.email}</p>
            )}
          </div>
          {!isEditing && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsEditing(true)}
              className="gap-1.5 text-faint-app hover:text-secondary-app"
            >
              <Edit2 className="h-3.5 w-3.5" />
              Edit
            </Button>
          )}
        </div>

        {isEditing ? (
          <div className="border-t border-surface px-6 py-5">
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
          <div className="grid grid-cols-3 gap-4 border-t border-surface px-6 py-5">
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
      <div className="overflow-hidden rounded-xl bg-surface-card border border-surface">
        <div className="flex gap-0.5 border-b border-surface px-4 pt-3">
          {(["projects", "invoices"] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={[
                "rounded-t-lg px-4 py-2 text-sm font-medium capitalize transition-colors",
                "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-500",
                activeTab === tab
                  ? "border-b-2 border-violet-500 text-violet-400"
                  : "text-faint-app hover:text-secondary-app",
              ].join(" ")}
            >
              {tab}
              <span className="ml-2 rounded-full bg-overlay-xs px-1.5 py-0.5 text-[10px] font-semibold text-faint-app">
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
      <div className="rounded-xl bg-surface-card border border-surface">
        <div className="px-6 py-5">
          <h2 className="mb-4 text-sm font-semibold text-bright">
            Portal Access
          </h2>

          {newPlainPassword ? (
            <div className="mb-4 rounded-lg bg-emerald-500/10 px-4 py-3 ring-1 ring-emerald-500/20">
              <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-emerald-400">
                New portal password — copy and share with client
              </p>
              <div className="flex items-center gap-2">
                <span className="flex-1 rounded bg-emerald-900/30 px-3 py-2 font-mono text-sm font-semibold tracking-widest text-emerald-300 ring-1 ring-emerald-500/20">
                  {newPlainPassword}
                </span>
                <button
                  onClick={copyPassword}
                  title="Copy password"
                  className="rounded-lg p-2 text-emerald-400 transition-colors hover:bg-emerald-500/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500"
                >
                  {copied ? (
                    <Check className="h-4 w-4" />
                  ) : (
                    <Copy className="h-4 w-4" />
                  )}
                </button>
                <button
                  onClick={() => setNewPlainPassword(null)}
                  className="rounded-lg px-3 py-2 text-xs text-emerald-400 hover:bg-emerald-500/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500"
                >
                  Done
                </button>
              </div>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <div className="flex-1 rounded-lg bg-surface-inset px-4 py-2.5 font-mono text-sm tracking-wide text-faint-app ring-1 ring-surface">
                {client.portal_password ? (
                  "•".repeat(12)
                ) : (
                  <span className="font-sans text-xs italic">Not set</span>
                )}
              </div>
            </div>
          )}

          <div className="mt-3 flex justify-end">
            <Button
              variant="outline"
              size="sm"
              onClick={handlePasswordReset}
              disabled={resetting}
              className="gap-1.5 text-muted-app border-surface bg-surface-subtle hover:bg-overlay-sm hover:text-primary-app"
            >
              <RefreshCw
                className={`h-3.5 w-3.5 ${resetting ? "animate-spin" : ""}`}
              />
              {client.portal_password ? "Reset Password" : "Set Password"}
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
      <p className="text-[11px] font-semibold uppercase tracking-wide text-dim-app">
        {label}
      </p>
      <p className="mt-0.5 text-sm font-medium text-secondary-app">{value}</p>
    </div>
  );
}

function ProjectsTab({ projects }: { projects: Project[] }) {
  if (projects.length === 0) {
    return (
      <p className="py-8 text-center text-sm text-faint-app">
        No projects yet.
      </p>
    );
  }
  return (
    <table className="w-full">
      <thead>
        <tr className="border-b border-surface">
          {["Name", "Status", "Value", "Deadline"].map((h) => (
            <th
              key={h}
              className="px-2 pb-2 text-left text-[11px] font-semibold uppercase tracking-wide text-dim-app"
            >
              {h}
            </th>
          ))}
        </tr>
      </thead>
      <tbody className="divide-y divide-surface">
        {projects.map((p) => {
          const badge =
            PROJECT_STATUS_BADGE[p.status ?? "active"] ??
            PROJECT_STATUS_BADGE["active"];
          return (
            <tr key={p.id}>
              <td className="px-2 py-3 text-sm font-medium text-bright">
                {p.name}
              </td>
              <td className="px-2 py-3">
                <span
                  className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium capitalize ${badge}`}
                >
                  {p.status ?? "active"}
                </span>
              </td>
              <td className="px-2 py-3 text-sm text-muted-app">
                {p.total_value != null ? formatCurrency(p.total_value) : "—"}
              </td>
              <td className="px-2 py-3 text-sm text-faint-app">
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
      <p className="py-8 text-center text-sm text-faint-app">
        No invoices yet.
      </p>
    );
  }
  return (
    <table className="w-full">
      <thead>
        <tr className="border-b border-surface">
          {["Invoice #", "Amount", "Status", "Due Date"].map((h) => (
            <th
              key={h}
              className="px-2 pb-2 text-left text-[11px] font-semibold uppercase tracking-wide text-dim-app"
            >
              {h}
            </th>
          ))}
        </tr>
      </thead>
      <tbody className="divide-y divide-surface">
        {invoices.map((inv) => {
          const invStatus = (inv.status ?? "pending") as InvoiceStatus;
          return (
            <tr key={inv.id}>
              <td className="px-2 py-3 font-mono text-sm text-muted-app">
                {inv.invoice_number ?? "—"}
              </td>
              <td className="px-2 py-3 text-sm font-medium text-bright">
                {inv.amount != null ? formatCurrency(inv.amount) : "—"}
              </td>
              <td className="px-2 py-3">
                <span
                  className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium capitalize ${INVOICE_STATUS_BADGE[invStatus]}`}
                >
                  {invStatus}
                </span>
              </td>
              <td className="px-2 py-3 text-sm text-faint-app">
                {inv.due_date ? formatDate(inv.due_date) : "—"}
              </td>
            </tr>
          );
        })}
      </tbody>
    </table>
  );
}
