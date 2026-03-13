"use client";

import { useEffect, useState } from "react";
import {
  CheckSquare,
  AlertCircle,
  FolderKanban,
  Calendar,
  Plus,
  ArrowUpRight,
  TrendingUp,
  Zap,
} from "lucide-react";
import Link from "next/link";
import { getTasksWithAssignees } from "@/lib/db/tasks";
import { getProjects } from "@/lib/db/projects";
import { formatDate } from "@/lib/utils";
import { useTaskForm } from "./task-form-context";
import type { TaskWithAssignee } from "@/lib/db/tasks";
import type { Project } from "@/lib/types";

const PRIORITY_CONFIG: Record<string, { dot: string; label: string; bg: string; text: string }> = {
  urgent: { dot: "bg-rose-400",   label: "Urgent", bg: "bg-rose-500/10",    text: "text-rose-400"   },
  high:   { dot: "bg-orange-400", label: "High",   bg: "bg-orange-500/10",  text: "text-orange-400" },
  normal: { dot: "bg-sky-400",    label: "Normal", bg: "bg-sky-500/10",     text: "text-sky-400"    },
  low:    { dot: "bg-dim-app",    label: "Low",    bg: "bg-surface-inset",  text: "text-faint-app"  },
};

const STATUS_CONFIG: Record<string, { label: string; bg: string; text: string; dot: string }> = {
  todo:        { label: "To Do",       bg: "bg-surface-inset",  text: "text-muted-app",  dot: "bg-dim-app"    },
  in_progress: { label: "In Progress", bg: "bg-amber-500/10",   text: "text-amber-400",  dot: "bg-amber-400"  },
  done:        { label: "Done",        bg: "bg-emerald-500/10", text: "text-emerald-400", dot: "bg-emerald-400" },
};

function greeting() {
  const h = new Date().getHours();
  if (h < 12) return "Good morning";
  if (h < 17) return "Good afternoon";
  return "Good evening";
}

export default function DashboardPage() {
  const { openTaskForm } = useTaskForm();
  const [tasks, setTasks]       = useState<TaskWithAssignee[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading]   = useState(true);
  const [error, setError]       = useState<string | null>(null);
  const [mounted, setMounted]   = useState(false);

  async function load() {
    try {
      const [t, p] = await Promise.all([getTasksWithAssignees(), getProjects()]);
      setTasks(t);
      setProjects(p);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to load dashboard");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); setMounted(true); }, []);

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const overdueTasks      = tasks.filter((t) => !t.due_date || t.status === "done" ? false : new Date(t.due_date) < today);
  const activeProjects    = projects.filter((p) => p.status === "active" || p.status === "in_progress");
  const in7Days           = new Date(today);
  in7Days.setDate(in7Days.getDate() + 7);
  const upcomingDeadlines = tasks.filter((t) => {
    if (!t.due_date || t.status === "done") return false;
    const d = new Date(t.due_date);
    return d >= today && d <= in7Days;
  });
  const doneTasks     = tasks.filter((t) => t.status === "done");
  const recentTasks   = [...tasks].slice(0, 10);
  const completionPct = tasks.length ? Math.round((doneTasks.length / tasks.length) * 100) : 0;

  const stats = [
    {
      label:      "Total Tasks",
      value:      tasks.length,
      icon:       CheckSquare,
      accent:     "from-violet-500/20 to-violet-600/5",
      iconColor:  "text-violet-400",
      iconBg:     "bg-violet-500/10",
      sub:        `${completionPct}% complete`,
      trend:      doneTasks.length > 0,
      progress:   completionPct,
    },
    {
      label:      "Overdue",
      value:      overdueTasks.length,
      icon:       AlertCircle,
      accent:     overdueTasks.length > 0 ? "from-rose-500/20 to-rose-600/5" : "",
      iconColor:  overdueTasks.length > 0 ? "text-rose-400" : "text-faint-app",
      iconBg:     overdueTasks.length > 0 ? "bg-rose-500/10" : "bg-surface-inset",
      sub:        overdueTasks.length > 0 ? "Needs attention" : "All on track",
      valueColor: overdueTasks.length > 0 ? "text-rose-400" : undefined,
    },
    {
      label:     "Active Projects",
      value:     activeProjects.length,
      icon:      FolderKanban,
      accent:    "from-sky-500/20 to-sky-600/5",
      iconColor: "text-sky-400",
      iconBg:    "bg-sky-500/10",
      sub:       `${projects.length} total`,
    },
    {
      label:     "Due This Week",
      value:     upcomingDeadlines.length,
      icon:      Calendar,
      accent:    "from-amber-500/20 to-amber-600/5",
      iconColor: "text-amber-400",
      iconBg:    "bg-amber-500/10",
      sub:       "Next 7 days",
    },
  ];

  if (loading) {
    return (
      <div className="p-6 sm:p-8 lg:p-10 space-y-6">
        <div className="animate-pulse space-y-6">
          <div className="h-8 w-48 rounded-lg bg-surface-inset" />
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
            {[0, 1, 2, 3].map((i) => (
              <div key={i} className="h-32 rounded-2xl bg-surface-subtle" />
            ))}
          </div>
          <div className="h-72 rounded-2xl bg-surface-subtle" />
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 sm:p-8 lg:p-10">

      {/* ── Header ─────────────────────────────────────────────────────────── */}
      <div
        className="flex items-start justify-between mb-8 animate-in"
        style={{ animationDelay: "0ms" }}
      >
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-widest text-dim-app mb-1">
            {new Date().toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" })}
          </p>
          <h1 className="text-[28px] font-bold tracking-[-0.04em] text-bright leading-tight">
            {greeting()}
          </h1>
          <p className="mt-1 text-sm text-faint-app">Here's what's happening today.</p>
        </div>

        <button
          onClick={() => openTaskForm()}
          className="group flex items-center gap-2 rounded-xl bg-violet-600 px-4 py-2.5 text-sm font-semibold text-white shadow-[0_4px_24px_rgba(139,92,246,0.35),0_1px_4px_rgba(0,0,0,0.4)] hover:bg-violet-500 hover:shadow-[0_4px_28px_rgba(139,92,246,0.5)] active:scale-[0.97] transition-[background-color,box-shadow,transform] duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-400/60"
        >
          <Plus className="h-4 w-4 transition-transform duration-200 group-hover:rotate-90" />
          New Task
        </button>
      </div>

      {error && (
        <div className="mb-6 rounded-xl border border-rose-500/20 bg-rose-500/10 px-4 py-3 text-sm text-rose-400 animate-in">
          {error}
        </div>
      )}

      {/* ── Stat cards ─────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4 mb-8">
        {stats.map(({ label, value, icon: Icon, accent, iconColor, iconBg, sub, valueColor, trend, progress }, i) => (
          <div
            key={label}
            className="relative overflow-hidden rounded-2xl border border-surface bg-surface-card p-5 animate-in"
            style={{ animationDelay: `${80 + i * 60}ms` }}
          >
            {/* Gradient top bleed */}
            {accent && (
              <>
                <div className={`absolute inset-x-0 top-0 h-px bg-gradient-to-r ${accent}`} />
                <div className={`absolute inset-x-0 top-0 h-20 bg-gradient-to-b ${accent} opacity-40`} />
              </>
            )}

            <div className="relative">
              <div className="flex items-start justify-between mb-3">
                <div className={`flex h-9 w-9 items-center justify-center rounded-xl ${iconBg}`}>
                  <Icon className={`h-4 w-4 ${iconColor}`} />
                </div>
                {trend && <TrendingUp className="h-3.5 w-3.5 text-emerald-400" />}
              </div>

              <p className={`text-[32px] font-bold tracking-[-0.04em] leading-none ${valueColor ?? "text-bright"}`}>
                {value}
              </p>
              <p className="mt-2 text-[11px] font-medium text-dim-app">{label}</p>
              <p className="mt-0.5 text-[11px] text-dim-app">{sub}</p>

              {/* Progress bar for total tasks card */}
              {progress !== undefined && tasks.length > 0 && (
                <div className="mt-3 h-1 w-full rounded-full bg-surface-inset overflow-hidden">
                  <div
                    className="h-full rounded-full bg-violet-500 transition-[width] duration-700"
                    style={{ width: `${progress}%` }}
                  />
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* ── Quick actions ───────────────────────────────────────────────────── */}
      <div
        className="mb-6 flex items-center gap-2 animate-in"
        style={{ animationDelay: "340ms" }}
      >
        <div className="flex items-center gap-2">
          <Zap className="h-3.5 w-3.5 text-dim-app" />
          <span className="text-[11px] font-semibold uppercase tracking-widest text-dim-app">Quick links</span>
        </div>
        <div className="flex gap-2">
          {[
            { href: "/dashboard/projects", label: "Projects" },
            { href: "/dashboard/clients",  label: "Clients"  },
            { href: "/dashboard/invoices", label: "Invoices" },
          ].map(({ href, label }) => (
            <Link
              key={href}
              href={href}
              className="rounded-lg border border-surface bg-surface-card px-3 py-1 text-[12px] font-medium text-muted-app hover:border-violet-500/30 hover:text-violet-400 hover:bg-violet-500/5 transition-[background-color,border-color,color] duration-150"
            >
              {label}
            </Link>
          ))}
        </div>
      </div>

      {/* ── Recent tasks ────────────────────────────────────────────────────── */}
      <div
        className="rounded-2xl border border-surface bg-surface-card overflow-hidden animate-in"
        style={{ animationDelay: "400ms" }}
      >
        {/* Table header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-surface">
          <div>
            <h2 className="text-[13px] font-semibold tracking-[-0.02em] text-bright">Recent Tasks</h2>
            <p className="text-[11px] text-dim-app mt-0.5">{tasks.length} total tasks</p>
          </div>
          <Link
            href="/dashboard/tasks"
            className="group flex items-center gap-1 rounded-lg px-3 py-1.5 text-[12px] font-medium text-faint-app border border-surface hover:border-violet-500/30 hover:text-violet-500 dark:hover:text-violet-400 hover:bg-violet-500/5 transition-[background-color,border-color,color] duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-500/40"
          >
            View all
            <ArrowUpRight className="h-3 w-3 transition-transform duration-150 group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
          </Link>
        </div>

        {recentTasks.length === 0 ? (
          <div className="py-16 text-center">
            <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-surface-inset border border-surface">
              <CheckSquare className="h-5 w-5 text-dim-app" />
            </div>
            <p className="text-sm font-medium text-faint-app">No tasks yet</p>
            <p className="mt-1 text-xs text-dim-app">Create your first task to get started</p>
            <button
              onClick={() => openTaskForm()}
              className="mt-4 rounded-lg px-4 py-2 text-xs font-medium text-violet-400 border border-violet-500/20 hover:bg-violet-500/10 transition-[background-color] duration-150"
            >
              + Create task
            </button>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-[1fr_140px_100px_90px] gap-4 px-6 py-2.5 text-[10px] font-semibold uppercase tracking-widest text-dim-app border-b border-surface">
              <span>Task</span>
              <span>Status</span>
              <span className="hidden sm:block">Assignee</span>
              <span className="text-right">Due</span>
            </div>

            <ul>
              {recentTasks.map((task, idx) => {
                const statusCfg   = STATUS_CONFIG[task.status ?? "todo"] ?? STATUS_CONFIG.todo;
                const priorityCfg = PRIORITY_CONFIG[task.priority ?? "normal"] ?? PRIORITY_CONFIG.normal;

                return (
                  <li
                    key={task.id}
                    className={[
                      "animate-in",
                      idx < recentTasks.length - 1 ? "border-b border-surface" : "",
                    ].join(" ")}
                    style={{ animationDelay: `${460 + idx * 30}ms` }}
                  >
                    <Link
                      href={`/dashboard/tasks/${task.id}`}
                      className="group grid grid-cols-[1fr_140px_100px_90px] gap-4 items-center px-6 py-3.5 hover:bg-overlay-xs transition-[background-color] duration-100 focus-visible:outline-none focus-visible:bg-overlay-sm"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <span className={`h-1.5 w-1.5 shrink-0 rounded-full ${priorityCfg.dot}`} />
                        <span className="truncate text-[13px] font-medium text-secondary-app group-hover:text-bright transition-colors duration-100">
                          {task.title}
                        </span>
                      </div>

                      <div>
                        <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-medium ${statusCfg.bg} ${statusCfg.text}`}>
                          <span className={`h-1 w-1 rounded-full ${statusCfg.dot}`} />
                          {statusCfg.label}
                        </span>
                      </div>

                      <div className="hidden sm:flex items-center gap-2">
                        {task.assignee ? (
                          <>
                            <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-violet-500/15 text-[9px] font-bold text-violet-300 ring-1 ring-violet-500/20">
                              {task.assignee.name.slice(0, 2).toUpperCase()}
                            </div>
                            <span className="truncate text-[12px] text-faint-app group-hover:text-muted-app transition-colors">
                              {task.assignee.name.split(" ")[0]}
                            </span>
                          </>
                        ) : (
                          <div className="h-6 w-6 rounded-full bg-surface-inset ring-1 ring-surface" />
                        )}
                      </div>

                      <span className="text-right text-[12px] text-dim-app group-hover:text-faint-app transition-colors tabular-nums">
                        {task.due_date ? formatDate(task.due_date) : "—"}
                      </span>
                    </Link>
                  </li>
                );
              })}
            </ul>
          </>
        )}
      </div>
    </div>
  );
}
