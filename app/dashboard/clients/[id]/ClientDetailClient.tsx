"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { revalidateDashboard } from "@/app/dashboard/actions";
import {
  Search,
  RefreshCw,
  Copy,
  Check,
  Users,
  ArrowLeft,
  Layers,
  Briefcase,
  DollarSign,
  Calendar,
  Mail,
  Building2,
  FileText,
  CreditCard,
  AlertCircle,
  X,
  Pencil,
  ChevronRight,
  Plus
} from "lucide-react";
import { getClientById } from "@/lib/db/clients";
import type { ClientListItem } from "@/lib/db/clients";
import { resetPortalPasswordAction, searchClientsForSidebarAction } from "@/app/dashboard/clients/actions";
import { getProjectsForList } from "@/lib/db/projects";
import type { ProjectListItem } from "@/lib/db/projects";
import { getInvoicesForList } from "@/lib/db/invoices";
import type { InvoiceListItem } from "@/lib/db/invoices";
import { ClientForm } from "@/components/clients/ClientForm";
import { formatCurrency, formatDate } from "@/lib/utils";
import { useWorkspaceSlug } from "@/app/dashboard/workspace-context";
import type { Client, ClientStatus, InvoiceStatus } from "@/lib/types";

// Status configuration matching project detail style
const CLIENT_STATUS_CONFIG: Record<ClientStatus, { label: string; bg: string; text: string; dot: string; icon: any }> = {
  active: { 
    label: "Active", 
    bg: "rgba(38,201,127,0.12)", 
    text: "#26c97f", 
    dot: "#26c97f",
    icon: Check
  },
  paused: { 
    label: "Paused", 
    bg: "rgba(231,157,19,0.12)", 
    text: "#e79d13", 
    dot: "#e79d13",
    icon: AlertCircle
  },
  inactive: { 
    label: "Inactive", 
    bg: "rgba(136,136,136,0.12)", 
    text: "#888", 
    dot: "#888",
    icon: X
  },
};

const PROJECT_STATUS_CONFIG: Record<string, { label: string; bg: string; text: string; dot: string }> = {
  active: { 
    label: "Active", 
    bg: "rgba(38,201,127,0.12)", 
    text: "#26c97f", 
    dot: "#26c97f" 
  },
  in_progress: { 
    label: "In Progress", 
    bg: "rgba(94,106,210,0.12)", 
    text: "#5e6ad2", 
    dot: "#5e6ad2" 
  },
  completed: { 
    label: "Completed", 
    bg: "rgba(136,136,136,0.12)", 
    text: "#888", 
    dot: "#888" 
  },
  paused: { 
    label: "Paused", 
    bg: "rgba(231,157,19,0.12)", 
    text: "#e79d13", 
    dot: "#e79d13" 
  },
};

const INVOICE_STATUS_CONFIG: Record<InvoiceStatus, { label: string; bg: string; text: string }> = {
  paid: { 
    label: "Paid", 
    bg: "rgba(38,201,127,0.12)", 
    text: "#26c97f" 
  },
  pending: { 
    label: "Pending", 
    bg: "rgba(231,157,19,0.12)", 
    text: "#e79d13" 
  },
  overdue: { 
    label: "Overdue", 
    bg: "rgba(229,72,77,0.12)", 
    text: "#e5484d" 
  },
};

function getStatusConfig(status: ClientStatus) {
  return CLIENT_STATUS_CONFIG[status] ?? CLIENT_STATUS_CONFIG.inactive;
}

function ClientStatusBadge({ status }: { status: ClientStatus }) {
  const config = getStatusConfig(status);
  
  return (
    <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md text-xs font-medium`}
      style={{ background: config.bg, color: config.text }}>
      <span className={`w-1.5 h-1.5 rounded-full`} style={{ background: config.dot }} />
      {config.label}
    </span>
  );
}

function ProjectStatusBadge({ status }: { status: string }) {
  const config = PROJECT_STATUS_CONFIG[status] ?? PROJECT_STATUS_CONFIG.active;
  
  return (
    <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md text-[10px] font-medium`}
      style={{ background: config.bg, color: config.text }}>
      <span className={`w-1 h-1 rounded-full`} style={{ background: config.dot }} />
      {config.label}
    </span>
  );
}

function InvoiceStatusBadge({ status }: { status: InvoiceStatus }) {
  const config = INVOICE_STATUS_CONFIG[status] ?? INVOICE_STATUS_CONFIG.pending;
  
  return (
    <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md text-[10px] font-medium`}
      style={{ background: config.bg, color: config.text }}>
      {config.label}
    </span>
  );
}

interface ClientDetailClientProps {
  clientId: string;
  initialSidebarClients: ClientListItem[];
  initialClient: Client;
  initialProjects: ProjectListItem[];
  initialInvoices: InvoiceListItem[];
  isAdmin: boolean;
}

export default function ClientDetailClient({
  clientId,
  initialSidebarClients,
  initialClient,
  initialProjects,
  initialInvoices,
  isAdmin,
}: ClientDetailClientProps) {
  const router = useRouter();
  const slug = useWorkspaceSlug();
  const [selectedId, setSelectedId] = useState(clientId);
  const [search, setSearch] = useState("");

  const [client, setClient] = useState<Client | null>(initialClient);
  const [projects, setProjects] = useState<ProjectListItem[]>(initialProjects);
  const [invoices, setInvoices] = useState<InvoiceListItem[]>(initialInvoices);
  const [sidebarClients, setSidebarClients] = useState<ClientListItem[]>(initialSidebarClients);
  const [sidebarSearching, setSidebarSearching] = useState(false);
  const [sidebarPage, setSidebarPage] = useState(0);
  const [sidebarHasMore, setSidebarHasMore] = useState(initialSidebarClients.length === 5);
  const [loading, setLoading] = useState(false);
  const [relatedLoading, setRelatedLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<"projects" | "invoices">("projects");
  const [isEditing, setIsEditing] = useState(false);
  const [copied, setCopied] = useState(false);
  const [resetting, setResetting] = useState(false);
  const [newPlainPassword, setNewPlainPassword] = useState<string | null>(null);

  // Fetch sidebar page (search + pagination)
  async function fetchSidebar(page: number, query?: string) {
    setSidebarSearching(true);
    try {
      const results = await searchClientsForSidebarAction(query ?? search, page);
      setSidebarClients(results);
      setSidebarPage(page);
      setSidebarHasMore(results.length === 5);
    } finally {
      setSidebarSearching(false);
    }
  }

  // Debounced search — resets to page 0
  useEffect(() => {
    if (!search.trim()) {
      setSidebarClients(initialSidebarClients);
      setSidebarPage(0);
      setSidebarHasMore(initialSidebarClients.length === 5);
      return;
    }
    const timer = setTimeout(() => fetchSidebar(0, search), 300);
    return () => clearTimeout(timer);
  }, [search, initialSidebarClients]);

  const filteredClients = sidebarClients;

  const [loadedId, setLoadedId] = useState(clientId);

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
    window.history.replaceState(null, "", `/${slug}/clients/${id}`);
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
  const totalProjectsValue = projects.reduce((sum, p) => sum + (p.total_value || 0), 0);
  const totalInvoicesAmount = invoices.reduce((sum, inv) => sum + (inv.amount || 0), 0);

  return (
    <div className="flex flex-col h-full bg-[#0d0d0d]">
      
      {/* Header toolbar */}
      <div className="flex items-center justify-between px-6 h-[60px] border-b border-[rgba(255,255,255,0.06)] shrink-0">
        <div className="flex items-center gap-3">
          <button
            onClick={() => router.push(`/${slug}/clients`)}
            className="flex items-center justify-center h-8 w-8 rounded-lg text-[#555] hover:text-[#e8e8e8] hover:bg-white/5 transition-all duration-150"
          >
            <ArrowLeft size={16} />
          </button>
          <div className="w-px h-5 bg-[rgba(255,255,255,0.06)]" />
          <div className="flex items-center gap-2">
            <Users size={16} className="text-[#5e6ad2]" />
            <h1 className="text-[15px] font-medium text-[#e8e8e8]">Client Details</h1>
          </div>
        </div>
        
      </div>

      {/* Main content */}
      <div className="flex-1 overflow-y-auto">
        <div className="p-6">

          {/* Client sidebar and content - 2 column layout */}
          <div className="flex gap-6 items-start">

            {/* Left sidebar - Client list */}
            <aside className="hidden lg:block w-[320px] shrink-0">
              <div className="rounded-xl border border-[rgba(255,255,255,0.06)] bg-[#111111] overflow-hidden sticky top-6">
                <div className="p-4 border-b border-[rgba(255,255,255,0.06)]">
                  <div className="flex items-center gap-2 mb-3">
                    <Layers size={14} className="text-[#5e6ad2]" />
                    <h2 className="text-[13px] font-medium text-[#e8e8e8]">All Clients</h2>
                  </div>
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-[#555]" />
                    <input
                      type="text"
                      value={search}
                      onChange={(e) => setSearch(e.target.value)}
                      placeholder="Search clients..."
                      className="w-full pl-9 pr-3 py-2 rounded-lg bg-[#1a1a1a] border border-[rgba(255,255,255,0.08)] text-[#f0f0f0] text-[13px] placeholder:text-[#555] focus:outline-none focus:border-[rgba(94,106,210,0.5)] transition-all duration-150"
                    />
                  </div>
                </div>

                <div className="max-h-[calc(100vh-200px)] overflow-y-auto">
                  {sidebarSearching ? (
                    <div className="flex flex-col items-center justify-center gap-2 py-12 text-center">
                      <div className="w-5 h-5 border-2 border-[#5e6ad2] border-t-transparent rounded-full animate-spin" />
                      <p className="text-[12px] text-[#555]">Searching...</p>
                    </div>
                  ) : filteredClients.length === 0 ? (
                    <div className="flex flex-col items-center justify-center gap-2 py-12 text-center">
                      <Users className="h-8 w-8 text-[#3a3a3a]" />
                      <p className="text-[12px] text-[#555]">No clients found</p>
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
                            "w-full text-left px-4 py-3 border-b border-[rgba(255,255,255,0.06)] last:border-0 transition-all duration-150",
                            isActive
                              ? "bg-[rgba(94,106,210,0.08)] border-l-2 border-l-[#5e6ad2]"
                              : "hover:bg-white/5",
                          ].join(" ")}
                        >
                          <div className="flex items-center justify-between gap-2 mb-1.5">
                            <span className={[
                              "text-[13px] font-medium truncate",
                              isActive ? "text-[#5e6ad2]" : "text-[#e8e8e8]"
                            ].join(" ")}>
                              {c.name}
                            </span>
                            <ClientStatusBadge status={cStatus} />
                          </div>
                          <div className="flex items-center justify-between gap-2 text-[11px]">
                            <span className="text-[#555] truncate">
                              {c.email ?? "No email"}
                            </span>
                            <span className="text-[#888] font-medium tabular-nums shrink-0">
                              {c.monthly_rate != null ? formatCurrency(c.monthly_rate) : "—"}
                            </span>
                          </div>
                        </button>
                      );
                    })
                  )}
                </div>

                {/* Sidebar pagination */}
                {(sidebarPage > 0 || sidebarHasMore) && (
                  <div className="flex items-center justify-between px-4 py-2
                    border-t border-[rgba(255,255,255,0.06)] bg-[#111111]">
                    <button
                      onClick={() => fetchSidebar(sidebarPage - 1)}
                      disabled={sidebarPage === 0 || sidebarSearching}
                      className="text-[11px] font-medium text-[#888] hover:text-[#e8e8e8]
                        disabled:opacity-30 disabled:cursor-not-allowed disabled:hover:text-[#888]
                        transition-colors duration-150"
                    >
                      ← Previous
                    </button>
                    <span className="text-[10px] text-[#555]">{sidebarPage + 1}</span>
                    <button
                      onClick={() => fetchSidebar(sidebarPage + 1)}
                      disabled={!sidebarHasMore || sidebarSearching}
                      className="text-[11px] font-medium text-[#888] hover:text-[#e8e8e8]
                        disabled:opacity-30 disabled:cursor-not-allowed disabled:hover:text-[#888]
                        transition-colors duration-150"
                    >
                      Next →
                    </button>
                  </div>
                )}
              </div>
            </aside>

            {/* Right panel — Client detail */}
            <div className="flex-1 min-w-0">
              
              {loading ? (
                <div className="space-y-6 animate-pulse">
                  <div className="rounded-xl border border-[rgba(255,255,255,0.06)] bg-[#111111] overflow-hidden">
                    <div className="p-6">
                      <div className="h-8 w-64 bg-white/5 rounded mb-3" />
                      <div className="h-4 w-32 bg-white/5 rounded" />
                    </div>
                    <div className="grid grid-cols-3 gap-4 p-6 border-t border-[rgba(255,255,255,0.06)]">
                      {[1,2,3].map(i => (
                        <div key={i} className="space-y-2">
                          <div className="h-3 w-16 bg-white/5 rounded" />
                          <div className="h-5 w-20 bg-white/5 rounded" />
                        </div>
                      ))}
                    </div>
                  </div>
                  <div className="rounded-xl border border-[rgba(255,255,255,0.06)] bg-[#111111] p-6">
                    <div className="h-6 w-32 bg-white/5 rounded mb-4" />
                    <div className="space-y-3">
                      {[1,2,3].map(i => (
                        <div key={i} className="h-12 bg-white/5 rounded" />
                      ))}
                    </div>
                  </div>
                </div>
              ) : error || !client ? (
                <div className="rounded-xl bg-[rgba(229,72,77,0.10)] border border-[rgba(229,72,77,0.2)] p-6">
                  <p className="text-[13px] text-[#e5484d]">{error ?? "Client not found."}</p>
                </div>
              ) : (
                <div className="space-y-6">
                  
                  {/* Client header card */}
                  <div className="rounded-xl border border-[rgba(255,255,255,0.06)] bg-[#111111] overflow-hidden">
                    <div className="p-6">
                      <div className="flex items-start justify-between gap-4 mb-4">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-2">
                            <Building2 size={16} className="text-[#5e6ad2]" />
                            <h1 className="text-xl font-semibold text-[#e8e8e8] truncate">
                              {client.name}
                            </h1>
                          </div>
                          {client.email && (
                            <div className="flex items-center gap-1.5 text-[13px] text-[#555]">
                              <Mail size={12} />
                              {client.email}
                            </div>
                          )}
                        </div>
                        <div className="flex items-center gap-2 shrink-0">
                          <ClientStatusBadge status={status} />
                          {isAdmin && !isEditing && (
                            <button 
                              onClick={() => setIsEditing(true)} 
                              className="px-3 py-1.5 rounded-lg text-[12px] font-medium text-[#8a8a8a] hover:text-[#e8e8e8] hover:bg-white/5 border border-[rgba(255,255,255,0.08)] transition-all duration-150 flex items-center gap-1.5"
                            >
                              <Pencil className="h-3.5 w-3.5" /> Edit
                            </button>
                          )}
                        </div>
                      </div>

                      {isEditing ? (
                        <div className="pt-4 border-t border-[rgba(255,255,255,0.06)]">
                          <ClientForm 
                            client={client} 
                            onSuccess={async (updated) => { 
                              setClient(updated); 
                              setIsEditing(false); 
                              await revalidateDashboard(); 
                              router.refresh(); 
                            }} 
                            onCancel={() => setIsEditing(false)} 
                          />
                        </div>
                      ) : (
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-4 border-t border-[rgba(255,255,255,0.06)]">
                          <div>
                            <p className="text-[11px] font-medium text-[#555] uppercase tracking-[0.06em] mb-1.5">
                              Monthly Rate
                            </p>
                            <div className="flex items-center gap-1.5">
                              <DollarSign size={14} className="text-[#555]" />
                              <span className="text-sm font-medium text-[#e8e8e8]">
                                {client.monthly_rate != null ? formatCurrency(client.monthly_rate) : "—"}
                              </span>
                            </div>
                          </div>
                          
                          <div>
                            <p className="text-[11px] font-medium text-[#555] uppercase tracking-[0.06em] mb-1.5">
                              Start Date
                            </p>
                            <div className="flex items-center gap-1.5">
                              <Calendar size={14} className="text-[#555]" />
                              <span className="text-sm text-[#e8e8e8]">
                                {client.start_date ? formatDate(client.start_date) : "—"}
                              </span>
                            </div>
                          </div>
                          
                          <div>
                            <p className="text-[11px] font-medium text-[#555] uppercase tracking-[0.06em] mb-1.5">
                              Project Type
                            </p>
                            <span className="text-sm text-[#e8e8e8]">
                              {client.project_type ?? "—"}
                            </span>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Stats cards */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="rounded-xl border border-[rgba(255,255,255,0.06)] bg-[#111111] p-4">
                      <div className="flex items-center gap-2 mb-2">
                        <Briefcase size={14} className="text-[#5e6ad2]" />
                        <span className="text-[11px] text-[#555]">Active Projects</span>
                      </div>
                      <p className="text-2xl font-semibold text-[#e8e8e8]">
                        {projects.filter(p => p.status === "active" || p.status === "in_progress").length}
                      </p>
                      <p className="text-[11px] text-[#555] mt-1">Out of {projects.length} total</p>
                    </div>
                    
                    <div className="rounded-xl border border-[rgba(255,255,255,0.06)] bg-[#111111] p-4">
                      <div className="flex items-center gap-2 mb-2">
                        <DollarSign size={14} className="text-[#26c97f]" />
                        <span className="text-[11px] text-[#555]">Total Project Value</span>
                      </div>
                      <p className="text-2xl font-semibold text-[#e8e8e8]">
                        {formatCurrency(totalProjectsValue)}
                      </p>
                    </div>
                    
                    <div className="rounded-xl border border-[rgba(255,255,255,0.06)] bg-[#111111] p-4">
                      <div className="flex items-center gap-2 mb-2">
                        <CreditCard size={14} className="text-[#e79d13]" />
                        <span className="text-[11px] text-[#555]">Total Invoices</span>
                      </div>
                      <p className="text-2xl font-semibold text-[#e8e8e8]">
                        {formatCurrency(totalInvoicesAmount)}
                      </p>
                    </div>
                  </div>

                  {/* Projects / Invoices tabs */}
                  <div className="rounded-xl border border-[rgba(255,255,255,0.06)] bg-[#111111] overflow-hidden">
                    <div className="flex gap-1 border-b border-[rgba(255,255,255,0.06)] px-6 pt-3">
                      {(["projects", "invoices"] as const).map((tab) => (
                        <button
                          key={tab}
                          onClick={() => setActiveTab(tab)}
                          className={[
                            "px-4 py-2 text-sm font-medium capitalize transition-colors duration-150 rounded-t-lg",
                            activeTab === tab 
                              ? "text-[#5e6ad2] border-b-2 border-[#5e6ad2]" 
                              : "text-[#555] hover:text-[#888]",
                          ].join(" ")}
                        >
                          {tab}
                          <span className="ml-2 px-1.5 py-0.5 rounded-md text-[10px] font-medium bg-[rgba(255,255,255,0.06)] text-[#555]">
                            {tab === "projects" ? projects.length : invoices.length}
                          </span>
                        </button>
                      ))}
                    </div>
                    
                    <div className="p-6">
                      {activeTab === "projects" && (
                        relatedLoading ? (
                          <div className="space-y-3">
                            {[1, 2, 3].map(i => (
                              <div key={i} className="h-16 bg-[#1a1a1a] rounded-lg animate-pulse" />
                            ))}
                          </div>
                        ) : projects.length === 0 ? (
                          <div className="text-center py-8">
                            <Briefcase className="h-12 w-12 text-[#3a3a3a] mx-auto mb-3" />
                            <p className="text-sm text-[#555]">No projects yet for this client</p>
                          </div>
                        ) : (
                          <div className="divide-y divide-[rgba(255,255,255,0.06)]">
                            {projects.map((p) => (
                              <Link
                                key={p.id}
                                href={`/${slug}/projects/${p.id}`}
                                className="py-3 flex items-center justify-between gap-3 group hover:cursor-pointer"
                              >
                                <div className="min-w-0 flex-1">
                                  <div className="flex items-center gap-2">
                                    <p className="text-sm font-medium text-[#e8e8e8] truncate group-hover:text-[#5e6ad2] transition-colors">
                                      {p.name}
                                    </p>
                                    <ProjectStatusBadge status={p.status ?? "active"} />
                                  </div>
                                  {p.deadline && (
                                    <div className="flex items-center gap-1 mt-1">
                                      <Calendar size={10} className="text-[#555]" />
                                      <span className="text-[11px] text-[#555]">
                                        Due {formatDate(p.deadline)}
                                      </span>
                                    </div>
                                  )}
                                </div>
                                <div className="shrink-0 flex items-center gap-3">
                                  <span className="text-sm font-medium text-[#e8e8e8] tabular-nums">
                                    {p.total_value != null ? formatCurrency(p.total_value) : "—"}
                                  </span>
                                  <ChevronRight size={14} className="text-[#3a3a3a] group-hover:text-[#555] transition-colors" />
                                </div>
                              </Link>
                            ))}
                          </div>
                        )
                      )}
                      
                      {activeTab === "invoices" && (
                        relatedLoading ? (
                          <div className="space-y-3">
                            {[1, 2, 3].map(i => (
                              <div key={i} className="h-16 bg-[#1a1a1a] rounded-lg animate-pulse" />
                            ))}
                          </div>
                        ) : invoices.length === 0 ? (
                          <div className="text-center py-8">
                            <FileText className="h-12 w-12 text-[#3a3a3a] mx-auto mb-3" />
                            <p className="text-sm text-[#555]">No invoices yet for this client</p>
                          </div>
                        ) : (
                          <div className="divide-y divide-[rgba(255,255,255,0.06)]">
                            {invoices.map((inv) => (
                              <Link
                                key={inv.id}
                                href={`/${slug}/invoices/${inv.id}`}
                                className="py-3 flex items-center justify-between gap-3 group hover:cursor-pointer"
                              >
                                <div className="min-w-0 flex-1">
                                  <div className="flex items-center gap-2">
                                    <p className="text-sm font-mono text-[#888] truncate group-hover:text-[#5e6ad2] transition-colors">
                                      {inv.invoice_number ?? "—"}
                                    </p>
                                    <InvoiceStatusBadge status={inv.status as InvoiceStatus} />
                                  </div>
                                  {inv.due_date && (
                                    <div className="flex items-center gap-1 mt-1">
                                      <Calendar size={10} className="text-[#555]" />
                                      <span className="text-[11px] text-[#555]">
                                        Due {formatDate(inv.due_date)}
                                      </span>
                                    </div>
                                  )}
                                </div>
                                <div className="shrink-0 flex items-center gap-3">
                                  <span className="text-sm font-medium text-[#e8e8e8] tabular-nums">
                                    {inv.amount != null ? formatCurrency(inv.amount) : "—"}
                                  </span>
                                  <ChevronRight size={14} className="text-[#3a3a3a] group-hover:text-[#555] transition-colors" />
                                </div>
                              </Link>
                            ))}
                          </div>
                        )
                      )}
                    </div>
                  </div>

                  {/* Portal access */}
                  <div className="rounded-xl border border-[rgba(255,255,255,0.06)] bg-[#111111] p-6">
                    <h2 className="text-sm font-medium text-[#e8e8e8] mb-4">Portal Access</h2>
                    
                    {newPlainPassword ? (
                      <div className="mb-4 rounded-lg bg-[rgba(38,201,127,0.1)] border border-[rgba(38,201,127,0.2)] p-4">
                        <p className="text-[11px] font-medium uppercase tracking-wide text-[#26c97f] mb-2">
                          New portal password — copy and share with client
                        </p>
                        <div className="flex items-center gap-2">
                          <div className="flex-1 rounded-lg bg-[#1a1a1a] px-3 py-2 font-mono text-sm tracking-wide text-[#26c97f] border border-[rgba(38,201,127,0.2)]">
                            {newPlainPassword}
                          </div>
                          <button 
                            onClick={copyPassword} 
                            title="Copy password" 
                            className="p-2 rounded-lg text-[#26c97f] hover:bg-[rgba(38,201,127,0.1)] transition-all duration-150"
                          >
                            {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                          </button>
                          <button 
                            onClick={() => setNewPlainPassword(null)} 
                            className="px-3 py-2 rounded-lg text-xs font-medium text-[#26c97f] hover:bg-[rgba(38,201,127,0.1)] transition-all duration-150"
                          >
                            Done
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div className="flex items-center gap-2 mb-3">
                        <div className="flex-1 rounded-lg bg-[#1a1a1a] px-4 py-2.5 font-mono text-sm tracking-wide text-[#555] border border-[rgba(255,255,255,0.08)]">
                          {client.portal_password ? "•".repeat(12) : <span className="font-sans text-xs italic">Not set</span>}
                        </div>
                      </div>
                    )}
                    
                    {isAdmin && (
                      <div className="flex justify-end">
                        <button 
                          onClick={handlePasswordReset} 
                          disabled={resetting} 
                          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[12px] font-medium text-[#888] hover:text-[#e8e8e8] hover:bg-white/5 border border-[rgba(255,255,255,0.08)] transition-all duration-150 disabled:opacity-50"
                        >
                          <RefreshCw className={`h-3.5 w-3.5 ${resetting ? "animate-spin" : ""}`} />
                          {client.portal_password ? "Reset Password" : "Set Password"}
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}