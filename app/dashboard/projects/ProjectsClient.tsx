"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Plus, FolderKanban, Calendar, ChevronRight, BarChart3 } from "lucide-react";
import Link from "next/link";
import { createProject } from "@/lib/db/projects";
import { revalidateDashboard } from "@/app/dashboard/actions";
import { formatDate } from "@/lib/utils";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import type { Project, Client } from "@/lib/types";

const STATUS_CONFIG: Record<string, { label: string; dot: string; badge: string; bar: string }> = {
  active: {
    label: "Active",
    dot:   "bg-emerald-400",
    badge: "text-emerald-400 bg-emerald-400/10 border-emerald-400/20",
    bar:   "bg-emerald-400",
  },
  in_progress: {
    label: "In Progress",
    dot:   "bg-amber-400",
    badge: "text-amber-400 bg-amber-400/10 border-amber-400/20",
    bar:   "bg-amber-400",
  },
  completed: {
    label: "Completed",
    dot:   "bg-faint-app",
    badge: "text-muted-app bg-surface-subtle border-surface",
    bar:   "bg-dim-app",
  },
  paused: {
    label: "Paused",
    dot:   "bg-orange-400",
    badge: "text-orange-400 bg-orange-400/10 border-orange-400/20",
    bar:   "bg-orange-400",
  },
};

function getStatusConfig(status: string | null) {
  return STATUS_CONFIG[status ?? ""] ?? {
    label: status ?? "Unknown",
    dot:   "bg-faint-app",
    badge: "text-muted-app bg-surface-subtle border-surface",
    bar:   "bg-dim-app",
  };
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
      await createProject({
        name:        name.trim(),
        client_id:   clientId || null,
        status,
        deadline:    deadline || null,
        total_value: totalValue ? parseFloat(totalValue) : null,
      });
      onOpenChange(false);
      await revalidateDashboard();
      onSuccess();
    } catch (err: unknown) {
      setSubmitError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setSubmitting(false);
    }
  }

  const fieldClass =
    "w-full rounded-lg border border-surface bg-surface-inset px-3 py-2 text-sm text-primary-app placeholder:text-faint-app focus:outline-none focus:ring-2 focus:ring-violet-500/60 focus:border-violet-500/60 transition-[border-color,box-shadow]";

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-surface-card border-surface text-primary-app sm:max-w-md p-0 gap-0">
        <DialogHeader className="px-6 pt-6 pb-4 border-b border-surface">
          <DialogTitle className="text-base font-semibold tracking-[-0.02em] text-bright">
            New Project
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} noValidate>
          <div className="px-6 py-5 space-y-4">
            <div className="space-y-1.5">
              <Label className="text-xs font-medium text-slate-400 uppercase tracking-wide">
                Name <span className="text-rose-400 normal-case tracking-normal">*</span>
              </Label>
              <input value={name} onChange={(e) => setName(e.target.value)}
                placeholder="Project name" className={fieldClass} autoFocus />
              {nameError && <p className="text-xs text-rose-400">{nameError}</p>}
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-xs font-medium text-slate-400 uppercase tracking-wide">Client</Label>
                <select value={clientId} onChange={(e) => setClientId(e.target.value)} className={fieldClass}>
                  <option value="">No client</option>
                  {clients.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs font-medium text-slate-400 uppercase tracking-wide">Status</Label>
                <select value={status} onChange={(e) => setStatus(e.target.value)} className={fieldClass}>
                  <option value="active">Active</option>
                  <option value="in_progress">In Progress</option>
                  <option value="paused">Paused</option>
                  <option value="completed">Completed</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-xs font-medium text-slate-400 uppercase tracking-wide">Deadline</Label>
                <input type="date" value={deadline} onChange={(e) => setDeadline(e.target.value)} className={fieldClass} />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs font-medium text-slate-400 uppercase tracking-wide">Total Value ($)</Label>
                <input type="number" value={totalValue} onChange={(e) => setTotalValue(e.target.value)}
                  placeholder="0.00" min="0" step="0.01" className={fieldClass} />
              </div>
            </div>
          </div>

          {submitError && (
            <div className="mx-6 mb-4 rounded-lg bg-rose-500/10 border border-rose-500/20 px-3 py-2 text-sm text-rose-300">
              {submitError}
            </div>
          )}

          <div className="px-6 pb-6 flex justify-end gap-2 border-t border-surface pt-4">
            <button type="button" onClick={() => onOpenChange(false)}
              className="rounded-lg px-4 py-2 text-sm font-medium text-secondary-app hover:text-primary-app hover:bg-surface-subtle transition-[background-color,color] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-500">
              Cancel
            </button>
            <button type="submit" disabled={submitting}
              className="rounded-lg bg-violet-600 px-4 py-2 text-sm font-medium text-white shadow-[0_0_16px_rgba(139,92,246,0.35)] hover:bg-violet-500 active:scale-[0.97] transition-[background-color,transform,opacity] disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-400">
              {submitting ? "Creating…" : "Create Project"}
            </button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

interface ProjectsClientProps {
  initialProjects: Project[];
  clients: Client[];
  taskCounts: Record<string, { total: number; done: number }>;
  isAdmin: boolean;
}

export default function ProjectsClient({ initialProjects, clients, taskCounts, isAdmin }: ProjectsClientProps) {
  const router = useRouter();
  const [projects, setProjects] = useState<Project[]>(initialProjects);
  const [newProjectOpen, setNewProjectOpen] = useState(false);

  // Sync local state when server re-renders with fresh data (after router.refresh)
  useEffect(() => { setProjects(initialProjects); }, [initialProjects]);

  const clientMap = new Map(clients.map((c) => [c.id, c]));

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const statusCounts = {
    active:      projects.filter((p) => p.status === "active").length,
    in_progress: projects.filter((p) => p.status === "in_progress").length,
    paused:      projects.filter((p) => p.status === "paused").length,
    completed:   projects.filter((p) => p.status === "completed").length,
  };

  return (
    <div className="p-6 sm:p-8 lg:p-10 space-y-6">

      {/* Header */}
      <div className="flex flex-wrap items-start justify-between gap-3 animate-in" style={{ animationDelay: "0ms" }}>
        <div>
          <h1 className="text-2xl font-bold tracking-[-0.03em] text-bright">Projects</h1>
          <p className="mt-0.5 text-sm text-faint-app">
            {projects.length} project{projects.length !== 1 ? "s" : ""}
          </p>
        </div>
        {isAdmin && (
          <button
            onClick={() => setNewProjectOpen(true)}
            className="group flex items-center gap-2 rounded-xl bg-violet-600 px-4 py-2.5 text-sm font-semibold text-white shadow-[0_4px_24px_rgba(139,92,246,0.35),0_1px_4px_rgba(0,0,0,0.4)] hover:bg-violet-500 hover:shadow-[0_4px_28px_rgba(139,92,246,0.5)] active:scale-[0.97] transition-[background-color,box-shadow,transform] duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-400"
          >
            <Plus className="h-4 w-4 transition-transform duration-200 group-hover:rotate-90" />
            New Project
          </button>
        )}
      </div>

      {/* Status summary pills */}
      {projects.length > 0 && (
        <div className="flex flex-wrap gap-2 animate-in" style={{ animationDelay: "80ms" }}>
          {[
            { label: "Active",      count: statusCounts.active,      color: "text-emerald-400 bg-emerald-400/10 ring-emerald-400/20" },
            { label: "In Progress", count: statusCounts.in_progress, color: "text-amber-400 bg-amber-400/10 ring-amber-400/20"    },
            { label: "Paused",      count: statusCounts.paused,      color: "text-orange-400 bg-orange-400/10 ring-orange-400/20"  },
            { label: "Completed",   count: statusCounts.completed,   color: "text-muted-app bg-surface-subtle ring-surface"        },
          ].filter(({ count }) => count > 0).map(({ label, count, color }) => (
            <span key={label} className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-[11px] font-medium ring-1 ${color}`}>
              <span className="tabular-nums font-bold">{count}</span>
              {label}
            </span>
          ))}
        </div>
      )}

      {/* Project list */}
      {projects.length === 0 ? (
        <div
          className="rounded-2xl bg-surface-card border border-surface py-20 text-center animate-in"
          style={{ animationDelay: "160ms" }}
        >
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-surface-inset border border-surface">
            <FolderKanban className="h-6 w-6 text-dim-app" />
          </div>
          <p className="text-sm font-semibold text-muted-app">No projects yet</p>
          <p className="mt-1 text-xs text-dim-app">Create your first project to get started</p>
          {isAdmin && (
            <button
              onClick={() => setNewProjectOpen(true)}
              className="mt-5 inline-flex items-center gap-1.5 rounded-lg bg-violet-600 px-4 py-2 text-sm font-medium text-white hover:bg-violet-500 transition-colors shadow-[0_2px_8px_rgba(139,92,246,0.3)]"
            >
              <Plus className="h-3.5 w-3.5" />
              Create Project
            </button>
          )}
        </div>
      ) : (
        <div
          className="rounded-2xl border border-surface animate-in"
          style={{ animationDelay: "160ms" }}
        >
          <div className="rounded-2xl bg-surface-card overflow-hidden">
            <div className="grid grid-cols-[1fr_auto_24px] sm:grid-cols-[1fr_140px_130px_100px_36px] gap-0 border-b border-surface bg-overlay-xs px-4 sm:px-6 py-2.5">
              {["Project", "Status", "Deadline", "Progress", ""].map((h, idx) => (
                <p key={h} className={`text-[10px] font-semibold uppercase tracking-widest text-dim-app ${idx >= 2 && idx <= 3 ? "hidden sm:block" : ""}`}>{h}</p>
              ))}
            </div>

            <ul>
              {projects.map((project, i) => {
                const client    = project.client_id ? clientMap.get(project.client_id) : null;
                const counts    = taskCounts[project.id];
                const total     = counts?.total ?? 0;
                const done      = counts?.done ?? 0;
                const pct       = total > 0 ? Math.round((done / total) * 100) : 0;
                const cfg       = getStatusConfig(project.status);
                const isOverdue =
                  project.deadline &&
                  new Date(project.deadline) < today &&
                  project.status !== "completed";

                return (
                  <li
                    key={project.id}
                    className="animate-in border-b border-surface last:border-0"
                    style={{ animationDelay: `${220 + i * 40}ms` }}
                  >
                    <Link
                      href={`/dashboard/projects/${project.id}`}
                      className="grid grid-cols-[1fr_auto_24px] sm:grid-cols-[1fr_140px_130px_100px_36px] items-center gap-0 px-4 sm:px-6 py-4 hover:bg-overlay-sm transition-[background-color] duration-150 group"
                    >
                      <div className="min-w-0">
                        <p className="truncate text-sm font-semibold text-primary-app group-hover:text-bright tracking-[-0.01em] transition-colors duration-150">
                          {project.name}
                        </p>
                        {client && (
                          <p className="mt-0.5 truncate text-xs text-faint-app">{client.name}</p>
                        )}
                      </div>

                      <div>
                        <span className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-[11px] font-medium ${cfg.badge}`}>
                          <span className={`h-1.5 w-1.5 rounded-full ${cfg.dot}`} />
                          {cfg.label}
                        </span>
                      </div>

                      <div className="hidden sm:block">
                        {project.deadline ? (
                          <span className={`flex items-center gap-1.5 text-xs ${isOverdue ? "text-rose-400 font-medium" : "text-muted-app"}`}>
                            <Calendar className="h-3 w-3 shrink-0" />
                            {formatDate(project.deadline)}
                          </span>
                        ) : (
                          <span className="text-xs text-dim-app">—</span>
                        )}
                      </div>

                      <div className="hidden sm:block pr-2">
                        {total > 0 ? (
                          <div className="space-y-1">
                            <div className="flex items-center justify-between">
                              <span className="text-[10px] text-dim-app tabular-nums">{done}/{total}</span>
                              <span className="text-[10px] font-semibold text-muted-app tabular-nums">{pct}%</span>
                            </div>
                            <div className="h-1 w-full rounded-full bg-surface-inset overflow-hidden">
                              <div
                                className={`h-full rounded-full ${cfg.bar} transition-[width] duration-700`}
                                style={{ width: `${pct}%` }}
                              />
                            </div>
                          </div>
                        ) : (
                          <span className="flex items-center gap-1 text-[11px] text-dim-app">
                            <BarChart3 className="h-3 w-3" />
                            No tasks
                          </span>
                        )}
                      </div>

                      <div className="flex justify-end">
                        <ChevronRight className="h-4 w-4 text-dim-app group-hover:text-violet-400 transition-[color,transform] duration-150 group-hover:translate-x-0.5" />
                      </div>
                    </Link>
                  </li>
                );
              })}
            </ul>
          </div>
        </div>
      )}

      <NewProjectDialog
        open={newProjectOpen}
        onOpenChange={setNewProjectOpen}
        clients={clients}
        onSuccess={() => router.refresh()}
      />
    </div>
  );
}
