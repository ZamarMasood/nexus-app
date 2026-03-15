"use client";

import { useEffect, useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { revalidateDashboard } from "@/app/dashboard/actions";
import {
  Search,
  Edit2,
  RefreshCw,
  Copy,
  Check,
  Users,
  ArrowLeft,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { getClientById } from "@/lib/db/clients";
import type { ClientListItem } from "@/lib/db/clients";
import { resetPortalPasswordAction } from "@/app/dashboard/clients/actions";
import { getProjectsForList } from "@/lib/db/projects";
import type { ProjectListItem } from "@/lib/db/projects";
import { getInvoicesForList } from "@/lib/db/invoices";
import type { InvoiceListItem } from "@/lib/db/invoices";
import { ClientForm } from "@/components/clients/ClientForm";
import { formatCurrency, formatDate } from "@/lib/utils";
import type { Client, ClientStatus, InvoiceStatus } from "@/lib/types";

const CLIENT_STATUS_BADGE: Record<ClientStatus, string> = {
  active: "bg-emerald-400/10 text-emerald-400 ring-1 ring-emerald-400/20",
  paused: "bg-amber-400/10 text-amber-400 ring-1 ring-amber-400/20",
  inactive: "bg-surface-subtle text-faint-app ring-1 ring-surface",
};

const CLIENT_STATUS_DOT: Record<ClientStatus, string> = {
  active: "bg-emerald-400",
  paused: "bg-amber-400",
  inactive: "bg-slate-400",
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

interface ClientDetailClientProps {
  clientId: string;
  allClients: ClientListItem[];
  initialClient: Client;
  initialProjects: ProjectListItem[];
  initialInvoices: InvoiceListItem[];
}

export default function ClientDetailClient({
  clientId,
  allClients,
  initialClient,
  initialProjects,
  initialInvoices,
}: ClientDetailClientProps) {
  const router = useRouter();
  const [selectedId, setSelectedId] = useState(clientId);
  const [search, setSearch] = useState("");

  // Initialize from server-fetched props — no loading on first render
  const [client, setClient] = useState<Client | null>(initialClient);
  const [projects, setProjects] = useState<ProjectListItem[]>(initialProjects);
  const [invoices, setInvoices] = useState<InvoiceListItem[]>(initialInvoices);
  const [loading, setLoading] = useState(false);
  const [relatedLoading, setRelatedLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<"projects" | "invoices">("projects");
  const [isEditing, setIsEditing] = useState(false);
  const [copied, setCopied] = useState(false);
  const [resetting, setResetting] = useState(false);
  const [newPlainPassword, setNewPlainPassword] = useState<string | null>(null);

  const filteredClients = useMemo(() => {
    if (!search.trim()) return allClients;
    const q = search.toLowerCase();
    return allClients.filter(
      (c) =>
        c.name.toLowerCase().includes(q) ||
        (c.email ?? "").toLowerCase().includes(q) ||
        (c.status ?? "").toLowerCase().includes(q)
    );
  }, [allClients, search]);

  // Track which client is currently loaded to avoid redundant fetches
  const [loadedId, setLoadedId] = useState(clientId);

  // Fetch when switching to a different client
  useEffect(() => {
    if (selectedId === loadedId) return;
    async function loadData() {
      setLoading(true);
      setRelatedLoading(true);
      setError(null);
      setIsEditing(false);
      setNewPlainPassword(null);
      try {
        const [c, p, inv] = await Promise.all([
          getClientById(selectedId),
          getProjectsForList(selectedId),
          getInvoicesForList(selectedId),
        ]);
        setClient(c);
        setProjects(p);
        setInvoices(inv);
        setLoadedId(selectedId);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load client.");
      } finally {
        setLoading(false);
        setRelatedLoading(false);
      }
    }
    loadData();
  }, [selectedId, loadedId]);

  function selectClient(id: string) {
    if (id === selectedId) return;
    setSelectedId(id);
    window.history.replaceState(null, "", `/dashboard/clients/${id}`);
  }

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

  const status = client ? ((client.status ?? "inactive") as ClientStatus) : "inactive";

  return (
    <div className="p-4 sm:p-6 lg:p-8">
      {/* Mobile back button */}
      <button
        onClick={() => router.push("/dashboard/clients")}
        className="flex lg:hidden items-center gap-1.5 mb-4 rounded text-sm text-faint-app transition-colors hover:text-muted-app focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-500"
      >
        <ArrowLeft className="h-3.5 w-3.5" />
        Back to Clients
      </button>

      <div className="flex gap-6 items-start">
        {/* ── Left sidebar — Client list card ──────────────────────── */}
        <aside className="hidden lg:flex w-[300px] shrink-0 flex-col rounded-xl border border-surface bg-surface-card overflow-hidden sticky top-6 h-[calc(100vh-112px)]">
          <div className="px-4 pt-4 pb-3 border-b border-surface/60">
            <div className="flex items-center gap-2 mb-3">
              <button
                onClick={() => router.push("/dashboard/clients")}
                className="flex items-center justify-center h-7 w-7 rounded-lg text-faint-app hover:text-bright hover:bg-surface-subtle transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-500"
                title="Back to Clients"
              >
                <ArrowLeft className="h-4 w-4" />
              </button>
              <h2 className="text-[15px] font-bold tracking-[-0.02em] text-bright flex items-center gap-2">
                <Users className="h-4 w-4 text-violet-400" />
                Clients
              </h2>
            </div>
            <div className="relative">
              <Search className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-app" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search clients…"
                className="w-full rounded-lg bg-surface-subtle border border-surface pl-9 pr-3 py-2 text-[13px] text-primary-app placeholder:text-muted-app outline-none focus:border-violet-500/40 transition-[border-color] duration-150"
              />
            </div>
          </div>

          <div className="flex-1 overflow-y-auto">
            {filteredClients.length === 0 ? (
              <div className="flex flex-col items-center justify-center gap-2 py-12 text-center px-4">
                <Users className="h-5 w-5 text-faint-app" />
                <p className="text-xs text-dim-app">No clients found</p>
              </div>
            ) : (
              filteredClients.map((c) => {
                const cStatus = (c.status ?? "inactive") as ClientStatus;
                const isActive = c.id === selectedId;
                return (
                  <button
                    key={c.id}
                    onClick={() => selectClient(c.id)}
                    className={[
                      "w-full text-left px-4 py-3 border-b border-surface/40 last:border-0 transition-[background-color] duration-150 group",
                      "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-violet-500",
                      isActive
                        ? "bg-violet-500/[0.08]"
                        : "hover:bg-overlay-xs",
                    ].join(" ")}
                  >
                    <div className="flex items-center justify-between gap-2 mb-1">
                      <span className={["text-[13px] font-semibold truncate", isActive ? "text-violet-400" : "text-primary-app group-hover:text-violet-400"].join(" ")}>
                        {c.name}
                      </span>
                      <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-medium capitalize ${CLIENT_STATUS_BADGE[cStatus]}`}>
                        <span className={`h-1.5 w-1.5 rounded-full ${CLIENT_STATUS_DOT[cStatus]}`} />
                        {cStatus}
                      </span>
                    </div>
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-[12px] text-secondary-app truncate">{c.email ?? "No email"}</span>
                      <span className="text-[12px] font-semibold text-bright tabular-nums shrink-0">
                        {c.monthly_rate != null ? formatCurrency(c.monthly_rate) : "—"}
                      </span>
                    </div>
                    {c.project_type && (
                      <p className="mt-1 text-[11px] text-dim-app truncate">{c.project_type}</p>
                    )}
                  </button>
                );
              })
            )}
          </div>
        </aside>

        {/* ── Right panel — Client detail ─────────────────────────────── */}
        <div className="flex-1 min-w-0">
        {loading ? (
          <div className="space-y-6 animate-pulse">
            {/* Skeleton: client info card */}
            <div className="rounded-xl border border-surface bg-surface-card overflow-hidden">
              <div className="px-4 sm:px-6 pt-5 sm:pt-6 pb-5 flex items-start justify-between">
                <div className="space-y-2">
                  <div className="flex items-center gap-3">
                    <div className="h-7 w-40 rounded bg-overlay-xs" />
                    <div className="h-5 w-16 rounded-full bg-overlay-xs" />
                  </div>
                  <div className="h-4 w-48 rounded bg-overlay-xs" />
                </div>
                <div className="h-8 w-16 rounded-lg bg-overlay-xs" />
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-x-4 gap-y-3 border-t border-surface px-4 sm:px-6 py-4 sm:py-5">
                {[0, 1, 2].map((i) => (
                  <div key={i} className="space-y-2">
                    <div className="h-3 w-20 rounded bg-overlay-xs" />
                    <div className="h-4 w-24 rounded bg-overlay-xs" />
                  </div>
                ))}
              </div>
            </div>
            {/* Skeleton: tabs card */}
            <div className="rounded-xl border border-surface bg-surface-card overflow-hidden">
              <div className="flex gap-4 border-b border-surface px-4 pt-3 pb-0">
                <div className="h-8 w-24 rounded bg-overlay-xs" />
                <div className="h-8 w-24 rounded bg-overlay-xs" />
              </div>
              <div className="p-4 space-y-3">
                {[0, 1, 2].map((i) => (
                  <div key={i} className="h-12 rounded-lg bg-overlay-xs" />
                ))}
              </div>
            </div>
            {/* Skeleton: portal access */}
            <div className="rounded-xl border border-surface bg-surface-card px-6 py-5">
              <div className="h-4 w-28 rounded bg-overlay-xs mb-4" />
              <div className="h-10 rounded-lg bg-overlay-xs" />
            </div>
          </div>
        ) : error || !client ? (
          <div className="">
            <div className="rounded-xl bg-rose-500/10 border border-rose-500/20 px-6 py-4 text-sm text-rose-400">
              {error ?? "Client not found."}
            </div>
          </div>
        ) : (
          <div className="space-y-6 animate-in">
            {/* Client info card */}
            <div className="overflow-hidden rounded-xl bg-surface-card border border-surface">
              <div className="flex items-start justify-between px-4 sm:px-6 pt-5 sm:pt-6 pb-5">
                <div>
                  <div className="flex items-center gap-3">
                    <h1 className="font-display text-2xl font-bold tracking-[-0.03em] text-bright">{client.name}</h1>
                    <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium capitalize ${CLIENT_STATUS_BADGE[status]}`}>{status}</span>
                  </div>
                  {client.email && <p className="mt-0.5 text-sm text-faint-app">{client.email}</p>}
                </div>
                {!isEditing && (
                  <Button variant="ghost" size="sm" onClick={() => setIsEditing(true)} className="gap-1.5 text-faint-app hover:text-secondary-app">
                    <Edit2 className="h-3.5 w-3.5" /> Edit
                  </Button>
                )}
              </div>

              {isEditing ? (
                <div className="border-t border-surface px-4 sm:px-6 py-5">
                  <ClientForm client={client} onSuccess={async (updated) => { setClient(updated); setIsEditing(false); await revalidateDashboard(); router.refresh(); }} onCancel={() => setIsEditing(false)} />
                </div>
              ) : (
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-x-4 gap-y-3 border-t border-surface px-4 sm:px-6 py-4 sm:py-5">
                  <InfoField label="Monthly Rate" value={client.monthly_rate != null ? formatCurrency(client.monthly_rate) : "—"} />
                  <InfoField label="Start Date" value={client.start_date ? formatDate(client.start_date) : "—"} />
                  <InfoField label="Project Type" value={client.project_type ?? "—"} />
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
                      activeTab === tab ? "border-b-2 border-violet-500 text-violet-400" : "text-faint-app hover:text-secondary-app",
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
              <div className="px-4 sm:px-6 py-5">
                <h2 className="mb-4 text-sm font-semibold text-bright">Portal Access</h2>
                {newPlainPassword ? (
                  <div className="mb-4 rounded-lg bg-emerald-500/10 px-4 py-3 ring-1 ring-emerald-500/20">
                    <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-emerald-400">New portal password — copy and share with client</p>
                    <div className="flex items-center gap-2">
                      <span className="flex-1 rounded bg-emerald-900/30 px-3 py-2 font-mono text-sm font-semibold tracking-widest text-emerald-300 ring-1 ring-emerald-500/20">{newPlainPassword}</span>
                      <button onClick={copyPassword} title="Copy password" className="rounded-lg p-2 text-emerald-400 transition-colors hover:bg-emerald-500/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500">
                        {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                      </button>
                      <button onClick={() => setNewPlainPassword(null)} className="rounded-lg px-3 py-2 text-xs text-emerald-400 hover:bg-emerald-500/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500">Done</button>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    <div className="flex-1 rounded-lg bg-surface-inset px-4 py-2.5 font-mono text-sm tracking-wide text-faint-app ring-1 ring-surface">
                      {client.portal_password ? "•".repeat(12) : <span className="font-sans text-xs italic">Not set</span>}
                    </div>
                  </div>
                )}
                <div className="mt-3 flex justify-end">
                  <Button variant="outline" size="sm" onClick={handlePasswordReset} disabled={resetting} className="gap-1.5 text-muted-app border-surface bg-surface-subtle hover:bg-overlay-sm hover:text-primary-app">
                    <RefreshCw className={`h-3.5 w-3.5 ${resetting ? "animate-spin" : ""}`} />
                    {client.portal_password ? "Reset Password" : "Set Password"}
                  </Button>
                </div>
              </div>
            </div>
          </div>
        )}
        </div>
      </div>
    </div>
  );
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function InfoField({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-[11px] font-semibold uppercase tracking-wide text-dim-app">{label}</p>
      <p className="mt-0.5 text-sm font-medium text-secondary-app">{value}</p>
    </div>
  );
}

function ProjectsTab({ projects }: { projects: ProjectListItem[] }) {
  if (projects.length === 0) return <p className="py-8 text-center text-sm text-faint-app">No projects yet.</p>;
  return (
    <div className="divide-y divide-surface">
      {projects.map((p) => {
        const badge = PROJECT_STATUS_BADGE[p.status ?? "active"] ?? PROJECT_STATUS_BADGE["active"];
        return (
          <div key={p.id} className="py-3 flex items-center justify-between gap-3">
            <div className="min-w-0 flex-1">
              <p className="text-sm font-medium text-bright truncate">{p.name}</p>
              <div className="flex items-center gap-2 mt-1">
                <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-medium capitalize ${badge}`}>{p.status ?? "active"}</span>
                {p.deadline && <span className="text-[11px] text-dim-app hidden sm:inline">{formatDate(p.deadline)}</span>}
              </div>
            </div>
            <span className="text-sm font-semibold text-bright tabular-nums shrink-0">
              {p.total_value != null ? formatCurrency(p.total_value) : "—"}
            </span>
          </div>
        );
      })}
    </div>
  );
}

function InvoicesTab({ invoices }: { invoices: InvoiceListItem[] }) {
  if (invoices.length === 0) return <p className="py-8 text-center text-sm text-faint-app">No invoices yet.</p>;
  return (
    <div className="divide-y divide-surface">
      {invoices.map((inv) => {
        const invStatus = (inv.status ?? "pending") as InvoiceStatus;
        return (
          <div key={inv.id} className="py-3 flex items-center justify-between gap-3">
            <div className="min-w-0 flex-1">
              <p className="text-sm font-mono text-muted-app truncate">{inv.invoice_number ?? "—"}</p>
              <div className="flex items-center gap-2 mt-1">
                <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-medium capitalize ${INVOICE_STATUS_BADGE[invStatus]}`}>{invStatus}</span>
                {inv.due_date && <span className="text-[11px] text-dim-app hidden sm:inline">{formatDate(inv.due_date)}</span>}
              </div>
            </div>
            <span className="text-sm font-semibold text-bright tabular-nums shrink-0">
              {inv.amount != null ? formatCurrency(inv.amount) : "—"}
            </span>
          </div>
        );
      })}
    </div>
  );
}
