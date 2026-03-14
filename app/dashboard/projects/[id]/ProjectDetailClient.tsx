"use client";

import { useEffect, useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  Search,
  Calendar,
  DollarSign,
  CheckSquare,
  Pencil,
  Check,
  X,
  Plus,
  FolderKanban,
  ArrowLeft,
} from "lucide-react";
import { updateProject } from "@/lib/db/projects";
import type { ProjectListItem } from "@/lib/db/projects";
import type { ClientListItem } from "@/lib/db/clients";
import { getProjectById } from "@/lib/db/projects";
import { getTasksWithAssignees } from "@/lib/db/tasks";
import { formatDate, formatCurrency } from "@/lib/utils";
import type { Project } from "@/lib/types";
import type { TaskWithAssignee } from "@/lib/db/tasks";
import { useTaskForm } from "../../task-form-context";

// ── Status config ──────────────────────────────────────────────────────────────

const STATUS_CONFIG: Record<string, { label: string; dot: string; badge: string }> = {
  active:      { label: "Active",      dot: "bg-emerald-400", badge: "text-emerald-400 bg-emerald-400/10 border-emerald-400/20" },
  in_progress: { label: "In Progress", dot: "bg-amber-400",   badge: "text-amber-400 bg-amber-400/10 border-amber-400/20" },
  completed:   { label: "Completed",   dot: "bg-slate-400",   badge: "text-muted-app bg-surface-subtle border-surface" },
  paused:      { label: "Paused",      dot: "bg-orange-400",  badge: "text-orange-400 bg-orange-400/10 border-orange-400/20" },
};

function getStatusConfig(status: string | null) {
  return STATUS_CONFIG[status ?? ""] ?? {
    label: status ?? "Unknown",
    dot: "bg-slate-300",
    badge: "text-muted-app bg-surface-subtle border-surface",
  };
}

const TASK_STATUS_STYLES = {
  todo:        "bg-surface-subtle text-muted-app",
  in_progress: "bg-amber-400/10 text-amber-400",
  done:        "bg-emerald-400/10 text-emerald-400",
} as const;

const TASK_STATUS_LABELS = {
  todo: "To Do",
  in_progress: "In Progress",
  done: "Done",
} as const;

const PRIORITY_STYLES = {
  urgent: "bg-rose-500/10 text-rose-400 ring-1 ring-rose-500/20",
  high:   "bg-orange-500/10 text-orange-400 ring-1 ring-orange-500/20",
  normal: "bg-sky-500/10 text-sky-400 ring-1 ring-sky-500/20",
  low:    "bg-surface-subtle text-faint-app ring-1 ring-surface",
} as const;

// ── Edit form ──────────────────────────────────────────────────────────────────

interface EditFormProps {
  project: Project;
  onSave: (updated: Project) => void;
  onCancel: () => void;
}

function EditForm({ project, onSave, onCancel }: EditFormProps) {
  const [name, setName] = useState(project.name);
  const [status, setStatus] = useState(project.status ?? "active");
  const [deadline, setDeadline] = useState(project.deadline ?? "");
  const [totalValue, setTotalValue] = useState(project.total_value != null ? String(project.total_value) : "");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fieldClass =
    "w-full rounded-lg border border-surface bg-surface-inset px-3 py-2 text-sm text-primary-app placeholder:text-dim-app focus:outline-none focus:ring-2 focus:ring-violet-500/50 focus:border-violet-500 transition-[border-color,box-shadow]";

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) return;
    setSaving(true);
    setError(null);
    try {
      const updated = await updateProject(project.id, {
        name: name.trim(),
        status,
        deadline: deadline || null,
        total_value: totalValue ? parseFloat(totalValue) : null,
      });
      onSave(updated);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save");
    } finally {
      setSaving(false);
    }
  }

  return (
    <form onSubmit={handleSave} className="space-y-4">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="sm:col-span-2 space-y-1.5">
          <label className="text-[11px] font-semibold uppercase tracking-wider text-dim-app">
            Project Name <span className="text-rose-400 normal-case tracking-normal">*</span>
          </label>
          <input value={name} onChange={(e) => setName(e.target.value)} className={fieldClass} required />
        </div>
        <div className="space-y-1.5">
          <label className="text-[11px] font-semibold uppercase tracking-wider text-dim-app">Status</label>
          <select value={status} onChange={(e) => setStatus(e.target.value)} className={fieldClass}>
            <option value="active">Active</option>
            <option value="in_progress">In Progress</option>
            <option value="paused">Paused</option>
            <option value="completed">Completed</option>
          </select>
        </div>
        <div className="space-y-1.5">
          <label className="text-[11px] font-semibold uppercase tracking-wider text-dim-app">Total Value ($)</label>
          <input type="number" value={totalValue} onChange={(e) => setTotalValue(e.target.value)} placeholder="0.00" min="0" step="0.01" className={fieldClass} />
        </div>
        <div className="space-y-1.5">
          <label className="text-[11px] font-semibold uppercase tracking-wider text-dim-app">Deadline</label>
          <input type="date" value={deadline} onChange={(e) => setDeadline(e.target.value)} className={fieldClass} />
        </div>
      </div>
      {error && <div className="rounded-lg bg-rose-500/10 px-3 py-2 text-sm text-rose-400 ring-1 ring-rose-500/20">{error}</div>}
      <div className="flex justify-end gap-2 pt-1">
        <button type="button" onClick={onCancel} className="flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm font-medium text-faint-app transition-colors hover:bg-overlay-xs focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-400">
          <X className="h-3.5 w-3.5" /> Cancel
        </button>
        <button type="submit" disabled={saving} className="flex items-center gap-1.5 rounded-lg bg-violet-600 px-3 py-1.5 text-sm font-medium text-white shadow-[0_2px_8px_rgba(139,92,246,0.3)] transition-[background-color,opacity] hover:bg-violet-700 disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-400">
          <Check className="h-3.5 w-3.5" /> {saving ? "Saving…" : "Save"}
        </button>
      </div>
    </form>
  );
}

// ── Props & Component ──────────────────────────────────────────────────────────

interface ProjectDetailClientProps {
  projectId: string;
  allProjects: ProjectListItem[];
  clients: ClientListItem[];
  initialProject: Project;
  initialTasks: TaskWithAssignee[];
}

function findClientInList(clientId: string | null, clients: ClientListItem[]) {
  if (!clientId) return null;
  return clients.find((c) => c.id === clientId) ?? null;
}

export default function ProjectDetailClient({
  projectId,
  allProjects,
  clients,
  initialProject,
  initialTasks,
}: ProjectDetailClientProps) {
  const router = useRouter();
  const [selectedId, setSelectedId] = useState(projectId);
  const [search, setSearch] = useState("");

  // Initialize from server-fetched props — no loading on first render
  const [project, setProject] = useState<Project | null>(initialProject);
  const [client, setClient] = useState<ClientListItem | null>(() => findClientInList(initialProject.client_id, clients));
  const [tasks, setTasks] = useState<TaskWithAssignee[]>(initialTasks);
  const [loading, setLoading] = useState(false);
  const [tasksLoading, setTasksLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [editing, setEditing] = useState(false);

  const { openTaskForm } = useTaskForm();

  const clientMap = useMemo(() => {
    const m: Record<string, string> = {};
    for (const c of clients) m[c.id] = c.name;
    return m;
  }, [clients]);

  const filteredProjects = useMemo(() => {
    if (!search.trim()) return allProjects;
    const q = search.toLowerCase();
    return allProjects.filter((p) => {
      const clientName = p.client_id ? clientMap[p.client_id] ?? "" : "";
      return (
        p.name.toLowerCase().includes(q) ||
        clientName.toLowerCase().includes(q) ||
        (p.status ?? "").toLowerCase().includes(q)
      );
    });
  }, [allProjects, search, clientMap]);

  // Track which project is currently loaded to avoid redundant fetches
  const [loadedId, setLoadedId] = useState(projectId);

  // Fetch when switching to a different project
  useEffect(() => {
    if (selectedId === loadedId) return;
    async function load() {
      setLoading(true);
      setTasksLoading(true);
      setError(null);
      setEditing(false);
      try {
        const [proj, t] = await Promise.all([
          getProjectById(selectedId),
          getTasksWithAssignees(selectedId),
        ]);
        setProject(proj);
        setClient(findClientInList(proj.client_id, clients));
        setTasks(t);
        setLoadedId(selectedId);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load project");
      } finally {
        setLoading(false);
        setTasksLoading(false);
      }
    }
    load();
  }, [selectedId, loadedId, clients]);

  function selectProject(id: string) {
    if (id === selectedId) return;
    setSelectedId(id);
    window.history.replaceState(null, "", `/dashboard/projects/${id}`);
  }

  const cfg = project ? getStatusConfig(project.status) : getStatusConfig(null);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const isOverdue = project?.deadline && new Date(project.deadline) < today && project.status !== "completed";
  const doneTasks = tasks.filter((t) => t.status === "done").length;
  const totalTasks = tasks.length;

  return (
    <div className="p-4 sm:p-6 lg:p-8">
      {/* Mobile back button */}
      <button
        onClick={() => router.push("/dashboard/projects")}
        className="flex lg:hidden items-center gap-1.5 mb-4 rounded text-sm text-faint-app transition-colors hover:text-muted-app focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-500"
      >
        <ArrowLeft className="h-3.5 w-3.5" />
        Back to Projects
      </button>

      <div className="flex gap-6 items-start">
        {/* ── Left sidebar — Project list card ──────────────────────── */}
        <aside className="hidden lg:flex w-[300px] shrink-0 flex-col rounded-xl border border-surface bg-surface-card overflow-hidden sticky top-6 h-[calc(100vh-112px)]">
          <div className="px-4 pt-4 pb-3 border-b border-surface/60">
            <div className="flex items-center gap-2 mb-3">
              <button
                onClick={() => router.push("/dashboard/projects")}
                className="flex items-center justify-center h-7 w-7 rounded-lg text-faint-app hover:text-bright hover:bg-surface-subtle transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-500"
                title="Back to Projects"
              >
                <ArrowLeft className="h-4 w-4" />
              </button>
              <h2 className="text-[15px] font-bold tracking-[-0.02em] text-bright flex items-center gap-2">
                <FolderKanban className="h-4 w-4 text-violet-400" />
                Projects
              </h2>
            </div>
            <div className="relative">
              <Search className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-app" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search projects…"
                className="w-full rounded-lg bg-surface-subtle border border-surface pl-9 pr-3 py-2 text-[13px] text-primary-app placeholder:text-muted-app outline-none focus:border-violet-500/40 transition-[border-color] duration-150"
              />
            </div>
          </div>

          <div className="flex-1 overflow-y-auto">
            {filteredProjects.length === 0 ? (
              <div className="flex flex-col items-center justify-center gap-2 py-12 text-center px-4">
                <FolderKanban className="h-5 w-5 text-faint-app" />
                <p className="text-xs text-dim-app">No projects found</p>
              </div>
            ) : (
              filteredProjects.map((p) => {
                const pCfg = getStatusConfig(p.status);
                const isActive = p.id === selectedId;
                return (
                  <button
                    key={p.id}
                    onClick={() => selectProject(p.id)}
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
                        {p.name}
                      </span>
                      <span className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[10px] font-medium ${pCfg.badge}`}>
                        <span className={`h-1.5 w-1.5 rounded-full ${pCfg.dot}`} />
                        {pCfg.label}
                      </span>
                    </div>
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-[12px] text-secondary-app truncate">
                        {p.client_id ? clientMap[p.client_id] ?? "No client" : "No client"}
                      </span>
                      <span className="text-[12px] font-semibold text-bright tabular-nums shrink-0">
                        {p.total_value != null ? formatCurrency(p.total_value) : "—"}
                      </span>
                    </div>
                    {p.deadline && (
                      <p className="mt-1 text-[11px] text-dim-app">Due {formatDate(p.deadline)}</p>
                    )}
                  </button>
                );
              })
            )}
          </div>
        </aside>

        {/* ── Right panel — Project detail ────────────────────────────── */}
        <div className="flex-1 min-w-0">
        {loading ? (
          <div className="space-y-6 animate-pulse">
            <div className="rounded-2xl border border-surface bg-surface-card overflow-hidden">
              <div className="flex items-start justify-between gap-4 border-b border-surface px-6 py-5">
                <div className="space-y-2 min-w-0">
                  <div className="h-7 w-48 rounded bg-overlay-xs" />
                  <div className="h-4 w-28 rounded bg-overlay-xs" />
                </div>
                <div className="flex gap-2 shrink-0">
                  <div className="h-6 w-20 rounded-full bg-overlay-xs" />
                  <div className="h-7 w-14 rounded-lg bg-overlay-xs" />
                </div>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-5 px-6 py-5">
                {[0, 1, 2, 3].map((i) => (
                  <div key={i} className="space-y-2">
                    <div className="h-3 w-16 rounded bg-overlay-xs" />
                    <div className="h-4 w-24 rounded bg-overlay-xs" />
                  </div>
                ))}
              </div>
            </div>
            <div className="rounded-xl border border-surface bg-surface-card divide-y divide-surface">
              {[0, 1, 2].map((i) => (
                <div key={i} className="flex items-center gap-3 px-5 py-3.5">
                  <div className="flex-1 space-y-1.5">
                    <div className="h-4 w-40 rounded bg-overlay-xs" />
                    <div className="h-3 w-24 rounded bg-overlay-xs" />
                  </div>
                  <div className="h-5 w-14 rounded-full bg-overlay-xs" />
                  <div className="h-5 w-16 rounded-full bg-overlay-xs" />
                </div>
              ))}
            </div>
          </div>
        ) : error || !project ? (
          <div>
            <div className="rounded-xl bg-rose-500/10 px-5 py-4 text-sm text-rose-400 ring-1 ring-rose-500/20">
              {error ?? "Project not found."}
            </div>
          </div>
        ) : (
          <div className="space-y-6 animate-in">
            {/* Project card */}
            <div className="rounded-2xl bg-surface-card border border-surface">
              <div className="flex items-start justify-between gap-4 border-b border-surface px-6 py-5">
                <div className="min-w-0">
                  <h1 className="truncate text-2xl font-bold tracking-[-0.03em] text-bright">{project.name}</h1>
                  {client && (
                    <Link href={`/dashboard/clients/${client.id}`} className="mt-0.5 text-sm text-faint-app hover:text-violet-400 transition-colors">
                      {client.name}
                    </Link>
                  )}
                </div>
                <div className="flex shrink-0 items-center gap-2">
                  <span className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-medium ${cfg.badge}`}>
                    <span className={`h-1.5 w-1.5 rounded-full ${cfg.dot}`} />
                    {cfg.label}
                  </span>
                  {!editing && (
                    <button onClick={() => setEditing(true)} className="flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium text-faint-app ring-1 ring-surface transition-[background-color,color] hover:bg-overlay-xs hover:text-secondary-app focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-400">
                      <Pencil className="h-3.5 w-3.5" /> Edit
                    </button>
                  )}
                </div>
              </div>

              <div className="px-6 py-5">
                {editing ? (
                  <EditForm project={project} onSave={(updated) => { setProject(updated); setEditing(false); }} onCancel={() => setEditing(false)} />
                ) : (
                  <div className="grid grid-cols-2 gap-5 sm:grid-cols-4">
                    <div>
                      <p className="text-[11px] font-semibold uppercase tracking-wider text-dim-app">Deadline</p>
                      <p className={`mt-1 flex items-center gap-1.5 text-sm font-medium ${isOverdue ? "text-rose-400" : "text-secondary-app"}`}>
                        <Calendar className="h-3.5 w-3.5 shrink-0" />
                        {project.deadline ? formatDate(project.deadline) : "—"}
                      </p>
                    </div>
                    <div>
                      <p className="text-[11px] font-semibold uppercase tracking-wider text-dim-app">Total Value</p>
                      <p className="mt-1 flex items-center gap-1.5 text-sm font-medium text-secondary-app">
                        <DollarSign className="h-3.5 w-3.5 shrink-0 text-dim-app" />
                        {project.total_value != null ? formatCurrency(project.total_value) : "—"}
                      </p>
                    </div>
                    <div>
                      <p className="text-[11px] font-semibold uppercase tracking-wider text-dim-app">Tasks Done</p>
                      <p className="mt-1 flex items-center gap-1.5 text-sm font-medium text-secondary-app">
                        <CheckSquare className="h-3.5 w-3.5 shrink-0 text-dim-app" />
                        {doneTasks} / {totalTasks}
                      </p>
                    </div>
                    <div>
                      <p className="text-[11px] font-semibold uppercase tracking-wider text-dim-app">Progress</p>
                      <div className="mt-2 h-1.5 rounded-full bg-overlay-sm">
                        <div className="h-1.5 rounded-full bg-violet-500 transition-[width]" style={{ width: totalTasks > 0 ? `${Math.round((doneTasks / totalTasks) * 100)}%` : "0%" }} />
                      </div>
                      <p className="mt-1 text-xs text-dim-app">{totalTasks > 0 ? Math.round((doneTasks / totalTasks) * 100) : 0}%</p>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Tasks */}
            <div>
              <div className="mb-3 flex items-center justify-between">
                <h2 className="text-sm font-semibold text-muted-app">
                  Tasks
                  <span className="ml-2 rounded-full bg-overlay-xs px-2 py-0.5 text-xs font-medium text-faint-app">{totalTasks}</span>
                </h2>
                <button
                  onClick={() => openTaskForm(selectedId)}
                  className="flex items-center gap-1.5 rounded-lg bg-violet-600 px-3 py-1.5 text-xs font-semibold text-white shadow-[0_2px_8px_rgba(139,92,246,0.3)] transition-[background-color,box-shadow] hover:bg-violet-700 hover:shadow-[0_4px_12px_rgba(139,92,246,0.4)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-400 focus-visible:ring-offset-2"
                >
                  <Plus className="h-3.5 w-3.5" /> Add Task
                </button>
              </div>

              <div className="rounded-xl bg-surface-card border border-surface">
                {tasks.length === 0 ? (
                  <div className="flex flex-col items-center justify-center gap-2 py-12">
                    <CheckSquare className="h-8 w-8 text-dim-app" />
                    <p className="text-sm text-faint-app">No tasks yet for this project.</p>
                  </div>
                ) : (
                  <ul className="divide-y divide-surface">
                    {tasks.map((task) => {
                      const tstatus = (task.status ?? "todo") as keyof typeof TASK_STATUS_STYLES;
                      const tpriority = (task.priority ?? "normal") as keyof typeof PRIORITY_STYLES;
                      return (
                        <li key={task.id}>
                          <button
                            onClick={() => router.push(`/dashboard/tasks/${task.id}`)}
                            className="flex w-full items-center gap-3 px-5 py-3.5 text-left transition-colors hover:bg-overlay-xs focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-violet-400"
                          >
                            <span className="flex-1 min-w-0">
                              <span className="block truncate text-sm font-medium text-secondary-app">{task.title}</span>
                              {task.due_date && (
                                <span className="mt-0.5 flex items-center gap-1 text-[11px] text-dim-app">
                                  <Calendar className="h-3 w-3 shrink-0" />
                                  {formatDate(task.due_date)}
                                </span>
                              )}
                            </span>
                            <span className={`shrink-0 inline-flex rounded-full px-2 py-0.5 text-[11px] font-medium ${PRIORITY_STYLES[tpriority]}`}>
                              {task.priority ? task.priority.charAt(0).toUpperCase() + task.priority.slice(1) : "—"}
                            </span>
                            <span className={`shrink-0 inline-flex rounded-full px-2 py-0.5 text-[11px] font-medium ${TASK_STATUS_STYLES[tstatus]}`}>
                              {TASK_STATUS_LABELS[tstatus] ?? task.status}
                            </span>
                          </button>
                        </li>
                      );
                    })}
                  </ul>
                )}
              </div>
            </div>
          </div>
        )}
        </div>
      </div>
    </div>
  );
}
