"use client";

import { useState, useMemo, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Plus, Users, ChevronRight, TrendingUp, DollarSign, Activity } from "lucide-react";
import { revalidateDashboard } from "@/app/dashboard/actions";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ClientForm } from "@/components/clients/ClientForm";
import { formatCurrency } from "@/lib/utils";
import type { ProjectListItem } from "@/lib/db/projects";
import type { Client, ClientStatus } from "@/lib/types";

const STATUS_FILTERS: { value: ClientStatus | "all"; label: string }[] = [
  { value: "all",      label: "All"      },
  { value: "active",   label: "Active"   },
  { value: "paused",   label: "Paused"   },
  { value: "inactive", label: "Inactive" },
];

const STATUS_BADGE: Record<ClientStatus, string> = {
  active:   "bg-emerald-400/10 text-emerald-400 ring-1 ring-emerald-400/20",
  paused:   "bg-amber-400/10 text-amber-400 ring-1 ring-amber-400/20",
  inactive: "bg-surface-subtle text-muted-app ring-1 ring-surface",
};

const STATUS_DOT: Record<ClientStatus, string> = {
  active:   "bg-emerald-400",
  paused:   "bg-amber-400",
  inactive: "bg-dim-app",
};

const AVATAR_COLORS = [
  "bg-violet-500/15 text-violet-300 ring-violet-500/20",
  "bg-sky-500/15 text-sky-300 ring-sky-500/20",
  "bg-emerald-500/15 text-emerald-300 ring-emerald-500/20",
  "bg-amber-500/15 text-amber-300 ring-amber-500/20",
  "bg-rose-500/15 text-rose-300 ring-rose-500/20",
  "bg-indigo-500/15 text-indigo-300 ring-indigo-500/20",
];

function clientInitials(name: string): string {
  return name.split(" ").map((w) => w[0]).slice(0, 2).join("").toUpperCase();
}

function avatarColor(name: string): string {
  let hash = 0;
  for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash);
  return AVATAR_COLORS[Math.abs(hash) % AVATAR_COLORS.length];
}

interface ClientsClientProps {
  initialClients: Client[];
  projects: ProjectListItem[];
}

export default function ClientsClient({ initialClients, projects }: ClientsClientProps) {
  const router = useRouter();
  const [clients, setClients] = useState<Client[]>(initialClients);
  const [filter, setFilter]   = useState<ClientStatus | "all">("all");
  const [addOpen, setAddOpen] = useState(false);

  // Sync local state when server re-renders with fresh data (after router.refresh)
  useEffect(() => { setClients(initialClients); }, [initialClients]);

  const activeProjectCount = useMemo(() => {
    const map: Record<string, number> = {};
    for (const p of projects) {
      if (p.client_id && p.status === "active") {
        map[p.client_id] = (map[p.client_id] ?? 0) + 1;
      }
    }
    return map;
  }, [projects]);

  const filtered = useMemo(
    () => filter === "all" ? clients : clients.filter((c) => c.status === filter),
    [clients, filter]
  );

  const stats = useMemo(() => {
    const active   = clients.filter((c) => c.status === "active");
    const mrr      = active.reduce((s, c) => s + (c.monthly_rate ?? 0), 0);
    const totalArr = mrr * 12;
    return { active: active.length, mrr, totalArr };
  }, [clients]);

  async function handleClientAdded(client: Client) {
    setClients((prev) => [client, ...prev]);
    setAddOpen(false);
    await revalidateDashboard();
    router.refresh();
  }

  return (
    <div className="p-6 sm:p-8 lg:p-10">

      {/* Header */}
      <div className="mb-6 flex flex-wrap items-start justify-between gap-3 animate-in" style={{ animationDelay: "0ms" }}>
        <div>
          <h1 className="text-2xl font-bold tracking-[-0.03em] text-bright">Clients</h1>
          <p className="mt-0.5 text-sm text-faint-app">
            {clients.length} client{clients.length !== 1 ? "s" : ""} total
          </p>
        </div>
        <Button
          onClick={() => setAddOpen(true)}
          className="gap-1.5 bg-violet-600 hover:bg-violet-500 text-white shadow-[0_4px_24px_rgba(139,92,246,0.35),0_1px_4px_rgba(0,0,0,0.4)] hover:shadow-[0_4px_28px_rgba(139,92,246,0.5)] transition-[background-color,box-shadow] focus-visible:ring-violet-500"
        >
          <Plus className="h-4 w-4" />
          Add Client
        </Button>
      </div>

      {/* Summary cards */}
      {clients.length > 0 && (
        <div className="mb-6 grid grid-cols-1 sm:grid-cols-3 gap-4">
          {[
            {
              label:     "Active Clients",
              value:     stats.active,
              icon:      Activity,
              accent:    "from-emerald-500/20 to-emerald-600/5",
              iconBg:    "bg-emerald-500/10",
              iconColor: "text-emerald-400",
            },
            {
              label:     "Monthly Revenue",
              value:     formatCurrency(stats.mrr),
              icon:      DollarSign,
              accent:    "from-violet-500/20 to-violet-600/5",
              iconBg:    "bg-violet-500/10",
              iconColor: "text-violet-400",
            },
            {
              label:     "Annual Run Rate",
              value:     formatCurrency(stats.totalArr),
              icon:      TrendingUp,
              accent:    "from-sky-500/20 to-sky-600/5",
              iconBg:    "bg-sky-500/10",
              iconColor: "text-sky-400",
            },
          ].map(({ label, value, icon: Icon, accent, iconBg, iconColor }, i) => (
            <div
              key={label}
              className="relative overflow-hidden rounded-2xl border border-surface bg-surface-card p-5 animate-in"
              style={{ animationDelay: `${80 + i * 60}ms` }}
            >
              <div className={`absolute inset-x-0 top-0 h-px bg-gradient-to-r ${accent}`} />
              <div className={`absolute inset-x-0 top-0 h-16 bg-gradient-to-b ${accent} opacity-40`} />
              <div className="relative flex items-start justify-between mb-3">
                <div className={`flex h-9 w-9 items-center justify-center rounded-xl ${iconBg}`}>
                  <Icon className={`h-4 w-4 ${iconColor}`} />
                </div>
              </div>
              <p className="relative text-[26px] font-bold tracking-[-0.03em] leading-none text-bright">{value}</p>
              <p className="relative mt-2 text-[11px] font-medium text-dim-app">{label}</p>
            </div>
          ))}
        </div>
      )}

      {/* Status filters */}
      <div className="mb-4 flex gap-1.5 animate-in" style={{ animationDelay: "280ms" }}>
        {STATUS_FILTERS.map(({ value, label }) => (
          <button
            key={value}
            onClick={() => setFilter(value)}
            className={[
              "rounded-lg px-3 py-1.5 text-xs font-medium transition-[background-color,color,box-shadow]",
              "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-500",
              filter === value
                ? "bg-violet-600 text-white shadow-[0_1px_6px_rgba(124,58,237,0.35)]"
                : "bg-surface-subtle text-secondary-app hover:bg-surface-inset border border-surface",
            ].join(" ")}
          >
            {label}
          </button>
        ))}
      </div>

      {/* Table */}
      <div
        className="rounded-xl border border-surface animate-in"
        style={{ animationDelay: "340ms" }}
      >
        <div className="overflow-hidden rounded-xl bg-surface-card">
          {filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center gap-3 py-16 text-center">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-surface-subtle border border-surface">
                <Users className="h-5 w-5 text-faint-app" />
              </div>
              <p className="text-sm text-muted-app">No clients found.</p>
            </div>
          ) : (
            <table className="w-full">
              <thead>
                <tr className="border-b border-surface bg-overlay-xs">
                  {[
                    { label: "Client",          hide: false },
                    { label: "Email",           hide: true  },
                    { label: "Status",          hide: false },
                    { label: "Monthly Rate",    hide: true  },
                    { label: "Active Projects", hide: true  },
                  ].map(({ label, hide }) => (
                    <th key={label} className={`px-3 sm:px-5 py-3 text-left text-[10px] font-semibold uppercase tracking-widest text-dim-app ${hide ? "hidden sm:table-cell" : ""}`}>
                      {label}
                    </th>
                  ))}
                  <th className="px-5 py-3" />
                </tr>
              </thead>
              <tbody>
                {filtered.map((client, i) => {
                  const status  = (client.status ?? "inactive") as ClientStatus;
                  const initials = clientInitials(client.name);
                  const color    = avatarColor(client.name);
                  return (
                    <tr
                      key={client.id}
                      onClick={() => router.push(`/dashboard/clients/${client.id}`)}
                      className="group cursor-pointer border-b border-surface last:border-0 transition-[background-color] duration-100 hover:bg-overlay-sm animate-in"
                      style={{ animationDelay: `${400 + i * 35}ms` }}
                    >
                      <td className="px-3 sm:px-5 py-3.5">
                        <div className="flex items-center gap-3">
                          <div className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-[11px] font-bold ring-1 ${color}`}>
                            {initials}
                          </div>
                          <span className="font-medium text-sm text-primary-app transition-colors group-hover:text-bright">
                            {client.name}
                          </span>
                        </div>
                      </td>
                      <td className="hidden sm:table-cell px-5 py-3.5 text-sm text-muted-app">
                        {client.email ?? "—"}
                      </td>
                      <td className="px-3 sm:px-5 py-3.5">
                        <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium capitalize ${STATUS_BADGE[status]}`}>
                          <span className={`h-1.5 w-1.5 rounded-full ${STATUS_DOT[status]}`} />
                          {status}
                        </span>
                      </td>
                      <td className="hidden sm:table-cell px-5 py-3.5 text-sm font-semibold text-primary-app">
                        {client.monthly_rate != null ? formatCurrency(client.monthly_rate) : "—"}
                      </td>
                      <td className="hidden sm:table-cell px-5 py-3.5">
                        <span className="inline-flex items-center gap-1.5 text-sm">
                          <span className="font-semibold text-primary-app">
                            {activeProjectCount[client.id] ?? 0}
                          </span>
                          <span className="text-faint-app text-xs">
                            project{(activeProjectCount[client.id] ?? 0) !== 1 ? "s" : ""}
                          </span>
                        </span>
                      </td>
                      <td className="px-3 sm:px-5 py-3.5 text-right">
                        <ChevronRight className="ml-auto h-4 w-4 text-dim-app transition-[color,transform] duration-150 group-hover:text-violet-400 group-hover:translate-x-0.5" />
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* Add client dialog */}
      <Dialog open={addOpen} onOpenChange={setAddOpen}>
        <DialogContent className="max-w-lg bg-surface-card border-surface text-primary-app">
          <DialogHeader>
            <DialogTitle className="text-lg font-semibold tracking-[-0.02em] text-bright">
              Add Client
            </DialogTitle>
          </DialogHeader>
          <ClientForm onSuccess={handleClientAdded} onCancel={() => setAddOpen(false)} />
        </DialogContent>
      </Dialog>
    </div>
  );
}
