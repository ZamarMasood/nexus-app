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
    badge: "bg-[rgba(229,72,77,0.12)] text-[#e5484d]",
    borderColor: "#e5484d",
    icon: AlertCircle,
  },
  high: {
    label: "High",
    badge: "bg-[rgba(231,157,19,0.12)] text-[#e79d13]",
    borderColor: "#e79d13",
    icon: ArrowUp,
  },
  normal: {
    label: "Normal",
    badge: "bg-[rgba(94,106,210,0.12)] text-[#5e6ad2]",
    borderColor: "#5e6ad2",
    icon: Minus,
  },
  low: {
    label: "Low",
    badge: "bg-[rgba(136,136,136,0.12)] text-[#888]",
    borderColor: "#888",
    icon: ArrowDown,
  },
} as const;

function getInitials(name: string): string {
  return name.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2);
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
        "group relative flex flex-col gap-3 rounded-lg p-4",
        "bg-[#161616] border border-[rgba(255,255,255,0.06)]",
        "border-l-[3px]",
        "select-none",
        isLocked ? "cursor-default opacity-60" : "cursor-pointer",
        isLocked ? "" : "hover:bg-[#1c1c1c]",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[rgba(94,106,210,0.35)]",
        isLocked ? "" : "active:scale-[0.99]",
        "transition-colors duration-150",
        isDragging ? "opacity-80 rotate-1 scale-[1.02] shadow-[0_8px_32px_rgba(0,0,0,0.6)]" : "",
      ].join(" ")}
      style={{ borderLeftColor: config.borderColor }}
    >
      {/* Title + priority badge */}
      <div className="flex items-start justify-between gap-3">
        <p className={[
          "text-[13px] font-medium leading-snug tracking-[-0.01em] line-clamp-2",
          isLocked ? "text-[#555]" : "text-[#f0f0f0]",
        ].join(" ")}>
          {task.title}
        </p>
        <div className="flex shrink-0 items-center gap-1.5">
          {isLocked && (
            <Lock className="h-3 w-3 text-[#3a3a3a]" />
          )}
          <span className={`inline-flex shrink-0 items-center gap-1 rounded-sm px-2 py-0.5 text-[11px] font-medium ${config.badge}`}>
            <PriorityIcon className="h-2.5 w-2.5" />
            {config.label}
          </span>
        </div>
      </div>

      {/* Description */}
      {task.description && (
        <p className="text-[12px] leading-relaxed text-[#555] line-clamp-2">
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
                className="h-5 w-5 rounded-full object-cover"
              />
            ) : (
              <div className="flex h-5 w-5 items-center justify-center rounded-full bg-[rgba(94,106,210,0.15)]">
                <span className="text-[9px] font-medium text-[#5e6ad2]">
                  {getInitials(task.assignee.name)}
                </span>
              </div>
            )}
            <span className="text-[11px] text-[#8a8a8a]">{task.assignee.name}</span>
          </div>
        ) : (
          <div className="flex items-center gap-1.5">
            <div className="h-5 w-5 rounded-full border border-dashed border-[rgba(255,255,255,0.10)]" />
            <span className="text-[11px] text-[#555]">Unassigned</span>
          </div>
        )}

        {task.due_date && (
          <div className={`flex items-center gap-1 text-[11px] font-medium ${overdue ? "text-[#e5484d]" : "text-[#555]"}`}>
            <CalendarDays className="h-3 w-3" />
            <span>
              {new Date(task.due_date).toLocaleDateString(undefined, { month: "short", day: "numeric" })}
            </span>
          </div>
        )}
      </div>
    </div>
  );
}

export default TaskCard;
