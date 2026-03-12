"use client";

import Image from "next/image";
import type { Task, TeamMember } from "@/lib/types";
import { CalendarDays, AlertCircle, ArrowUp, Minus, ArrowDown } from "lucide-react";

export type TaskWithAssignee = Task & {
  assignee?: Pick<TeamMember, "name" | "avatar_url"> | null;
};

interface TaskCardProps {
  task: TaskWithAssignee;
  onClick?: (task: TaskWithAssignee) => void;
  isDragging?: boolean;
}

const PRIORITY_CONFIG = {
  urgent: {
    label: "Urgent",
    badge: "bg-rose-50 text-rose-700 ring-1 ring-rose-200",
    border: "border-l-rose-500",
    icon: AlertCircle,
    iconColor: "text-rose-500",
  },
  high: {
    label: "High",
    badge: "bg-orange-50 text-orange-700 ring-1 ring-orange-200",
    border: "border-l-orange-400",
    icon: ArrowUp,
    iconColor: "text-orange-400",
  },
  normal: {
    label: "Normal",
    badge: "bg-sky-50 text-sky-700 ring-1 ring-sky-200",
    border: "border-l-sky-400",
    icon: Minus,
    iconColor: "text-sky-400",
  },
  low: {
    label: "Low",
    badge: "bg-slate-100 text-slate-500 ring-1 ring-slate-200",
    border: "border-l-slate-300",
    icon: ArrowDown,
    iconColor: "text-slate-400",
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

export function TaskCard({ task, onClick, isDragging = false }: TaskCardProps) {
  const priority = (task.priority as keyof typeof PRIORITY_CONFIG) ?? "normal";
  const config = PRIORITY_CONFIG[priority] ?? PRIORITY_CONFIG.normal;
  const PriorityIcon = config.icon;
  const overdue = isOverdue(task.due_date);

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={() => onClick?.(task)}
      onKeyDown={(e) => e.key === "Enter" && onClick?.(task)}
      className={[
        "group relative flex flex-col gap-3 rounded-xl border border-slate-100 bg-white p-4",
        "border-l-4",
        config.border,
        "cursor-pointer select-none",
        "shadow-[0_1px_3px_rgba(15,23,42,0.06),0_2px_8px_rgba(15,23,42,0.04)]",
        "hover:shadow-[0_4px_16px_rgba(15,23,42,0.1),0_8px_24px_rgba(15,23,42,0.06)]",
        "hover:-translate-y-0.5",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-400 focus-visible:ring-offset-2",
        "active:scale-[0.99] active:shadow-[0_1px_4px_rgba(15,23,42,0.08)]",
        "transition-[transform,box-shadow,opacity]",
        isDragging ? "opacity-80 rotate-1 scale-[1.02]" : "opacity-100",
      ].join(" ")}
    >
      {/* Title + priority badge */}
      <div className="flex items-start justify-between gap-3">
        <p className="text-sm font-semibold leading-snug tracking-[-0.01em] text-slate-800 line-clamp-2 group-hover:text-slate-900">
          {task.title}
        </p>
        <span
          className={`inline-flex shrink-0 items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-medium ${config.badge}`}
        >
          <PriorityIcon className={`h-2.5 w-2.5 ${config.iconColor}`} />
          {config.label}
        </span>
      </div>

      {/* Description */}
      {task.description && (
        <p className="text-xs leading-relaxed text-slate-500 line-clamp-2">
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
              <div className="flex h-5 w-5 items-center justify-center rounded-full bg-violet-100 ring-1 ring-white shadow-sm">
                <span className="text-[9px] font-bold text-violet-600">
                  {getInitials(task.assignee.name)}
                </span>
              </div>
            )}
            <span className="text-[11px] text-slate-500">{task.assignee.name}</span>
          </div>
        ) : (
          <div className="flex items-center gap-1.5">
            <div className="h-5 w-5 rounded-full border border-dashed border-slate-300 bg-slate-50" />
            <span className="text-[11px] text-slate-400">Unassigned</span>
          </div>
        )}

        {task.due_date && (
          <div
            className={`flex items-center gap-1 text-[11px] font-medium ${
              overdue ? "text-rose-500" : "text-slate-400"
            }`}
          >
            <CalendarDays className="h-3 w-3" />
            <span>
              {new Date(task.due_date).toLocaleDateString("en-US", {
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
