import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import Link from "next/link";
import {
  CalendarDays,
  AlertCircle,
  ArrowUp,
  Minus,
  ArrowDown,
  Users,
} from "lucide-react";
import { getPortalTasks } from "@/lib/db/portal";
import type { Task } from "@/lib/types";

// ─── Priority config (no team member names) ───────────────────────────────────

const PRIORITY_CONFIG = {
  urgent: {
    label: "Urgent",
    badge: "bg-rose-50 text-rose-600 ring-1 ring-rose-200",
    icon: AlertCircle,
    iconColor: "text-rose-500",
    border: "border-l-rose-400",
  },
  high: {
    label: "High",
    badge: "bg-orange-50 text-orange-600 ring-1 ring-orange-200",
    icon: ArrowUp,
    iconColor: "text-orange-400",
    border: "border-l-orange-400",
  },
  normal: {
    label: "Normal",
    badge: "bg-teal-50 text-teal-700 ring-1 ring-teal-200",
    icon: Minus,
    iconColor: "text-teal-400",
    border: "border-l-teal-400",
  },
  low: {
    label: "Low",
    badge: "bg-slate-100 text-slate-500 ring-1 ring-slate-200",
    icon: ArrowDown,
    iconColor: "text-slate-400",
    border: "border-l-slate-300",
  },
} as const;

const COLUMNS = [
  {
    status: "todo",
    label: "To Do",
    headerColor: "bg-slate-100 text-slate-600",
    dotColor: "bg-slate-400",
  },
  {
    status: "in_progress",
    label: "In Progress",
    headerColor: "bg-[#e6f7f5] text-[#00866b]",
    dotColor: "bg-[#00b8a0]",
  },
  {
    status: "done",
    label: "Done",
    headerColor: "bg-emerald-50 text-emerald-700",
    dotColor: "bg-emerald-500",
  },
] as const;

function isOverdue(dueDate: string | null): boolean {
  if (!dueDate) return false;
  return new Date(dueDate) < new Date(new Date().toDateString());
}

function PortalTaskCard({ task }: { task: Task }) {
  const priority = (task.priority as keyof typeof PRIORITY_CONFIG) ?? "normal";
  const config = PRIORITY_CONFIG[priority] ?? PRIORITY_CONFIG.normal;
  const PriorityIcon = config.icon;
  const overdue = isOverdue(task.due_date);

  return (
    <Link
      href={`/portal/tasks/${task.id}`}
      className={[
        "group flex flex-col gap-3 rounded-2xl border border-slate-100 bg-white p-4",
        "border-l-4",
        config.border,
        "shadow-[0_2px_8px_rgba(0,184,160,0.06),0_1px_3px_rgba(15,23,42,0.05)]",
        "hover:shadow-[0_6px_20px_rgba(0,184,160,0.12),0_2px_8px_rgba(15,23,42,0.08)]",
        "hover:-translate-y-0.5",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#00b8a0] focus-visible:ring-offset-2",
        "active:scale-[0.99]",
        "transition-[transform,box-shadow]",
      ].join(" ")}
    >
      {/* Title + priority */}
      <div className="flex items-start justify-between gap-3">
        <p className="text-[14px] font-semibold leading-snug tracking-[-0.01em] text-slate-800 line-clamp-2 group-hover:text-[#00866b]">
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
        <p className="text-[12px] leading-relaxed text-slate-400 line-clamp-2">
          {task.description}
        </p>
      )}

      {/* Footer */}
      <div className="flex items-center justify-between gap-2">
        {/* Always show "Team" — never expose assignee name */}
        <div className="flex items-center gap-1.5">
          <div className="flex h-5 w-5 items-center justify-center rounded-full bg-[#e6f7f5]">
            <Users className="h-2.5 w-2.5 text-[#00b8a0]" />
          </div>
          <span className="text-[11px] font-medium text-[#7ab5af]">Team</span>
        </div>

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
    </Link>
  );
}

export default async function PortalTasksPage() {
  const cookieStore = cookies();
  const clientId = cookieStore.get("portal_client_id")?.value;
  if (!clientId) redirect("/portal/login");

  const tasks = await getPortalTasks(clientId);

  return (
    <div className="px-8 py-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-[28px] font-bold tracking-[-0.03em] text-[#0d3330]">
          Project Tasks
        </h1>
        <p className="mt-1 text-[15px] leading-relaxed text-[#5f8a86]">
          Track the progress of your project deliverables.
        </p>
      </div>

      {/* Kanban columns */}
      {tasks.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-[#b8e0da] bg-white py-20">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#e6f7f5]">
            <CheckSquareIcon className="h-6 w-6 text-[#00b8a0]" />
          </div>
          <p className="mt-4 text-base font-semibold text-[#0d3330]">No tasks yet</p>
          <p className="mt-1 text-sm text-[#7ab5af]">
            Your project tasks will appear here once they&apos;re created.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-3 gap-5">
          {COLUMNS.map(({ status, label, headerColor, dotColor }) => {
            const columnTasks = tasks.filter((t) => t.status === status);
            return (
              <div key={status} className="flex flex-col gap-3">
                {/* Column header */}
                <div
                  className={`flex items-center gap-2 rounded-xl px-3 py-2 ${headerColor}`}
                >
                  <span className={`h-2 w-2 rounded-full ${dotColor}`} />
                  <span className="text-[13px] font-semibold">{label}</span>
                  <span
                    className={`ml-auto rounded-full px-2 py-0.5 text-[11px] font-bold ${headerColor}`}
                  >
                    {columnTasks.length}
                  </span>
                </div>

                {/* Task cards */}
                <div className="flex flex-col gap-3">
                  {columnTasks.map((task) => (
                    <PortalTaskCard key={task.id} task={task} />
                  ))}
                  {columnTasks.length === 0 && (
                    <div className="rounded-2xl border border-dashed border-slate-200 bg-white/60 px-4 py-6 text-center">
                      <p className="text-[12px] text-slate-400">No tasks</p>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

// Inline icon to avoid import collision
function CheckSquareIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <polyline points="9 11 12 14 22 4" />
      <path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11" />
    </svg>
  );
}
