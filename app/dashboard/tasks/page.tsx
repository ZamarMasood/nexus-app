"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { LayoutGrid, List, Plus } from "lucide-react";
import Image from "next/image";
import { TaskBoard } from "@/components/tasks/TaskBoard";
import type { TaskWithAssignee } from "@/components/tasks/TaskCard";
import { getTasksWithAssignees } from "@/lib/db/tasks";
import { useTaskForm } from "@/app/dashboard/task-form-context";

// ── Skeleton ──────────────────────────────────────────────────────────────────

function SkeletonCard() {
  return (
    <div className="flex flex-col gap-3 rounded-xl border border-surface bg-surface-card p-4">
      <div className="flex items-start justify-between gap-3">
        <div className="h-4 w-3/4 rounded bg-overlay-md animate-pulse" />
        <div className="h-5 w-14 rounded-full bg-overlay-md animate-pulse" />
      </div>
      <div className="h-3 w-full rounded bg-overlay-sm animate-pulse" />
      <div className="h-3 w-2/3 rounded bg-overlay-sm animate-pulse" />
      <div className="flex items-center justify-between">
        <div className="h-5 w-20 rounded bg-overlay-md animate-pulse" />
        <div className="h-3 w-16 rounded bg-overlay-sm animate-pulse" />
      </div>
    </div>
  );
}

function BoardSkeleton() {
  return (
    <div className="flex justify-center gap-5 overflow-x-auto pb-6">
      {[0, 1, 2].map((col) => (
        <div key={col} className="flex w-[380px] shrink-0 flex-col">
          <div className="mb-3 flex items-center justify-between rounded-xl border border-surface bg-surface-subtle px-4 py-2.5">
            <div className="flex items-center gap-2.5">
              <div className="h-2 w-2 rounded-full bg-surface-inset animate-pulse shrink-0" />
              <div className="h-3.5 w-24 rounded bg-overlay-md animate-pulse" />
            </div>
            <div className="h-3.5 w-4 rounded bg-overlay-md animate-pulse" />
          </div>
          <div className="flex flex-col gap-2.5 rounded-2xl bg-overlay-sm p-3 min-h-[240px]">
            {Array.from({ length: col === 1 ? 3 : 2 }).map((_, i) => (
              <SkeletonCard key={i} />
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

// ── List view ─────────────────────────────────────────────────────────────────

const PRIORITY_STYLES = {
  urgent: "bg-rose-500/10 text-rose-400 ring-1 ring-rose-500/20",
  high:   "bg-orange-500/10 text-orange-400 ring-1 ring-orange-500/20",
  normal: "bg-sky-500/10 text-sky-400 ring-1 ring-sky-500/20",
  low:    "bg-surface-subtle text-muted-app ring-1 ring-surface",
} as const;

const STATUS_STYLES = {
  todo:        "bg-surface-subtle text-secondary-app",
  in_progress: "bg-amber-400/10 text-amber-400",
  done:        "bg-emerald-400/10 text-emerald-400",
} as const;

const STATUS_LABELS = {
  todo:        "To Do",
  in_progress: "In Progress",
  done:        "Done",
} as const;

function ListView({
  tasks,
  onTaskClick,
}: {
  tasks: TaskWithAssignee[];
  onTaskClick?: (task: TaskWithAssignee) => void;
}) {
  return (
    <div className="rounded-xl border border-surface bg-surface-card overflow-hidden">
      {/* Table header */}
      <div className="grid grid-cols-[1fr_100px_120px_120px_100px] gap-4 border-b border-surface bg-overlay-xs px-5 py-3">
        {["Task", "Priority", "Status", "Assignee", "Due Date"].map((h) => (
          <span key={h} className="text-xs font-semibold uppercase tracking-wider text-dim-app">
            {h}
          </span>
        ))}
      </div>

      {tasks.length === 0 && (
        <div className="flex items-center justify-center py-16">
          <p className="text-sm text-faint-app">No tasks yet</p>
        </div>
      )}

      {tasks.map((task, i) => (
        <button
          key={task.id}
          onClick={() => onTaskClick?.(task)}
          className={[
            "grid w-full grid-cols-[1fr_100px_120px_120px_100px] gap-4 px-5 py-3.5 text-left",
            "hover:bg-overlay-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-violet-400",
            "transition-colors",
            i !== tasks.length - 1 ? "border-b border-surface" : "",
          ].join(" ")}
        >
          <span className="text-sm font-medium text-primary-app truncate leading-snug">
            {task.title}
          </span>

          <span>
            {task.priority && (
              <span
                className={`inline-flex rounded-full px-2 py-0.5 text-[11px] font-medium ${
                  PRIORITY_STYLES[(task.priority as keyof typeof PRIORITY_STYLES)] ??
                  PRIORITY_STYLES.normal
                }`}
              >
                {task.priority.charAt(0).toUpperCase() + task.priority.slice(1)}
              </span>
            )}
          </span>

          <span>
            {task.status && (
              <span
                className={`inline-flex rounded-full px-2 py-0.5 text-[11px] font-medium ${
                  STATUS_STYLES[(task.status as keyof typeof STATUS_STYLES)] ??
                  STATUS_STYLES.todo
                }`}
              >
                {STATUS_LABELS[(task.status as keyof typeof STATUS_LABELS)] ?? task.status}
              </span>
            )}
          </span>

          <span className="flex items-center gap-1.5">
            {task.assignee ? (
              <>
                {task.assignee.avatar_url ? (
                  <Image
                    src={task.assignee.avatar_url}
                    alt={task.assignee.name}
                    width={20}
                    height={20}
                    className="h-5 w-5 rounded-full object-cover"
                  />
                ) : (
                  <div className="flex h-5 w-5 items-center justify-center rounded-full bg-violet-500/20">
                    <span className="text-[9px] font-bold text-violet-300">
                      {task.assignee.name
                        .split(" ")
                        .map((n) => n[0])
                        .join("")
                        .toUpperCase()
                        .slice(0, 2)}
                    </span>
                  </div>
                )}
                <span className="text-[11px] text-muted-app truncate">{task.assignee.name}</span>
              </>
            ) : (
              <span className="text-[11px] text-faint-app">—</span>
            )}
          </span>

          <span className="text-[11px] text-muted-app">
            {task.due_date
              ? new Date(task.due_date).toLocaleDateString("en-US", {
                  month: "short",
                  day: "numeric",
                })
              : "—"}
          </span>
        </button>
      ))}
    </div>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────

type ViewMode = "kanban" | "list";

export default function TasksPage() {
  const router = useRouter();
  const { openTaskForm } = useTaskForm();
  const [view, setView] = useState<ViewMode>("kanban");
  const [tasks, setTasks] = useState<TaskWithAssignee[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    getTasksWithAssignees()
      .then(setTasks)
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  function handleTaskClick(task: TaskWithAssignee) {
    router.push(`/dashboard/tasks/${task.id}`);
  }

  return (
    <div className="p-6 sm:p-8 lg:p-10 flex flex-col gap-6">
      {/* Page header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-[-0.03em] text-bright">Tasks</h1>
          <p className="mt-0.5 text-sm text-faint-app">
            {loading ? "Loading…" : `${tasks.length} task${tasks.length !== 1 ? "s" : ""} across all projects`}
          </p>
        </div>

        <div className="flex items-center gap-3">
          {/* View toggle */}
          <div className="flex items-center rounded-lg border border-surface bg-surface-card p-0.5">
            <button
              onClick={() => setView("kanban")}
              className={[
                "flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-medium",
                "transition-[background-color,color,box-shadow]",
                "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-400",
                view === "kanban"
                  ? "bg-violet-600 text-white shadow-sm"
                  : "text-muted-app hover:text-secondary-app",
              ].join(" ")}
            >
              <LayoutGrid className="h-3.5 w-3.5" />
              Board
            </button>
            <button
              onClick={() => setView("list")}
              className={[
                "flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-medium",
                "transition-[background-color,color,box-shadow]",
                "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-400",
                view === "list"
                  ? "bg-violet-600 text-white shadow-sm"
                  : "text-muted-app hover:text-secondary-app",
              ].join(" ")}
            >
              <List className="h-3.5 w-3.5" />
              List
            </button>
          </div>

          {/* New task */}
          <button
            onClick={() => openTaskForm()}
            className="flex items-center gap-1.5 rounded-lg bg-violet-600 px-3.5 py-2 text-xs font-semibold text-white shadow-[0_2px_8px_rgba(139,92,246,0.35)] hover:bg-violet-500 hover:shadow-[0_4px_12px_rgba(139,92,246,0.4)] active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-400 focus-visible:ring-offset-2 transition-[background-color,box-shadow,transform]"
          >
            <Plus className="h-3.5 w-3.5" />
            New task
          </button>
        </div>
      </div>

      {/* Error */}
      {error && (
        <div className="rounded-xl border border-rose-500/20 bg-rose-500/10 px-4 py-3 text-sm text-rose-400">
          Failed to load tasks: {error}
        </div>
      )}

      {/* Content */}
      {loading ? (
        <BoardSkeleton />
      ) : view === "kanban" ? (
        <TaskBoard initialTasks={tasks} onTaskClick={handleTaskClick} />
      ) : (
        <ListView tasks={tasks} onTaskClick={handleTaskClick} />
      )}
    </div>
  );
}
