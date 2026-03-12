"use client";

import { useEffect, useState } from "react";
import { CheckSquare, AlertCircle, FolderKanban, Calendar, Plus, ArrowRight } from "lucide-react";
import Link from "next/link";
import { getTasksWithAssignees } from "@/lib/db/tasks";
import { getProjects } from "@/lib/db/projects";
import { formatDate } from "@/lib/utils";
import { useTaskForm } from "./task-form-context";
import type { TaskWithAssignee } from "@/lib/db/tasks";
import type { Project } from "@/lib/types";

const PRIORITY_DOT: Record<string, string> = {
  urgent: "bg-rose-400",
  high: "bg-orange-400",
  normal: "bg-sky-400",
  low: "bg-slate-400",
};

const STATUS_LABEL: Record<string, { label: string; class: string }> = {
  todo: { label: "To Do", class: "text-slate-500 bg-slate-100" },
  in_progress: { label: "In Progress", class: "text-amber-700 bg-amber-50" },
  done: { label: "Done", class: "text-emerald-700 bg-emerald-50" },
};

export default function DashboardPage() {
  const { openTaskForm } = useTaskForm();
  const [tasks, setTasks] = useState<TaskWithAssignee[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

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

  useEffect(() => { load(); }, []);

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const overdueTasks = tasks.filter((t) => {
    if (!t.due_date || t.status === "done") return false;
    return new Date(t.due_date) < today;
  });

  const activeProjects = projects.filter((p) => p.status === "active" || p.status === "in_progress");

  const in7Days = new Date(today);
  in7Days.setDate(in7Days.getDate() + 7);
  const upcomingDeadlines = tasks.filter((t) => {
    if (!t.due_date || t.status === "done") return false;
    const d = new Date(t.due_date);
    return d >= today && d <= in7Days;
  });

  const recentTasks = [...tasks].slice(0, 10);

  const stats = [
    {
      label: "Total Tasks",
      value: tasks.length,
      icon: CheckSquare,
      iconBg: "bg-violet-500/10",
      iconColor: "text-violet-400",
      sub: `${tasks.filter((t) => t.status === "done").length} completed`,
    },
    {
      label: "Overdue",
      value: overdueTasks.length,
      icon: AlertCircle,
      iconBg: overdueTasks.length > 0 ? "bg-rose-500/10" : "bg-slate-100",
      iconColor: overdueTasks.length > 0 ? "text-rose-400" : "text-slate-400",
      sub: overdueTasks.length > 0 ? "Need attention" : "All on track",
      valueColor: overdueTasks.length > 0 ? "text-rose-500" : undefined,
    },
    {
      label: "Active Projects",
      value: activeProjects.length,
      icon: FolderKanban,
      iconBg: "bg-sky-500/10",
      iconColor: "text-sky-400",
      sub: `${projects.length} total`,
    },
    {
      label: "Due This Week",
      value: upcomingDeadlines.length,
      icon: Calendar,
      iconBg: "bg-amber-500/10",
      iconColor: "text-amber-400",
      sub: "Next 7 days",
    },
  ];

  if (loading) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="grid grid-cols-4 gap-4">
          {[0, 1, 2, 3].map((i) => (
            <div key={i} className="h-28 rounded-2xl bg-slate-200" />
          ))}
        </div>
        <div className="h-64 rounded-2xl bg-slate-200" />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-[-0.03em] text-slate-900">
            Good morning
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            {new Date().toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" })}
          </p>
        </div>
        <button
          onClick={() => openTaskForm()}
          className="flex items-center gap-2 rounded-xl bg-violet-600 px-4 py-2.5 text-sm font-medium text-white shadow-[0_4px_14px_rgba(139,92,246,0.4)] hover:bg-violet-500 active:scale-[0.97] transition-[background-color,transform] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-400"
        >
          <Plus className="h-4 w-4" />
          New Task
          <kbd className="ml-1 rounded bg-white/20 px-1.5 py-0.5 text-[10px] font-mono">C</kbd>
        </button>
      </div>

      {error && (
        <div className="rounded-xl bg-rose-50 border border-rose-200 px-4 py-3 text-sm text-rose-700">
          {error}
        </div>
      )}

      {/* Summary cards */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        {stats.map(({ label, value, icon: Icon, iconBg, iconColor, sub, valueColor }) => (
          <div
            key={label}
            className="rounded-2xl bg-white border border-slate-200/80 p-5 shadow-[0_2px_8px_rgba(0,0,0,0.04),0_1px_2px_rgba(0,0,0,0.06)]"
          >
            <div className="flex items-center justify-between">
              <p className="text-xs font-medium text-slate-500">{label}</p>
              <div className={`flex h-8 w-8 items-center justify-center rounded-lg ${iconBg}`}>
                <Icon className={`h-4 w-4 ${iconColor}`} />
              </div>
            </div>
            <p className={`mt-3 text-3xl font-bold tracking-[-0.03em] ${valueColor ?? "text-slate-900"}`}>
              {value}
            </p>
            <p className="mt-1 text-xs text-slate-400">{sub}</p>
          </div>
        ))}
      </div>

      {/* Recent activity */}
      <div className="rounded-2xl bg-white border border-slate-200/80 shadow-[0_2px_8px_rgba(0,0,0,0.04),0_1px_2px_rgba(0,0,0,0.06)] overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
          <h2 className="text-sm font-semibold tracking-[-0.02em] text-slate-900">
            Recent Activity
          </h2>
          <Link
            href="/dashboard/tasks"
            className="flex items-center gap-1 text-xs text-violet-600 hover:text-violet-500 transition-colors"
          >
            View all <ArrowRight className="h-3 w-3" />
          </Link>
        </div>

        {recentTasks.length === 0 ? (
          <div className="py-12 text-center">
            <CheckSquare className="mx-auto h-8 w-8 text-slate-300" />
            <p className="mt-2 text-sm text-slate-400">No tasks yet</p>
            <button
              onClick={() => openTaskForm()}
              className="mt-3 text-xs text-violet-600 hover:text-violet-500 transition-colors"
            >
              Create your first task →
            </button>
          </div>
        ) : (
          <ul className="divide-y divide-slate-50">
            {recentTasks.map((task) => {
              const statusInfo = STATUS_LABEL[task.status ?? "todo"] ?? STATUS_LABEL.todo;
              const priorityDot = PRIORITY_DOT[task.priority ?? "normal"] ?? PRIORITY_DOT.normal;

              return (
                <li key={task.id}>
                  <Link
                    href={`/dashboard/tasks/${task.id}`}
                    className="flex items-center gap-4 px-6 py-3.5 hover:bg-slate-50/80 transition-colors group"
                  >
                    {/* Priority dot */}
                    <span className={`h-2 w-2 shrink-0 rounded-full ${priorityDot}`} />

                    {/* Title */}
                    <span className="min-w-0 flex-1 truncate text-sm font-medium text-slate-800 group-hover:text-slate-900">
                      {task.title}
                    </span>

                    {/* Status */}
                    <span className={`shrink-0 rounded-full px-2.5 py-0.5 text-[11px] font-medium ${statusInfo.class}`}>
                      {statusInfo.label}
                    </span>

                    {/* Assignee */}
                    {task.assignee ? (
                      <div
                        className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-violet-100 text-[10px] font-semibold text-violet-700"
                        title={task.assignee.name}
                      >
                        {task.assignee.name.slice(0, 2).toUpperCase()}
                      </div>
                    ) : (
                      <div className="h-6 w-6 shrink-0 rounded-full bg-slate-100" />
                    )}

                    {/* Due date */}
                    <span className="shrink-0 text-xs text-slate-400 w-20 text-right">
                      {task.due_date ? formatDate(task.due_date) : "—"}
                    </span>
                  </Link>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </div>
  );
}
