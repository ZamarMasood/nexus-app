"use client";

import Image from "next/image";
import type { Task, TeamMember } from "@/lib/types";
import { CalendarDays, AlertCircle, ArrowUp, Minus, ArrowDown, Lock } from "lucide-react";

export type TaskWithAssignee = Task & {
  assignee?: Pick<TeamMember, "name" | "avatar_url"> | null;
};

interface TaskCardProps {
  task: TaskWithAssignee;
  onClick?: (task: TaskWithAssignee) => void;
  isDragging?: boolean;
  isLocked?: boolean;
}

const PRIORITY_CONFIG = {
  urgent: {
    label: "Urgent",
    badge: "bg-rose-500/10 text-rose-400 ring-1 ring-rose-500/20",
    border: "border-l-rose-500/80",
    hoverGlow: "hover:shadow-[0_0_28px_rgba(239,68,68,0.2),0_8px_32px_rgba(0,0,0,0.6)]",
    icon: AlertCircle,
    iconColor: "text-rose-400",
  },
  high: {
    label: "High",
    badge: "bg-orange-500/10 text-orange-400 ring-1 ring-orange-500/20",
    border: "border-l-orange-500/70",
    hoverGlow: "hover:shadow-[0_0_28px_rgba(249,115,22,0.2),0_8px_32px_rgba(0,0,0,0.6)]",
    icon: ArrowUp,
    iconColor: "text-orange-400",
  },
  normal: {
    label: "Normal",
    badge: "bg-sky-500/10 text-sky-400 ring-1 ring-sky-500/20",
    border: "border-l-sky-500/60",
    hoverGlow: "hover:shadow-[0_0_28px_rgba(14,165,233,0.18),0_8px_32px_rgba(0,0,0,0.6)]",
    icon: Minus,
    iconColor: "text-sky-400",
  },
  low: {
    label: "Low",
    badge: "bg-surface-subtle text-muted-app ring-1 ring-surface",
    border: "border-l-surface",
    hoverGlow: "hover:shadow-[0_0_28px_rgba(139,92,246,0.14),0_8px_32px_rgba(0,0,0,0.6)]",
    icon: ArrowDown,
    iconColor: "text-faint-app",
  },
} as const;

function getInitials(name: string): string {
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

function isOverdue(dueDate: string | null): boolean {
  if (!dueDate) return false;
  return new Date(dueDate) < new Date(new Date().toDateString());
}

export function TaskCard({ task, onClick, isDragging = false, isLocked = false }: TaskCardProps) {
  const priority = (task.priority as keyof typeof PRIORITY_CONFIG) ?? "normal";
  const config = PRIORITY_CONFIG[priority] ?? PRIORITY_CONFIG.normal;
  const PriorityIcon = config.icon;
  const overdue = isOverdue(task.due_date);

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={() => onClick?.(task)}
      onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); onClick?.(task); } }}
      className={[
        "group relative flex flex-col gap-3 rounded-xl border border-surface bg-surface-page p-4",
        "border-l-4",
        config.border,
        "select-none",
        isLocked ? "cursor-default opacity-60" : "cursor-pointer",
        "shadow-[0_2px_8px_rgba(0,0,0,0.5),0_1px_2px_rgba(0,0,0,0.7)]",
        isLocked ? "" : config.hoverGlow,
        isLocked ? "" : "hover:-translate-y-0.5",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-400/50",
        isLocked ? "" : "active:scale-[0.99]",
        "transition-[transform,box-shadow,border-color,opacity]",
        isDragging ? "opacity-80 rotate-1 scale-[1.02] shadow-[0_20px_48px_rgba(0,0,0,0.7)]" : "",
      ].join(" ")}
    >
      {/* Title + priority badge */}
      <div className="flex items-start justify-between gap-3">
        <p className={[
          "text-sm font-semibold leading-snug tracking-[-0.01em] line-clamp-2",
          isLocked ? "text-muted-app" : "text-secondary-app group-hover:text-bright transition-colors duration-100",
        ].join(" ")}>
          {task.title}
        </p>
        <div className="flex shrink-0 items-center gap-1.5">
          {isLocked && (
            <Lock className="h-3 w-3 text-faint-app" />
          )}
          <span
            className={`inline-flex shrink-0 items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-medium ${config.badge}`}
          >
            <PriorityIcon className={`h-2.5 w-2.5 ${config.iconColor}`} />
            {config.label}
          </span>
        </div>
      </div>

      {/* Description */}
      {task.description && (
        <p className="text-xs leading-relaxed text-muted-app line-clamp-2">
          {task.description}
        </p>
      )}

      {/* Footer: assignee + due date */}
      <div className="flex items-center justify-between gap-2">
        {task.assignee ? (
          <div className="flex items-center gap-1.5">
            {task.assignee.avatar_url ? (
              <Image
                src={task.assignee.avatar_url}
                alt={task.assignee.name}
                width={20}
                height={20}
                className="h-5 w-5 rounded-full object-cover ring-1 ring-white shadow-sm"
              />
            ) : (
              <div className="flex h-5 w-5 items-center justify-center rounded-full bg-violet-500/15 ring-1 ring-violet-500/25">
                <span className="text-[9px] font-bold text-violet-300">
                  {getInitials(task.assignee.name)}
                </span>
              </div>
            )}
            <span className="text-[11px] text-muted-app">{task.assignee.name}</span>
          </div>
        ) : (
          <div className="flex items-center gap-1.5">
            <div className="h-5 w-5 rounded-full border border-dashed border-surface bg-overlay-sm" />
            <span className="text-[11px] text-faint-app">Unassigned</span>
          </div>
        )}

        {task.due_date && (
          <div
            className={`flex items-center gap-1 text-[11px] font-medium ${
              overdue ? "text-rose-400" : "text-faint-app"
            }`}
          >
            <CalendarDays className="h-3 w-3" />
            <span>
              {new Date(task.due_date).toLocaleDateString(undefined, {
                month: "short",
                day: "numeric",
              })}
            </span>
          </div>
        )}
      </div>
    </div>
  );
}

export default TaskCard;
