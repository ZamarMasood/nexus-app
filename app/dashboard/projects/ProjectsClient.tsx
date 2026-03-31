"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import {
  Calendar,
  Layers,
  Briefcase,
  Clock,
  CheckCircle,
  AlertCircle,
  Plus,
  Search,
  ChevronRight,
  ChevronLeft
} from "lucide-react";
import Link from "next/link";
import { useWorkspaceSlug } from "@/app/dashboard/workspace-context";
import { createProjectAction, fetchProjectsPageAction } from "@/app/dashboard/projects/actions";
import { formatDate } from "@/lib/utils";
import {
  Dialog,
  DialogContent,
} from "@/components/ui/dialog";
import type { Project, Client } from "@/lib/types";

const PAGE_SIZE = 5;

const STATUS_CONFIG: Record<string, { label: string; bg: string; text: string; dot: string; icon: any }> = {
  active: {
    label: "Active",
    bg: 'rgba(38,201,127,0.12)',
    text: '#26c97f',
    dot: '#26c97f',
    icon: CheckCircle
  },
  in_progress: {
    label: "In Progress",
    bg: 'rgba(94,106,210,0.12)',
    text: '#5e6ad2',
    dot: '#5e6ad2',
    icon: Clock
  },
  completed: {
    label: "Completed",
    bg: 'rgba(136,136,136,0.12)',
    text: '#888',
    dot: '#888',
    icon: CheckCircle
  },
  paused: {
    label: "Paused",
    bg: 'rgba(231,157,19,0.12)',
    text: '#e79d13',
    dot: '#e79d13',
    icon: AlertCircle
  },
};

function StatusBadge({ status }: { status: string | null }) {
  const config = STATUS_CONFIG[status ?? 'active'] ?? STATUS_CONFIG.active;

  return (
    <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md text-xs font-medium"
      style={{ background: config.bg, color: config.text }}>
      <span className="w-1.5 h-1.5 rounded-full" style={{ background: config.dot }} />
      {config.label}
    </span>
  );
}

interface NewProjectFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  clients: Client[];
  onSuccess: () => void;
}

function NewProjectDialog({ open, onOpenChange, clients, onSuccess }: NewProjectFormProps) {
  const [name, setName] = useState("");
  const [clientId, setClientId] = useState("");
  const [status, setStatus] = useState("active");
  const [deadline, setDeadline] = useState("");
  const [totalValue, setTotalValue] = useState("");
  const [nameError, setNameError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    setName(""); setClientId(""); setStatus("active");
    setDeadline(""); setTotalValue(""); setNameError(""); setSubmitError(null);
  }, [open]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) { setNameError("Name is required"); return; }
    setNameError("");
    setSubmitting(true);
    setSubmitError(null);
    try {
      await createProjectAction({
        name: name.trim(),
        client_id: clientId || null,
        status,
        deadline: deadline || null,
        total_value: totalValue ? Math.max(0, parseFloat(totalValue)) : null,
      });
      onOpenChange(false);
      onSuccess();
    } catch (err: unknown) {
      setSubmitError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setSubmitting(false);
    }
  }

  const inputClass = `w-full px-3 py-2 rounded-lg
    bg-[#1a1a1a] border border-[rgba(255,255,255,0.08)]
    text-[#f0f0f0] text-[13px] placeholder:text-[#555]
    focus:outline-none focus:border-[rgba(94,106,210,0.5)]
    focus:ring-1 focus:ring-[rgba(94,106,210,0.3)]
    transition-colors duration-150`;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="
        bg-[#111111] border border-[rgba(255,255,255,0.08)] rounded-xl
        shadow-2xl p-0 gap-0 max-w-[520px] w-full">

        <div className="flex items-center justify-between px-6 pt-5 pb-4
          border-b border-[rgba(255,255,255,0.06)]">
          <div>
            <h3 className="text-[15px] font-semibold text-[#f0f0f0]">New Project</h3>
            <p className="text-[11px] text-[#555] mt-1">Create a new project to track work</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} noValidate>
          <div className="px-6 py-4 space-y-4">
            <div>
              <label className="block text-[11px] font-medium text-[#8a8a8a] mb-1.5">
                Project Name <span className="text-[#e5484d]">*</span>
              </label>
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g., Website Redesign"
                className={inputClass}
                autoFocus
              />
              {nameError && <p className="mt-1 text-[11px] text-[#e5484d]">{nameError}</p>}
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] font-medium text-[#8a8a8a] mb-1.5">
                  Client
                </label>
                <select value={clientId} onChange={(e) => setClientId(e.target.value)} className={inputClass}>
                  <option value="">Select a client</option>
                  {clients.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-[11px] font-medium text-[#8a8a8a] mb-1.5">
                  Status
                </label>
                <select value={status} onChange={(e) => setStatus(e.target.value)} className={inputClass}>
                  <option value="active">Active</option>
                  <option value="in_progress">In Progress</option>
                  <option value="paused">Paused</option>
                  <option value="completed">Completed</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] font-medium text-[#8a8a8a] mb-1.5">
                  Deadline
                </label>
                <input
                  type="date"
                  value={deadline}
                  onChange={(e) => setDeadline(e.target.value)}
                  className={inputClass}
                />
              </div>
              <div>
                <label className="block text-[11px] font-medium text-[#8a8a8a] mb-1.5">
                  Total Value ($)
                </label>
                <input
                  type="number"
                  value={totalValue}
                  onChange={(e) => setTotalValue(e.target.value)}
                  placeholder="0.00"
                  min="0"
                  step="0.01"
                  className={inputClass}
                />
              </div>
            </div>
          </div>

          {submitError && (
            <div className="mx-6 mb-3 rounded-lg px-3 py-2 text-[12px] text-[#e5484d]
              bg-[rgba(229,72,77,0.1)] border border-[rgba(229,72,77,0.2)]">
              {submitError}
            </div>
          )}

          <div className="flex items-center justify-end gap-2 px-6 py-4
            border-t border-[rgba(255,255,255,0.06)]">
            <button
              type="button"
              onClick={() => onOpenChange(false)}
              className="px-3 py-1.5 rounded-lg text-[12px] font-medium text-[#8a8a8a]
                hover:bg-white/5 hover:text-[#f0f0f0] transition-colors duration-150"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-3 py-1.5 rounded-lg text-[12px] font-medium
                bg-[#5e6ad2] hover:bg-[#6872e5] text-white
                active:scale-[0.98] transition-colors duration-150
                disabled:opacity-50 flex items-center gap-1.5"
            >
              {submitting ? "Creating..." : "Create Project"}
              <Plus size={12} />
            </button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

interface ProjectsClientProps {
  initialProjects: Project[];
  totalProjects: number;
  clients: Client[];
  taskCounts: Record<string, { total: number; done: number }>;
  isAdmin: boolean;
}

export default function ProjectsClient({ initialProjects, totalProjects, clients, taskCounts: initialTaskCounts, isAdmin }: ProjectsClientProps) {
  const router = useRouter();
  const slug = useWorkspaceSlug();
  const [projects, setProjects] = useState<Project[]>(initialProjects);
  const [total, setTotal] = useState(totalProjects);
  const [taskCounts, setTaskCounts] = useState(initialTaskCounts);
  const [currentPage, setCurrentPage] = useState(0);
  const [loading, setLoading] = useState(false);
  const [newProjectOpen, setNewProjectOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  useEffect(() => {
    setProjects(initialProjects);
    setTotal(totalProjects);
    setTaskCounts(initialTaskCounts);
    setCurrentPage(0);
  }, [initialProjects, totalProjects, initialTaskCounts]);

  const fetchPage = useCallback(async (page: number) => {
    setLoading(true);
    try {
      const result = await fetchProjectsPageAction(page, PAGE_SIZE);
      setProjects(result.projects);
      setTotal(result.total);
      setTaskCounts(result.taskCounts);
      setCurrentPage(page);
    } finally {
      setLoading(false);
    }
  }, []);

  const clientMap = new Map(clients.map((c) => [c.id, c]));
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  // Filter projects (client-side search/status on the current page)
  const filteredProjects = projects.filter(project => {
    const matchesSearch = project.name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === "all" || project.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  // Calculate stats from current page data
  const activeProjects = projects.filter(p => p.status === "active" || p.status === "in_progress").length;
  const totalTasks = Object.values(taskCounts).reduce((sum, counts) => sum + counts.total, 0);
  const completedTasks = Object.values(taskCounts).reduce((sum, counts) => sum + counts.done, 0);
  const overallProgress = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

  async function handleProjectCreated() {
    // After creating, go back to first page to see the new project
    await fetchPage(0);
    router.refresh();
  }

  return (
    <div className="flex flex-col h-full bg-[#0d0d0d]">

      {/* Header toolbar */}
      <div className="flex items-center justify-between px-6 h-[60px] border-b border-[rgba(255,255,255,0.06)] shrink-0">
        <div className="flex items-center gap-3">
          <Layers size={16} className="text-[#555]" />
          <h1 className="text-[15px] font-medium text-[#e8e8e8]">Projects</h1>
          <span className="text-[12px] text-[#555]">{total} total</span>
        </div>
        {isAdmin && (
          <button
            onClick={() => setNewProjectOpen(true)}
            className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium
              bg-[#5e6ad2] hover:bg-[#6872e5] text-white transition-colors duration-150"
          >
            <Plus size={14} />
            New Project
          </button>
        )}
      </div>

      {/* Main content */}
      <div className="flex-1 overflow-y-auto">
        <div className="p-6">

          {/* Stats cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
            <div className="rounded-xl border border-[rgba(255,255,255,0.06)] bg-[#111111] p-4">
              <div className="flex items-center gap-2 mb-2">
                <CheckCircle size={14} className="text-[#26c97f]" />
                <span className="text-[11px] text-[#555]">Active Projects</span>
              </div>
              <p className="text-[24px] font-medium text-[#e8e8e8]">{activeProjects}</p>
              <p className="text-[11px] text-[#555] mt-1">Out of {total} total</p>
            </div>

            <div className="rounded-xl border border-[rgba(255,255,255,0.06)] bg-[#111111] p-4">
              <div className="flex items-center gap-2 mb-2">
                <Layers size={14} className="text-[#5e6ad2]" />
                <span className="text-[11px] text-[#555]">Task Progress</span>
              </div>
              <p className="text-[24px] font-medium text-[#e8e8e8]">{overallProgress}%</p>
              <div className="mt-2 h-1 rounded-full bg-[rgba(255,255,255,0.06)] overflow-hidden">
                <div
                  className="h-full rounded-full"
                  style={{ width: `${overallProgress}%`, background: '#5e6ad2', transition: 'width 300ms ease-out' }}
                />
              </div>
            </div>
          </div>

          {/* Search and Filter */}
          <div className="flex flex-col sm:flex-row gap-3 mb-6">
            <div className="flex-1 relative">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#555]" />
              <input
                type="text"
                placeholder="Search projects..."
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
              {["all", "active", "in_progress", "completed"].map((filter) => (
                <button
                  key={filter}
                  onClick={() => setStatusFilter(filter)}
                  className={`px-3 py-1.5 rounded-lg text-[12px] font-medium transition-colors duration-150
                    ${statusFilter === filter
                      ? 'bg-[#5e6ad2] text-white'
                      : 'bg-[#111111] text-[#888] hover:text-[#e8e8e8] border border-[rgba(255,255,255,0.08)]'}`}
                >
                  {filter === "all" ? "All" : filter === "in_progress" ? "In Progress" : filter.charAt(0).toUpperCase() + filter.slice(1)}
                </button>
              ))}
            </div>
          </div>

          {/* Projects Table */}
          {filteredProjects.length === 0 && !loading ? (
            <div className="text-center py-12">
              <p className="text-[13px] text-[#888] mb-2">
                {searchQuery || statusFilter !== "all" ? "No projects found" : "No projects yet"}
              </p>
              {isAdmin && !searchQuery && statusFilter === "all" && (
                <button
                  onClick={() => setNewProjectOpen(true)}
                  className="text-[12px] text-[#5e6ad2] hover:text-[#7e8ae6] transition-colors duration-150"
                >
                  Create your first project →
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
                        Project
                      </th>
                      <th className="px-5 py-3 text-left text-[11px] font-medium text-[#555] uppercase tracking-[0.06em] hidden sm:table-cell">
                        Client
                      </th>
                      <th className="px-5 py-3 text-left text-[11px] font-medium text-[#555] uppercase tracking-[0.06em] hidden sm:table-cell">
                        Status
                      </th>
                      <th className="px-5 py-3 text-left text-[11px] font-medium text-[#555] uppercase tracking-[0.06em] hidden md:table-cell">
                        Deadline
                      </th>
                      <th className="px-5 py-3 text-left text-[11px] font-medium text-[#555] uppercase tracking-[0.06em] hidden lg:table-cell">
                        Progress
                      </th>
                      <th className="px-5 py-3 w-8" />
                    </tr>
                  </thead>
                  <tbody className={loading ? 'opacity-50 pointer-events-none' : ''}>
                    {filteredProjects.map((project) => {
                      const client = project.client_id ? clientMap.get(project.client_id) : null;
                      const counts = taskCounts[project.id];
                      const total = counts?.total ?? 0;
                      const done = counts?.done ?? 0;
                      const pct = total > 0 ? Math.round((done / total) * 100) : 0;
                      const isOverdue = project.deadline && new Date(project.deadline) < today && project.status !== "completed";

                      return (
                        <tr
                          key={project.id}
                          onClick={() => router.push(`/${slug}/projects/${project.id}`)}
                          className="group border-b border-[rgba(255,255,255,0.06)] last:border-0
                            hover:bg-[#1c1c1c] cursor-pointer transition-colors duration-[120ms]"
                        >
                          <td className="px-5 py-3.5">
                            <span className="text-[13px] text-[#f0f0f0] block truncate">
                              {project.name}
                            </span>
                          </td>

                          <td className="px-5 py-3.5 hidden sm:table-cell">
                            <span className="text-[12px] text-[#888]">
                              {client?.name || <span className="text-[#3a3a3a]">—</span>}
                            </span>
                          </td>

                          <td className="px-5 py-3.5 hidden sm:table-cell">
                            <StatusBadge status={project.status} />
                          </td>

                          <td className="px-5 py-3.5 hidden md:table-cell">
                            {project.deadline ? (
                              <span className={`flex items-center gap-1 text-[12px] ${isOverdue ? 'text-[#e5484d]' : 'text-[#555]'}`}>
                                <Calendar size={12} className="flex-shrink-0" />
                                {formatDate(project.deadline)}
                              </span>
                            ) : (
                              <span className="text-[12px] text-[#3a3a3a]">—</span>
                            )}
                          </td>

                          <td className="px-5 py-3.5 hidden lg:table-cell">
                            {total > 0 ? (
                              <div className="space-y-1 w-24">
                                <div className="flex justify-between text-[11px]">
                                  <span className="text-[#555]">{pct}%</span>
                                  <span className="text-[#555]">{done}/{total}</span>
                                </div>
                                <div className="h-1 w-full rounded-full bg-[rgba(255,255,255,0.06)] overflow-hidden">
                                  <div
                                    className="h-full rounded-full"
                                    style={{ width: `${pct}%`, background: '#5e6ad2', transition: 'width 500ms ease-out' }}
                                  />
                                </div>
                              </div>
                            ) : (
                              <span className="text-[11px] text-[#3a3a3a]">No tasks</span>
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

      <NewProjectDialog
        open={newProjectOpen}
        onOpenChange={setNewProjectOpen}
        clients={clients}
        onSuccess={handleProjectCreated}
      />
    </div>
  );
}
