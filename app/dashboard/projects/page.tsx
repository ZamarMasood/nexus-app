"use client";

import { useEffect, useState } from "react";
import { Plus, FolderKanban, Calendar, ChevronRight } from "lucide-react";
import Link from "next/link";
import { getProjects, createProject } from "@/lib/db/projects";
import { getClients } from "@/lib/db/clients";
import { getTasks } from "@/lib/db/tasks";
import { formatDate } from "@/lib/utils";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import type { Project, Client, Task } from "@/lib/types";

const STATUS_CONFIG: Record<string, { label: string; dot: string; badge: string }> = {
  active: {
    label: "Active",
    dot: "bg-emerald-400",
    badge: "text-emerald-700 bg-emerald-50 border-emerald-200",
  },
  in_progress: {
    label: "In Progress",
    dot: "bg-amber-400",
    badge: "text-amber-700 bg-amber-50 border-amber-200",
  },
  completed: {
    label: "Completed",
    dot: "bg-slate-400",
    badge: "text-slate-600 bg-slate-100 border-slate-200",
  },
  paused: {
    label: "Paused",
    dot: "bg-orange-400",
    badge: "text-orange-700 bg-orange-50 border-orange-200",
  },
};

function getStatusConfig(status: string | null) {
  return STATUS_CONFIG[status ?? ""] ?? {
    label: status ?? "Unknown",
    dot: "bg-slate-300",
    badge: "text-slate-500 bg-slate-50 border-slate-200",
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
    setName("");
    setClientId("");
    setStatus("active");
    setDeadline("");
    setTotalValue("");
    setNameError("");
    setSubmitError(null);
  }, [open]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) { setNameError("Name is required"); return; }
    setNameError("");
    setSubmitting(true);
    setSubmitError(null);
    try {
      await createProject({
        name: name.trim(),
        client_id: clientId || null,
        status,
        deadline: deadline || null,
        total_value: totalValue ? parseFloat(totalValue) : null,
      });
      onOpenChange(false);
      onSuccess();
    } catch (err: unknown) {
      setSubmitError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setSubmitting(false);
    }
  }

  const fieldClass =
    "w-full rounded-lg border border-white/10 bg-[#1a1b23] px-3 py-2 text-sm text-slate-100 placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-violet-500/60 focus:border-violet-500/60 transition-[border-color,box-shadow]";

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-[#13141a] border-white/10 text-slate-100 sm:max-w-md p-0 gap-0">
        <DialogHeader className="px-6 pt-6 pb-4 border-b border-white/8">
          <DialogTitle className="text-base font-semibold tracking-[-0.02em] text-white">
            New Project
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} noValidate>
          <div className="px-6 py-5 space-y-4">
            <div className="space-y-1.5">
              <Label className="text-xs font-medium text-slate-400 uppercase tracking-wide">
                Name <span className="text-rose-400 normal-case tracking-normal">*</span>
              </Label>
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Project name"
                className={fieldClass}
                autoFocus
              />
              {nameError && <p className="text-xs text-rose-400">{nameError}</p>}
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-xs font-medium text-slate-400 uppercase tracking-wide">
                  Client
                </Label>
                <select
                  value={clientId}
                  onChange={(e) => setClientId(e.target.value)}
                  className={fieldClass}
                >
                  <option value="">No client</option>
                  {clients.map((c) => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-medium text-slate-400 uppercase tracking-wide">
                  Status
                </Label>
                <select
                  value={status}
                  onChange={(e) => setStatus(e.target.value)}
                  className={fieldClass}
                >
                  <option value="active">Active</option>
                  <option value="in_progress">In Progress</option>
                  <option value="paused">Paused</option>
                  <option value="completed">Completed</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-xs font-medium text-slate-400 uppercase tracking-wide">
                  Deadline
                </Label>
                <input
                  type="date"
                  value={deadline}
                  onChange={(e) => setDeadline(e.target.value)}
                  className={fieldClass}
                />
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-medium text-slate-400 uppercase tracking-wide">
                  Total Value ($)
                </Label>
                <input
                  type="number"
                  value={totalValue}
                  onChange={(e) => setTotalValue(e.target.value)}
                  placeholder="0.00"
                  min="0"
                  step="0.01"
                  className={fieldClass}
                />
              </div>
            </div>
          </div>

          {submitError && (
            <div className="mx-6 mb-4 rounded-lg bg-rose-500/10 border border-rose-500/20 px-3 py-2 text-sm text-rose-300">
              {submitError}
            </div>
          )}

          <div className="px-6 pb-6 flex justify-end gap-2 border-t border-white/8 pt-4">
            <button
              type="button"
              onClick={() => onOpenChange(false)}
              className="rounded-lg px-4 py-2 text-sm font-medium text-slate-400 hover:text-slate-200 hover:bg-white/5 transition-[background-color,color] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-500"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="rounded-lg bg-violet-600 px-4 py-2 text-sm font-medium text-white shadow-[0_0_16px_rgba(139,92,246,0.35)] hover:bg-violet-500 active:scale-[0.97] transition-[background-color,transform,opacity] disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-400"
            >
              {submitting ? "Creating…" : "Create Project"}
            </button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

export default function ProjectsPage() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [newProjectOpen, setNewProjectOpen] = useState(false);

  async function load() {
    try {
      const [p, c, t] = await Promise.all([getProjects(), getClients(), getTasks()]);
      setProjects(p);
      setClients(c);
      setTasks(t);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to load projects");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); }, []);

  // Build lookup maps
  const clientMap = new Map(clients.map((c) => [c.id, c]));
  const taskCountMap = tasks.reduce<Record<string, number>>((acc, t) => {
    if (t.project_id) acc[t.project_id] = (acc[t.project_id] ?? 0) + 1;
    return acc;
  }, {});

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  if (loading) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="flex items-center justify-between">
          <div className="h-8 w-32 rounded-lg bg-slate-200" />
          <div className="h-9 w-36 rounded-xl bg-slate-200" />
        </div>
        {[0, 1, 2, 3].map((i) => (
          <div key={i} className="h-20 rounded-2xl bg-slate-200" />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-[-0.03em] text-slate-900">Projects</h1>
          <p className="mt-0.5 text-sm text-slate-500">
            {projects.length} project{projects.length !== 1 ? "s" : ""}
          </p>
        </div>
        <button
          onClick={() => setNewProjectOpen(true)}
          className="flex items-center gap-2 rounded-xl bg-violet-600 px-4 py-2.5 text-sm font-medium text-white shadow-[0_4px_14px_rgba(139,92,246,0.4)] hover:bg-violet-500 active:scale-[0.97] transition-[background-color,transform] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-400"
        >
          <Plus className="h-4 w-4" />
          New Project
        </button>
      </div>

      {error && (
        <div className="rounded-xl bg-rose-50 border border-rose-200 px-4 py-3 text-sm text-rose-700">
          {error}
        </div>
      )}

      {/* Project list */}
      {projects.length === 0 ? (
        <div className="rounded-2xl bg-white border border-slate-200/80 py-16 text-center shadow-[0_2px_8px_rgba(0,0,0,0.04)]">
          <FolderKanban className="mx-auto h-10 w-10 text-slate-300" />
          <p className="mt-3 text-sm font-medium text-slate-600">No projects yet</p>
          <p className="mt-1 text-xs text-slate-400">Create your first project to get started</p>
          <button
            onClick={() => setNewProjectOpen(true)}
            className="mt-4 rounded-lg bg-violet-600 px-4 py-2 text-sm font-medium text-white hover:bg-violet-500 transition-colors"
          >
            Create Project
          </button>
        </div>
      ) : (
        <div className="overflow-x-auto rounded-2xl border border-slate-200/80 shadow-[0_2px_8px_rgba(0,0,0,0.04),0_1px_2px_rgba(0,0,0,0.06)]">
        <div className="min-w-[620px] rounded-2xl bg-white overflow-hidden">
          <div className="grid grid-cols-[1fr_140px_120px_80px_40px] gap-0 border-b border-slate-100 px-6 py-2.5">
            <p className="text-xs font-medium text-slate-400">Project</p>
            <p className="text-xs font-medium text-slate-400">Status</p>
            <p className="text-xs font-medium text-slate-400">Deadline</p>
            <p className="text-xs font-medium text-slate-400 text-right">Tasks</p>
            <span />
          </div>

          <ul className="divide-y divide-slate-50">
            {projects.map((project) => {
              const client = project.client_id ? clientMap.get(project.client_id) : null;
              const taskCount = taskCountMap[project.id] ?? 0;
              const cfg = getStatusConfig(project.status);
              const isOverdue =
                project.deadline &&
                new Date(project.deadline) < today &&
                project.status !== "completed";

              return (
                <li key={project.id}>
                  <Link
                    href={`/dashboard/projects/${project.id}`}
                    className="grid grid-cols-[1fr_140px_120px_80px_40px] items-center gap-0 px-6 py-4 hover:bg-slate-50/80 transition-colors group"
                  >
                    {/* Name + client */}
                    <div className="min-w-0">
                      <p className="truncate text-sm font-semibold text-slate-800 group-hover:text-slate-900 tracking-[-0.01em]">
                        {project.name}
                      </p>
                      {client && (
                        <p className="mt-0.5 truncate text-xs text-slate-400">{client.name}</p>
                      )}
                    </div>

                    {/* Status badge */}
                    <div>
                      <span
                        className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-[11px] font-medium ${cfg.badge}`}
                      >
                        <span className={`h-1.5 w-1.5 rounded-full ${cfg.dot}`} />
                        {cfg.label}
                      </span>
                    </div>

                    {/* Deadline */}
                    <div>
                      {project.deadline ? (
                        <span
                          className={`flex items-center gap-1.5 text-xs ${
                            isOverdue ? "text-rose-500 font-medium" : "text-slate-500"
                          }`}
                        >
                          <Calendar className="h-3 w-3 shrink-0" />
                          {formatDate(project.deadline)}
                        </span>
                      ) : (
                        <span className="text-xs text-slate-300">—</span>
                      )}
                    </div>

                    {/* Task count */}
                    <div className="text-right">
                      <span className="text-sm font-semibold text-slate-700">{taskCount}</span>
                      <span className="ml-1 text-xs text-slate-400">task{taskCount !== 1 ? "s" : ""}</span>
                    </div>

                    {/* Arrow */}
                    <div className="flex justify-end">
                      <ChevronRight className="h-4 w-4 text-slate-300 group-hover:text-slate-500 transition-colors" />
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
        onSuccess={load}
      />
    </div>
  );
}
