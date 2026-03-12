"use client";

import { useEffect, useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { Plus, Users, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { getClients } from "@/lib/db/clients";
import { getProjects } from "@/lib/db/projects";
import { ClientForm } from "@/components/clients/ClientForm";
import { formatCurrency } from "@/lib/utils";
import type { Client, Project, ClientStatus } from "@/lib/types";

const STATUS_FILTERS: { value: ClientStatus | "all"; label: string }[] = [
  { value: "all", label: "All" },
  { value: "active", label: "Active" },
  { value: "paused", label: "Paused" },
  { value: "inactive", label: "Inactive" },
];

const STATUS_BADGE: Record<ClientStatus, string> = {
  active: "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200",
  paused: "bg-amber-50 text-amber-700 ring-1 ring-amber-200",
  inactive: "bg-slate-100 text-slate-500 ring-1 ring-slate-200",
};

export default function ClientsPage() {
  const router = useRouter();
  const [clients, setClients] = useState<Client[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<ClientStatus | "all">("all");
  const [addOpen, setAddOpen] = useState(false);

  async function load() {
    try {
      const [c, p] = await Promise.all([getClients(), getProjects()]);
      setClients(c);
      setProjects(p);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load clients.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

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
    () =>
      filter === "all" ? clients : clients.filter((c) => c.status === filter),
    [clients, filter]
  );

  function handleClientAdded(client: Client) {
    setClients((prev) =>
      [...prev, client].sort((a, b) => a.name.localeCompare(b.name))
    );
    setAddOpen(false);
  }

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="h-8 w-48 animate-pulse rounded-lg bg-slate-200" />
        <div className="h-64 animate-pulse rounded-xl bg-slate-200" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-xl bg-rose-50 px-6 py-4 text-sm text-rose-600 ring-1 ring-rose-200">
        {error}
      </div>
    );
  }

  return (
    <>
      {/* Header */}
      <div className="mb-6 flex items-start justify-between">
        <div>
          <h1 className="font-display text-3xl font-bold tracking-[-0.03em] text-slate-900">
            Clients
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            {clients.length} client{clients.length !== 1 ? "s" : ""} total
          </p>
        </div>
        <Button
          onClick={() => setAddOpen(true)}
          className="gap-1.5 bg-violet-600 hover:bg-violet-700 text-white focus-visible:ring-violet-500"
        >
          <Plus className="h-4 w-4" />
          Add Client
        </Button>
      </div>

      {/* Status filters */}
      <div className="mb-4 flex gap-1.5">
        {STATUS_FILTERS.map(({ value, label }) => (
          <button
            key={value}
            onClick={() => setFilter(value)}
            className={[
              "rounded-lg px-3 py-1.5 text-xs font-medium transition-colors",
              "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-500",
              filter === value
                ? "bg-violet-600 text-white shadow-[0_1px_6px_rgba(124,58,237,0.35)]"
                : "bg-white text-slate-600 hover:bg-slate-100 ring-1 ring-slate-200",
            ].join(" ")}
          >
            {label}
          </button>
        ))}
      </div>

      {/* Table */}
      <div className="overflow-x-auto rounded-xl shadow-[0_1px_3px_rgba(0,0,0,0.08),0_4px_16px_rgba(0,0,0,0.04)] ring-1 ring-slate-100">
      <div className="min-w-[640px] overflow-hidden rounded-xl bg-white">
        {filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center gap-3 py-16 text-center">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-slate-100">
              <Users className="h-5 w-5 text-slate-400" />
            </div>
            <p className="text-sm text-slate-500">No clients found.</p>
          </div>
        ) : (
          <table className="w-full">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50/70">
                {[
                  "Client",
                  "Email",
                  "Status",
                  "Monthly Rate",
                  "Active Projects",
                ].map((h) => (
                  <th
                    key={h}
                    className="px-5 py-3 text-left text-[11px] font-semibold uppercase tracking-wide text-slate-400"
                  >
                    {h}
                  </th>
                ))}
                <th className="px-5 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {filtered.map((client) => {
                const status = (client.status ?? "inactive") as ClientStatus;
                return (
                  <tr
                    key={client.id}
                    onClick={() =>
                      router.push(`/dashboard/clients/${client.id}`)
                    }
                    className="group cursor-pointer transition-colors hover:bg-violet-50/40 active:bg-violet-50/70"
                  >
                    <td className="px-5 py-3.5">
                      <span className="font-medium text-slate-900 transition-colors group-hover:text-violet-700">
                        {client.name}
                      </span>
                    </td>
                    <td className="px-5 py-3.5 text-sm text-slate-500">
                      {client.email ?? "—"}
                    </td>
                    <td className="px-5 py-3.5">
                      <span
                        className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium capitalize ${STATUS_BADGE[status]}`}
                      >
                        {status}
                      </span>
                    </td>
                    <td className="px-5 py-3.5 text-sm text-slate-700">
                      {client.monthly_rate != null
                        ? formatCurrency(client.monthly_rate)
                        : "—"}
                    </td>
                    <td className="px-5 py-3.5">
                      <span className="text-sm font-medium text-slate-700">
                        {activeProjectCount[client.id] ?? 0}
                      </span>
                    </td>
                    <td className="px-5 py-3.5 text-right">
                      <ChevronRight className="ml-auto h-4 w-4 text-slate-300 transition-colors group-hover:text-violet-400" />
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
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="font-display text-lg tracking-tight">
              Add Client
            </DialogTitle>
          </DialogHeader>
          <ClientForm
            onSuccess={handleClientAdded}
            onCancel={() => setAddOpen(false)}
          />
        </DialogContent>
      </Dialog>
    </>
  );
}