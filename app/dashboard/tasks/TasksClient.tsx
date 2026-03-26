"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { LayoutGrid, List, Plus } from "lucide-react";
import Image from "next/image";
import { TaskBoard } from "@/components/tasks/TaskBoard";
import type { TaskWithAssignee } from "@/components/tasks/TaskCard";
import { useTaskForm } from "@/app/dashboard/task-form-context";

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
    <div className="overflow-x-auto rounded-xl border border-surface">
    <div className="min-w-0 sm:min-w-[580px] bg-surface-card overflow-hidden rounded-xl">
      <div className="grid grid-cols-[1fr_80px_90px] sm:grid-cols-[1fr_100px_120px_120px_100px] gap-2 sm:gap-4 border-b border-surface bg-overlay-xs px-4 sm:px-5 py-3">
        {["Task", "Priority", "Status", "Assignee", "Due Date"].map((h, idx) => (
          <span key={h} className={`text-xs font-semibold uppercase tracking-wider text-dim-app ${idx >= 3 ? "hidden sm:block" : ""}`}>
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
            "grid w-full grid-cols-[1fr_80px_90px] sm:grid-cols-[1fr_100px_120px_120px_100px] gap-2 sm:gap-4 px-4 sm:px-5 py-3.5 text-left",
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

          <span className="hidden sm:flex items-center gap-1.5">
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

          <span className="hidden sm:block text-[11px] text-muted-app">
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
    </div>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────

type ViewMode = "kanban" | "list";

interface TasksClientProps {
  initialTasks: TaskWithAssignee[];
  isAdmin: boolean;
  currentMemberId?: string;
}

export default function TasksClient({ initialTasks, isAdmin, currentMemberId }: TasksClientProps) {
  const router = useRouter();
  const { openTaskForm } = useTaskForm();
  const [view, setView] = useState<ViewMode>("kanban");
  const [showMyTasks, setShowMyTasks] = useState(false);

  const visibleTasks = showMyTasks && currentMemberId
    ? initialTasks.filter((t) => t.assignee_id === currentMemberId)
    : initialTasks;

  function handleTaskClick(task: TaskWithAssignee) {
    router.push(`/dashboard/tasks/${task.id}`);
  }

  return (
    <div className="p-6 sm:p-8 lg:p-10 flex flex-col gap-6">
      {/* Page header */}
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-[-0.03em] text-bright">Tasks</h1>
          <p className="mt-0.5 text-sm text-faint-app">
            {visibleTasks.length} task{visibleTasks.length !== 1 ? "s" : ""}{showMyTasks ? " assigned to you" : " across all projects"}
          </p>
        </div>

        <div className="flex items-center gap-3">
          {/* My Tasks / All Tasks toggle */}
          {currentMemberId && (
            <div className="flex items-center rounded-lg border border-surface bg-surface-card p-0.5">
              <button
                onClick={() => setShowMyTasks(false)}
                className={[
                  "flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-medium",
                  "transition-[background-color,color,box-shadow]",
                  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-400",
                  !showMyTasks
                    ? "bg-violet-600 text-white shadow-sm"
                    : "text-muted-app hover:text-secondary-app",
                ].join(" ")}
              >
                All Tasks
              </button>
              <button
                onClick={() => setShowMyTasks(true)}
                className={[
                  "flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-medium",
                  "transition-[background-color,color,box-shadow]",
                  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-400",
                  showMyTasks
                    ? "bg-violet-600 text-white shadow-sm"
                    : "text-muted-app hover:text-secondary-app",
                ].join(" ")}
              >
                My Tasks
              </button>
            </div>
          )}

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
          {isAdmin && (
            <button
              onClick={() => openTaskForm()}
              className="flex items-center gap-1.5 rounded-lg bg-violet-600 px-3.5 py-2 text-xs font-semibold text-white shadow-[0_2px_8px_rgba(139,92,246,0.35)] hover:bg-violet-500 hover:shadow-[0_4px_12px_rgba(139,92,246,0.4)] active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-400 focus-visible:ring-offset-2 transition-[background-color,box-shadow,transform]"
            >
              <Plus className="h-3.5 w-3.5" />
              New task
            </button>
          )}
        </div>
      </div>

      {/* Content */}
      {view === "kanban" ? (
        <TaskBoard initialTasks={visibleTasks} onTaskClick={handleTaskClick} isAdmin={isAdmin} />
      ) : (
        <ListView tasks={visibleTasks} onTaskClick={handleTaskClick} />
      )}
    </div>
  );
}
