"use client";

import { useState, useMemo, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import {
  ChevronRight,
  ChevronLeft,
  Layers,
  Plus,
  Search,
  Users,
  Briefcase,
  DollarSign,
  Mail,
  Building2,
  TrendingUp,
  TrendingDown
} from "lucide-react";
import { revalidateDashboard } from "@/app/dashboard/actions";
import { fetchClientsPageAction } from "@/app/dashboard/clients/actions";
import {
  Dialog,
  DialogContent,
} from "@/components/ui/dialog";
import { ClientForm } from "@/components/clients/ClientForm";
import { formatCurrency } from "@/lib/utils";
import { useWorkspaceSlug } from "@/app/dashboard/workspace-context";
import { EmptyState } from "@/components/layout/EmptyState";
import type { ProjectListItem } from "@/lib/db/projects";
import type { Client, ClientStatus } from "@/lib/types";

const PAGE_SIZE = 5;

const STATUS_CONFIG: Record<string, { label: string; bg: string; text: string; dot: string }> = {
  active: {
    label: "Active",
    bg: 'rgba(38,201,127,0.12)',
    text: '#26c97f',
    dot: '#26c97f'
  },
  paused: {
    label: "Paused",
    bg: 'rgba(231,157,19,0.12)',
    text: '#e79d13',
    dot: '#e79d13'
  },
  inactive: {
    label: "Inactive",
    bg: 'rgba(136,136,136,0.12)',
    text: '#888',
    dot: '#888'
  },
};

function StatusBadge({ status }: { status: ClientStatus }) {
  const config = STATUS_CONFIG[status] ?? STATUS_CONFIG.inactive;

  return (
    <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md text-xs font-medium capitalize"
      style={{ background: config.bg, color: config.text }}>
      <span className="w-1.5 h-1.5 rounded-full" style={{ background: config.dot }} />
      {config.label}
    </span>
  );
}

function clientInitials(name: string): string {
  return name.split(" ").map((w) => w[0]).slice(0, 2).join("").toUpperCase();
}

interface ClientsClientProps {
  initialClients: Client[];
  totalClients: number;
  projects: ProjectListItem[];
  isAdmin: boolean;
}

export default function ClientsClient({ initialClients, totalClients, projects: initialProjects, isAdmin }: ClientsClientProps) {
  const router = useRouter();
  const slug = useWorkspaceSlug();
  const [clients, setClients] = useState<Client[]>(initialClients);
  const [total, setTotal] = useState(totalClients);
  const [projects, setProjects] = useState<ProjectListItem[]>(initialProjects);
  const [currentPage, setCurrentPage] = useState(0);
  const [loading, setLoading] = useState(false);
  const [filter, setFilter] = useState<ClientStatus | "all">("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [addOpen, setAddOpen] = useState(false);

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  useEffect(() => {
    setClients(initialClients);
    setTotal(totalClients);
    setProjects(initialProjects);
    setCurrentPage(0);
  }, [initialClients, totalClients, initialProjects]);

  const fetchPage = useCallback(async (page: number) => {
    setLoading(true);
    try {
      const result = await fetchClientsPageAction(page, PAGE_SIZE);
      setClients(result.clients);
      setTotal(result.total);
      setProjects(result.projects);
      setCurrentPage(page);
    } finally {
      setLoading(false);
    }
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

  // Calculate stats from current page
  const activeClients = clients.filter(c => c.status === "active").length;
  const totalMonthlyRevenue = clients.reduce((sum, client) => sum + (client.monthly_rate || 0), 0);
  const totalActiveProjects = Object.values(activeProjectCount).reduce((sum, count) => sum + count, 0);

  // Filter clients (client-side on current page)
  const filteredClients = useMemo(() => {
    let filtered = filter === "all" ? clients : clients.filter((c) => c.status === filter);

    if (searchQuery) {
      filtered = filtered.filter(c =>
        c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (c.email && c.email.toLowerCase().includes(searchQuery.toLowerCase()))
      );
    }

    return filtered;
  }, [clients, filter, searchQuery]);

  async function handleClientAdded(client: Client) {
    setAddOpen(false);
    await revalidateDashboard();
    await fetchPage(0);
  }

  return (
    <div className="flex flex-col h-full bg-[#0d0d0d]">

      {/* Header toolbar */}
      <div className="flex items-center justify-between px-6 h-[60px] border-b border-[rgba(255,255,255,0.06)] shrink-0">
        <div className="flex items-center gap-3">
          <Layers size={16} className="text-[#555]" />
          <h1 className="text-[15px] font-medium text-[#e8e8e8]">Clients</h1>
          <span className="text-[12px] text-[#555]">{total} total</span>
        </div>
        {isAdmin && (
          <button
            onClick={() => setAddOpen(true)}
            className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium
              bg-[#5e6ad2] hover:bg-[#6872e5] text-white transition-colors duration-150"
          >
            <Plus size={14} />
            Add Client
          </button>
        )}
      </div>

      {/* Main content */}
      <div className="flex-1 overflow-y-auto">
        <div className="p-6">

          {/* Stats cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            <div className="rounded-xl border border-[rgba(255,255,255,0.06)] bg-[#111111] p-4">
              <div className="flex items-center gap-2 mb-2">
                <Users size={14} className="text-[#5e6ad2]" />
                <span className="text-[11px] text-[#555]">Total Clients</span>
              </div>
              <p className="text-[24px] font-medium text-[#e8e8e8]">{total}</p>
            </div>

            <div className="rounded-xl border border-[rgba(255,255,255,0.06)] bg-[#111111] p-4">
              <div className="flex items-center gap-2 mb-2">
                <TrendingUp size={14} className="text-[#26c97f]" />
                <span className="text-[11px] text-[#555]">Active Clients</span>
              </div>
              <p className="text-[24px] font-medium text-[#e8e8e8]">{activeClients}</p>
              <p className="text-[11px] text-[#555] mt-1">{total > 0 ? Math.round((activeClients / total) * 100) : 0}% of total</p>
            </div>

            <div className="rounded-xl border border-[rgba(255,255,255,0.06)] bg-[#111111] p-4">
              <div className="flex items-center gap-2 mb-2">
                <Briefcase size={14} className="text-[#5e6ad2]" />
                <span className="text-[11px] text-[#555]">Active Projects</span>
              </div>
              <p className="text-[24px] font-medium text-[#e8e8e8]">{totalActiveProjects}</p>
            </div>

            <div className="rounded-xl border border-[rgba(255,255,255,0.06)] bg-[#111111] p-4">
              <div className="flex items-center gap-2 mb-2">
                <DollarSign size={14} className="text-[#e79d13]" />
                <span className="text-[11px] text-[#555]">Monthly Revenue</span>
              </div>
              <p className="text-[24px] font-medium text-[#e8e8e8]">{formatCurrency(totalMonthlyRevenue)}</p>
            </div>
          </div>

          {/* Search and Filter */}
          <div className="flex flex-col sm:flex-row gap-3 mb-6">
            <div className="flex-1 relative">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#555]" />
              <input
                type="text"
                placeholder="Search clients by name or email..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-3 py-2 rounded-lg
                  bg-[#111111] border border-[rgba(255,255,255,0.08)]
                  text-[13px] text-[#f0f0f0] placeholder:text-[#555]
                  focus:outline-none focus:border-[rgba(94,106,210,0.5)]
                  transition-colors duration-150"
              />
            </div>
            <div className="flex gap-2">
              {["all", "active", "paused", "inactive"].map((filterValue) => (
                <button
                  key={filterValue}
                  onClick={() => setFilter(filterValue as ClientStatus | "all")}
                  className={`px-3 py-1.5 rounded-lg text-[12px] font-medium transition-colors duration-150
                    ${filter === filterValue
                      ? 'bg-[#5e6ad2] text-white'
                      : 'bg-[#111111] text-[#888] hover:text-[#e8e8e8] border border-[rgba(255,255,255,0.08)]'}`}
                >
                  {filterValue === "all" ? "All" : filterValue.charAt(0).toUpperCase() + filterValue.slice(1)}
                </button>
              ))}
            </div>
          </div>

          {/* Clients Table */}
          {filteredClients.length === 0 && !loading ? (
            <div className="text-center py-12">
              <p className="text-[13px] text-[#888] mb-2">
                {searchQuery || filter !== "all" ? "No clients found" : "No clients yet"}
              </p>
              {isAdmin && !searchQuery && filter === "all" && (
                <button
                  onClick={() => setAddOpen(true)}
                  className="text-[12px] text-[#5e6ad2] hover:text-[#7e8ae6] transition-colors duration-150"
                >
                  Add your first client →
                </button>
              )}
            </div>
          ) : (
            <div className="rounded-lg border border-[rgba(255,255,255,0.06)] overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-[rgba(255,255,255,0.06)] bg-[#111111]">
                      <th className="px-5 py-3 text-left text-[11px] font-medium text-[#555] uppercase tracking-[0.06em]">
                        Client
                      </th>
                      <th className="px-5 py-3 text-left text-[11px] font-medium text-[#555] uppercase tracking-[0.06em] hidden sm:table-cell">
                        Contact
                      </th>
                      <th className="px-5 py-3 text-left text-[11px] font-medium text-[#555] uppercase tracking-[0.06em]">
                        Status
                      </th>
                      <th className="px-5 py-3 text-left text-[11px] font-medium text-[#555] uppercase tracking-[0.06em] hidden md:table-cell">
                        Monthly Rate
                      </th>
                      <th className="px-5 py-3 text-left text-[11px] font-medium text-[#555] uppercase tracking-[0.06em] hidden lg:table-cell">
                        Active Projects
                      </th>
                      <th className="px-5 py-3 w-8" />
                    </tr>
                  </thead>
                  <tbody className={loading ? 'opacity-50 pointer-events-none' : ''}>
                    {filteredClients.map((client) => {
                      const status = (client.status ?? "inactive") as ClientStatus;
                      const projectCount = activeProjectCount[client.id] ?? 0;

                      return (
                        <tr
                          key={client.id}
                          onClick={() => router.push(`/${slug}/clients/${client.id}`)}
                          className="group border-b border-[rgba(255,255,255,0.06)] last:border-0
                            hover:bg-[#1c1c1c] cursor-pointer transition-colors duration-[120ms]"
                        >
                          <td className="px-5 py-3.5">
                            <div className="flex items-center gap-3">
                              <div className="w-8 h-8 rounded-lg bg-[rgba(94,106,210,0.12)]
                                flex items-center justify-center flex-shrink-0">
                                <Building2 size={14} className="text-[#5e6ad2]" />
                              </div>
                              <div className="min-w-0">
                                <span className="text-[13px] text-[#f0f0f0] block truncate">
                                  {client.name}
                                </span>
                                {client.email && (
                                  <span className="text-[11px] text-[#555] block truncate sm:hidden">
                                    {client.email}
                                  </span>
                                )}
                              </div>
                            </div>
                          </td>

                          <td className="px-5 py-3.5 hidden sm:table-cell">
                            <div className="min-w-0">
                              {client.email ? (
                                <div className="flex items-center gap-1.5">
                                  <Mail size={12} className="text-[#555] flex-shrink-0" />
                                  <span className="text-[12px] text-[#888] truncate">
                                    {client.email}
                                  </span>
                                </div>
                              ) : (
                                <span className="text-[12px] text-[#3a3a3a]">—</span>
                              )}
                            </div>
                          </td>

                          <td className="px-5 py-3.5">
                            <StatusBadge status={status} />
                          </td>

                          <td className="px-5 py-3.5 hidden md:table-cell">
                            {client.monthly_rate != null ? (
                              <span className="text-[13px] text-[#f0f0f0] font-medium tabular-nums">
                                {formatCurrency(client.monthly_rate)}
                              </span>
                            ) : (
                              <span className="text-[12px] text-[#3a3a3a]">—</span>
                            )}
                          </td>

                          <td className="px-5 py-3.5 hidden lg:table-cell">
                            {projectCount > 0 ? (
                              <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md text-xs font-medium"
                                style={{ background: 'rgba(94,106,210,0.12)', color: '#5e6ad2' }}>
                                <Briefcase size={10} />
                                {projectCount} {projectCount === 1 ? 'project' : 'projects'}
                              </span>
                            ) : (
                              <span className="text-[12px] text-[#3a3a3a]">—</span>
                            )}
                          </td>

                          <td className="px-5 py-3.5 text-right">
                            <ChevronRight size={14} className="text-[#3a3a3a] group-hover:text-[#555]
                              transition-colors duration-150 ml-auto" />
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {/* Pagination controls */}
              {totalPages > 1 && (
                <div className="flex items-center justify-between px-5 py-3
                  border-t border-[rgba(255,255,255,0.06)] bg-[#111111]">
                  <span className="text-[12px] text-[#555]">
                    Page {currentPage + 1} of {totalPages}
                  </span>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => fetchPage(currentPage - 1)}
                      disabled={currentPage === 0 || loading}
                      className="flex items-center gap-1 px-3 py-1.5 rounded-md text-[12px] font-medium
                        text-[#888] hover:text-[#e8e8e8] hover:bg-white/5
                        disabled:opacity-30 disabled:cursor-not-allowed disabled:hover:bg-transparent disabled:hover:text-[#888]
                        transition-colors duration-150"
                    >
                      <ChevronLeft size={14} />
                      Previous
                    </button>
                    <div className="flex items-center gap-1">
                      {Array.from({ length: totalPages }, (_, i) => (
                        <button
                          key={i}
                          onClick={() => fetchPage(i)}
                          disabled={loading}
                          className={`w-8 h-8 rounded-md text-[12px] font-medium transition-colors duration-150
                            ${i === currentPage
                              ? 'bg-[#5e6ad2] text-white'
                              : 'text-[#888] hover:text-[#e8e8e8] hover:bg-white/5'
                            }
                            disabled:cursor-not-allowed`}
                        >
                          {i + 1}
                        </button>
                      ))}
                    </div>
                    <button
                      onClick={() => fetchPage(currentPage + 1)}
                      disabled={currentPage >= totalPages - 1 || loading}
                      className="flex items-center gap-1 px-3 py-1.5 rounded-md text-[12px] font-medium
                        text-[#888] hover:text-[#e8e8e8] hover:bg-white/5
                        disabled:opacity-30 disabled:cursor-not-allowed disabled:hover:bg-transparent disabled:hover:text-[#888]
                        transition-colors duration-150"
                    >
                      Next
                      <ChevronRight size={14} />
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      <Dialog open={addOpen} onOpenChange={setAddOpen}>
        <DialogContent className="
          bg-[#111111] border border-[rgba(255,255,255,0.08)] rounded-xl
          shadow-2xl p-0 gap-0 max-w-[520px] w-full">
          <div className="flex items-center justify-between px-6 pt-5 pb-4
            border-b border-[rgba(255,255,255,0.06)]">
            <div>
              <h3 className="text-[15px] font-medium text-[#f0f0f0]">Add Client</h3>
              <p className="text-[11px] text-[#555] mt-1">Add a new client to your workspace</p>
            </div>
          </div>
          <div className="p-6">
            <ClientForm onSuccess={handleClientAdded} onCancel={() => setAddOpen(false)} />
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
