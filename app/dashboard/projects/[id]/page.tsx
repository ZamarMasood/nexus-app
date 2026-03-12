"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  Calendar,
  DollarSign,
  CheckSquare,
  Pencil,
  Check,
  X,
  Plus,
} from "lucide-react";
import { getProjectById, updateProject } from "@/lib/db/projects";
import { getClientById } from "@/lib/db/clients";
import { getTasksWithAssignees } from "@/lib/db/tasks";
import { formatDate, formatCurrency } from "@/lib/utils";
import type { Project, Client } from "@/lib/types";
import type { TaskWithAssignee } from "@/lib/db/tasks";
import { useTaskForm } from "../../task-form-context";

// ── Status config ──────────────────────────────────────────────────────────────

const STATUS_CONFIG: Record<string, { label: string; dot: string; badge: string }> = {
  active:      { label: "Active",      dot: "bg-emerald-400", badge: "text-emerald-700 bg-emerald-50 border-emerald-200" },
  in_progress: { label: "In Progress", dot: "bg-amber-400",   badge: "text-amber-700 bg-amber-50 border-amber-200" },
  completed:   { label: "Completed",   dot: "bg-slate-400",   badge: "text-slate-600 bg-slate-100 border-slate-200" },
  paused:      { label: "Paused",      dot: "bg-orange-400",  badge: "text-orange-700 bg-orange-50 border-orange-200" },
};

function getStatusConfig(status: string | null) {
  return STATUS_CONFIG[status ?? ""] ?? {
    label: status ?? "Unknown",
    dot: "bg-slate-300",
    badge: "text-slate-500 bg-slate-50 border-slate-200",
  };
}

const TASK_STATUS_STYLES = {
  todo:        "bg-slate-100 text-slate-600",
  in_progress: "bg-amber-100 text-amber-700",
  done:        "bg-emerald-100 text-emerald-700",
} as const;

const TASK_STATUS_LABELS = {
  todo: "To Do",
  in_progress: "In Progress",
  done: "Done",
} as const;

const PRIORITY_STYLES = {
  urgent: "bg-rose-50 text-rose-700 ring-1 ring-rose-200",
  high:   "bg-orange-50 text-orange-700 ring-1 ring-orange-200",
  normal: "bg-sky-50 text-sky-700 ring-1 ring-sky-200",
  low:    "bg-slate-100 text-slate-500 ring-1 ring-slate-200",
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
    "w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-violet-500/50 focus:border-violet-400 transition-[border-color,box-shadow]";

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
          <label className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">
            Project Name <span className="text-rose-400 normal-case tracking-normal">*</span>
          </label>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            className={fieldClass}
            required
          />
        </div>
        <div className="space-y-1.5">
          <label className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">
            Status
          </label>
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
        <div className="space-y-1.5">
          <label className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">
            Total Value ($)
          </label>
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
        <div className="space-y-1.5">
          <label className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">
            Deadline
          </label>
          <input
            type="date"
            value={deadline}
            onChange={(e) => setDeadline(e.target.value)}
            className={fieldClass}
          />
        </div>
      </div>

      {error && (
        <div className="rounded-lg bg-rose-50 px-3 py-2 text-sm text-rose-600 ring-1 ring-rose-200">
          {error}
        </div>
      )}

      <div className="flex justify-end gap-2 pt-1">
        <button
          type="button"
          onClick={onCancel}
          className="flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm font-medium text-slate-500 transition-colors hover:bg-slate-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-400"
        >
          <X className="h-3.5 w-3.5" />
          Cancel
        </button>
        <button
          type="submit"
          disabled={saving}
          className="flex items-center gap-1.5 rounded-lg bg-violet-600 px-3 py-1.5 text-sm font-medium text-white shadow-[0_2px_8px_rgba(139,92,246,0.3)] transition-[background-color,opacity] hover:bg-violet-700 disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-400"
        >
          <Check className="h-3.5 w-3.5" />
          {saving ? "Saving…" : "Save"}
        </button>
      </div>
    </form>
  );
}

// ── Page ───────────────────────────────────────────────────────────────────────

export default function ProjectDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;

  const [project, setProject] = useState<Project | null>(null);
  const [client, setClient] = useState<Client | null>(null);
  const [tasks, setTasks] = useState<TaskWithAssignee[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editing, setEditing] = useState(false);

  const { openTaskForm } = useTaskForm();

  useEffect(() => {
    async function load() {
      try {
        const proj = await getProjectById(id);
        setProject(proj);

        const [t, c] = await Promise.all([
          getTasksWithAssignees(id),
          proj.client_id ? getClientById(proj.client_id).catch(() => null) : Promise.resolve(null),
        ]);
        setTasks(t);
        setClient(c);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load project");
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [id]);

  if (loading) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="h-4 w-32 rounded bg-slate-200" />
        <div className="h-32 rounded-2xl bg-slate-200" />
        <div className="h-64 rounded-2xl bg-slate-200" />
      </div>
    );
  }

  if (error || !project) {
    return (
      <div className="space-y-4">
        <Link
          href="/dashboard/projects"
          className="flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-800 transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          Projects
        </Link>
        <div className="rounded-xl bg-rose-50 px-5 py-4 text-sm text-rose-600 ring-1 ring-rose-200">
          {error ?? "Project not found."}
        </div>
      </div>
    );
  }

  const cfg = getStatusConfig(project.status);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const isOverdue =
    project.deadline &&
    new Date(project.deadline) < today &&
    project.status !== "completed";

  const doneTasks = tasks.filter((t) => t.status === "done").length;
  const totalTasks = tasks.length;

  return (
    <div className="space-y-6">
      {/* Back link */}
      <Link
        href="/dashboard/projects"
        className="flex w-fit items-center gap-1.5 text-sm text-slate-400 transition-colors hover:text-slate-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-400 rounded"
      >
        <ArrowLeft className="h-4 w-4" />
        Projects
      </Link>

      {/* Project card */}
      <div className="rounded-2xl bg-white shadow-[0_2px_8px_rgba(0,0,0,0.06),0_1px_2px_rgba(0,0,0,0.06)] ring-1 ring-slate-100">
        {/* Header band */}
        <div className="flex items-start justify-between gap-4 border-b border-slate-100 px-6 py-5">
          <div className="min-w-0">
            <h1 className="truncate text-2xl font-bold tracking-[-0.03em] text-slate-900">
              {project.name}
            </h1>
            {client && (
              <Link
                href={`/dashboard/clients/${client.id}`}
                className="mt-0.5 text-sm text-slate-400 hover:text-violet-600 transition-colors"
              >
                {client.name}
              </Link>
            )}
          </div>
          <div className="flex shrink-0 items-center gap-2">
            <span
              className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-medium ${cfg.badge}`}
            >
              <span className={`h-1.5 w-1.5 rounded-full ${cfg.dot}`} />
              {cfg.label}
            </span>
            {!editing && (
              <button
                onClick={() => setEditing(true)}
                className="flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium text-slate-500 ring-1 ring-slate-200 transition-[background-color,color] hover:bg-slate-50 hover:text-slate-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-400"
              >
                <Pencil className="h-3.5 w-3.5" />
                Edit
              </button>
            )}
          </div>
        </div>

        {/* Body */}
        <div className="px-6 py-5">
          {editing ? (
            <EditForm
              project={project}
              onSave={(updated) => {
                setProject(updated);
                setEditing(false);
              }}
              onCancel={() => setEditing(false)}
            />
          ) : (
            <div className="grid grid-cols-2 gap-5 sm:grid-cols-4">
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                  Deadline
                </p>
                <p
                  className={`mt-1 flex items-center gap-1.5 text-sm font-medium ${
                    isOverdue ? "text-rose-600" : "text-slate-700"
                  }`}
                >
                  <Calendar className="h-3.5 w-3.5 shrink-0" />
                  {project.deadline ? formatDate(project.deadline) : "—"}
                </p>
              </div>
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                  Total Value
                </p>
                <p className="mt-1 flex items-center gap-1.5 text-sm font-medium text-slate-700">
                  <DollarSign className="h-3.5 w-3.5 shrink-0 text-slate-400" />
                  {project.total_value != null ? formatCurrency(project.total_value) : "—"}
                </p>
              </div>
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                  Tasks Done
                </p>
                <p className="mt-1 flex items-center gap-1.5 text-sm font-medium text-slate-700">
                  <CheckSquare className="h-3.5 w-3.5 shrink-0 text-slate-400" />
                  {doneTasks} / {totalTasks}
                </p>
              </div>
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                  Progress
                </p>
                <div className="mt-2 h-1.5 rounded-full bg-slate-100">
                  <div
                    className="h-1.5 rounded-full bg-violet-500 transition-[width]"
                    style={{
                      width: totalTasks > 0 ? `${Math.round((doneTasks / totalTasks) * 100)}%` : "0%",
                    }}
                  />
                </div>
                <p className="mt-1 text-xs text-slate-400">
                  {totalTasks > 0 ? Math.round((doneTasks / totalTasks) * 100) : 0}%
                </p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Tasks */}
      <div>
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-sm font-semibold text-slate-700">
            Tasks
            <span className="ml-2 rounded-full bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-500">
              {totalTasks}
            </span>
          </h2>
          <button
            onClick={() => openTaskForm(id)}
            className="flex items-center gap-1.5 rounded-lg bg-violet-600 px-3 py-1.5 text-xs font-semibold text-white shadow-[0_2px_8px_rgba(139,92,246,0.3)] transition-[background-color,box-shadow] hover:bg-violet-700 hover:shadow-[0_4px_12px_rgba(139,92,246,0.4)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-400 focus-visible:ring-offset-2"
          >
            <Plus className="h-3.5 w-3.5" />
            Add Task
          </button>
        </div>

        <div className="rounded-xl bg-white shadow-[0_1px_3px_rgba(0,0,0,0.06),0_2px_8px_rgba(0,0,0,0.04)] ring-1 ring-slate-100">
          {tasks.length === 0 ? (
            <div className="flex flex-col items-center justify-center gap-2 py-12">
              <CheckSquare className="h-8 w-8 text-slate-200" />
              <p className="text-sm text-slate-400">No tasks yet for this project.</p>
            </div>
          ) : (
            <ul className="divide-y divide-slate-50">
              {tasks.map((task) => {
                const tstatus = (task.status ?? "todo") as keyof typeof TASK_STATUS_STYLES;
                const tpriority = (task.priority ?? "normal") as keyof typeof PRIORITY_STYLES;
                return (
                  <li key={task.id}>
                    <button
                      onClick={() => router.push(`/dashboard/tasks/${task.id}`)}
                      className="flex w-full items-center gap-3 px-5 py-3.5 text-left transition-colors hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-violet-400"
                    >
                      <span className="flex-1 min-w-0">
                        <span className="block truncate text-sm font-medium text-slate-800">
                          {task.title}
                        </span>
                        {task.due_date && (
                          <span className="mt-0.5 flex items-center gap-1 text-[11px] text-slate-400">
                            <Calendar className="h-3 w-3 shrink-0" />
                            {formatDate(task.due_date)}
                          </span>
                        )}
                      </span>
                      <span
                        className={`shrink-0 inline-flex rounded-full px-2 py-0.5 text-[11px] font-medium ${PRIORITY_STYLES[tpriority]}`}
                      >
                        {task.priority
                          ? task.priority.charAt(0).toUpperCase() + task.priority.slice(1)
                          : "—"}
                      </span>
                      <span
                        className={`shrink-0 inline-flex rounded-full px-2 py-0.5 text-[11px] font-medium ${TASK_STATUS_STYLES[tstatus]}`}
                      >
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
  );
}
