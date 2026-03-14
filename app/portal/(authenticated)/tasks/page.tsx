import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import {
  CalendarDays,
  AlertCircle,
  ArrowUp,
  Minus,
  ArrowDown,
  CheckSquare,
  ClipboardList,
  Timer,
  CheckCircle2,
} from "lucide-react";
import { getPortalTasks, type PortalTask } from "@/lib/db/portal";

const PRIORITY_CONFIG = {
  urgent: {
    label:     "Urgent",
    badge:     "bg-rose-500/10 text-rose-400 ring-1 ring-rose-500/20",
    icon:      AlertCircle,
    iconColor: "text-rose-400",
    accent:    "border-l-rose-500/80",
  },
  high: {
    label:     "High",
    badge:     "bg-orange-500/10 text-orange-400 ring-1 ring-orange-500/20",
    icon:      ArrowUp,
    iconColor: "text-orange-400",
    accent:    "border-l-orange-500/70",
  },
  normal: {
    label:     "Normal",
    badge:     "bg-sky-500/10 text-sky-400 ring-1 ring-sky-500/20",
    icon:      Minus,
    iconColor: "text-sky-400",
    accent:    "border-l-sky-500/60",
  },
  low: {
    label:     "Low",
    badge:     "bg-surface-subtle text-muted-app ring-1 ring-surface",
    icon:      ArrowDown,
    iconColor: "text-faint-app",
    accent:    "border-l-surface",
  },
} as const;

const COLUMNS = [
  {
    status:      "todo",
    label:       "To Do",
    icon:        ClipboardList,
    headerColor: "text-secondary-app",
    headerPill:  "bg-surface-subtle border border-surface",
    dotColor:    "bg-slate-400",
    dotGlow:     "shadow-[0_0_6px_rgba(148,163,184,0.7)]",
    bgColor:     "bg-overlay-sm",
    borderColor: "border-surface",
    countColor:  "text-muted-app",
    iconColor:   "text-muted-app",
  },
  {
    status:      "in_progress",
    label:       "In Progress",
    icon:        Timer,
    headerColor: "text-amber-300",
    headerPill:  "bg-amber-500/[0.12] border border-amber-500/30 shadow-[0_0_24px_rgba(251,191,36,0.1)]",
    dotColor:    "bg-amber-400",
    dotGlow:     "shadow-[0_0_8px_rgba(251,191,36,0.9)]",
    bgColor:     "bg-amber-500/[0.04]",
    borderColor: "border-amber-500/[0.12]",
    countColor:  "text-amber-400/80",
    iconColor:   "text-amber-400/70",
  },
  {
    status:      "done",
    label:       "Done",
    icon:        CheckCircle2,
    headerColor: "text-emerald-300",
    headerPill:  "bg-emerald-500/[0.12] border border-emerald-500/30 shadow-[0_0_24px_rgba(52,211,153,0.1)]",
    dotColor:    "bg-emerald-400",
    dotGlow:     "shadow-[0_0_8px_rgba(52,211,153,0.9)]",
    bgColor:     "bg-emerald-500/[0.04]",
    borderColor: "border-emerald-500/[0.12]",
    countColor:  "text-emerald-400/80",
    iconColor:   "text-emerald-400/70",
  },
] as const;

function isOverdue(dueDate: string | null): boolean {
  if (!dueDate) return false;
  return new Date(dueDate) < new Date(new Date().toDateString());
}

function PortalTaskCard({ task, delay }: { task: PortalTask; delay: number }) {
  const priority     = (task.priority as keyof typeof PRIORITY_CONFIG) ?? "normal";
  const config       = PRIORITY_CONFIG[priority] ?? PRIORITY_CONFIG.normal;
  const PriorityIcon = config.icon;
  const overdue      = isOverdue(task.due_date);

  return (
    <div className="animate-in" style={{ animationDelay: `${delay}ms` }}>
      <Link
        href={`/portal/tasks/${task.id}`}
        className={[
          "group flex flex-col gap-3 rounded-xl border border-surface bg-surface-card p-4",
          "border-l-4", config.accent,
          "shadow-[0_2px_8px_rgba(0,0,0,0.08)]",
          "hover:bg-surface-subtle hover:shadow-[0_0_28px_rgba(139,92,246,0.12),0_8px_24px_rgba(0,0,0,0.15)]",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-500/40",
          "active:scale-[0.99] hover:-translate-y-0.5",
          "transition-[background-color,border-color,box-shadow,transform] duration-150",
        ].join(" ")}
      >
        {/* Title + priority */}
        <div className="flex items-start justify-between gap-3">
          <p className="text-sm font-semibold leading-snug tracking-[-0.01em] text-secondary-app line-clamp-2 group-hover:text-bright transition-colors duration-100">
            {task.title}
          </p>
          <span className={`inline-flex shrink-0 items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-medium ${config.badge}`}>
            <PriorityIcon className={`h-2.5 w-2.5 ${config.iconColor}`} />
            {config.label}
          </span>
        </div>

        {task.description && (
          <p className="text-xs leading-relaxed text-muted-app line-clamp-2">
            {task.description}
          </p>
        )}

        <div className="flex items-center justify-between gap-2 pt-0.5 border-t border-surface">
          <div className="flex items-center gap-1.5">
            {task.assignee ? (
              <>
                {task.assignee.avatar_url ? (
                  <Image
                    src={task.assignee.avatar_url}
                    alt={task.assignee.name}
                    width={20}
                    height={20}
                    className="h-5 w-5 rounded-full object-cover ring-1 ring-violet-500/25"
                  />
                ) : (
                  <div className="flex h-5 w-5 items-center justify-center rounded-full bg-violet-500/15 ring-1 ring-violet-500/25">
                    <span className="text-[9px] font-bold text-violet-300">
                      {task.assignee.name.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2)}
                    </span>
                  </div>
                )}
                <span className="text-[11px] text-faint-app">{task.assignee.name}</span>
              </>
            ) : (
              <>
                <div className="h-5 w-5 rounded-full border border-dashed border-surface bg-overlay-sm" />
                <span className="text-[11px] text-faint-app">Unassigned</span>
              </>
            )}
          </div>
          {task.due_date && (
            <div className={`flex items-center gap-1 text-[11px] font-medium ${overdue ? "text-rose-400" : "text-faint-app"}`}>
              <CalendarDays className="h-3 w-3" />
              <span>
                {new Date(task.due_date).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
              </span>
              {overdue && <span className="text-[10px] font-semibold ml-0.5 opacity-80">· overdue</span>}
            </div>
          )}
        </div>
      </Link>
    </div>
  );
}

export default async function PortalTasksPage() {
  const cookieStore = cookies();
  const clientId    = cookieStore.get("portal_client_id")?.value;
  if (!clientId) redirect("/portal/login");

  const tasks = await getPortalTasks(clientId);

  const doneCount     = tasks.filter((t) => t.status === "done").length;
  const inProgCount   = tasks.filter((t) => t.status === "in_progress").length;
  const todoCount     = tasks.filter((t) => t.status === "todo").length;
  const completionPct = tasks.length > 0 ? Math.round((doneCount / tasks.length) * 100) : 0;

  return (
    <div className="p-6 sm:p-8 lg:p-10">

      {/* Header */}
      <div className="mb-6 animate-in" style={{ animationDelay: "0ms" }}>
        <p className="text-[11px] font-semibold uppercase tracking-widest text-dim-app mb-1">
          Your workspace
        </p>
        <div className="flex items-end justify-between gap-4 flex-wrap">
          <div>
            <h1 className="text-[28px] font-bold tracking-[-0.04em] text-bright leading-tight">
              Project Tasks
            </h1>
            <p className="mt-1 text-sm text-faint-app">
              Track the progress of your project deliverables.
            </p>
          </div>
          {tasks.length > 0 && (
            <div className="hidden sm:flex flex-col gap-1.5 shrink-0 min-w-[180px]">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-semibold uppercase tracking-widest text-dim-app">Progress</span>
                <span className="text-[11px] font-bold tabular-nums text-violet-400">{completionPct}%</span>
              </div>
              <div className="h-1.5 w-full rounded-full bg-surface-inset overflow-hidden">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-violet-500 to-violet-400 transition-[width] duration-700"
                  style={{ width: `${completionPct}%` }}
                />
              </div>
              <p className="text-[10px] text-dim-app tabular-nums">
                {doneCount} of {tasks.length} tasks complete
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Status pills */}
      {tasks.length > 0 && (
        <div className="mb-6 flex gap-2 flex-wrap animate-in" style={{ animationDelay: "80ms" }}>
          <span className="inline-flex items-center gap-1.5 rounded-full bg-surface-subtle border border-surface px-3 py-1 text-[11px] font-semibold text-secondary-app">
            <span className="tabular-nums font-bold">{todoCount}</span> To Do
          </span>
          <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-500/10 border border-amber-500/20 px-3 py-1 text-[11px] font-semibold text-amber-400">
            <span className="tabular-nums font-bold">{inProgCount}</span> In Progress
          </span>
          <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 px-3 py-1 text-[11px] font-semibold text-emerald-400">
            <span className="tabular-nums font-bold">{doneCount}</span> Done
          </span>
        </div>
      )}

      {tasks.length === 0 ? (
        <div
          className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-surface bg-surface-card py-24 animate-in"
          style={{ animationDelay: "160ms" }}
        >
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-surface-inset border border-surface mb-4">
            <CheckSquare className="h-6 w-6 text-dim-app" />
          </div>
          <p className="text-sm font-semibold text-muted-app">No tasks yet</p>
          <p className="mt-1 text-xs text-dim-app text-center max-w-xs">
            Your project tasks will appear here once they&apos;re created.
          </p>
        </div>
      ) : (
        <div className="flex justify-center gap-5 overflow-x-auto pb-6">
          {COLUMNS.map(({ status, label, icon: ColIcon, headerColor, headerPill, dotColor, dotGlow, bgColor, borderColor, countColor, iconColor }, colIndex) => {
            const columnTasks = tasks.filter((t) => t.status === status);
            return (
              <div
                key={status}
                className="flex w-[380px] shrink-0 flex-col animate-in"
                style={{ animationDelay: `${160 + colIndex * 80}ms` }}
              >
                <div className={`mb-3 flex items-center justify-between rounded-xl px-4 py-2.5 ${headerPill}`}>
                  <div className="flex items-center gap-2.5">
                    <span className={`h-2 w-2 rounded-full shrink-0 ${dotColor} ${dotGlow}`} />
                    <ColIcon className={`h-3.5 w-3.5 ${iconColor}`} />
                    <span className={`text-[13px] font-semibold tracking-[-0.01em] ${headerColor}`}>{label}</span>
                  </div>
                  <span className={`text-[12px] font-bold tabular-nums ${countColor}`}>
                    {columnTasks.length}
                  </span>
                </div>

                <div className={`flex flex-col gap-2.5 rounded-2xl p-3 min-h-[240px] border ${bgColor} ${borderColor}`}>
                  {columnTasks.map((task, taskIndex) => (
                    <PortalTaskCard
                      key={task.id}
                      task={task}
                      delay={200 + colIndex * 80 + taskIndex * 40}
                    />
                  ))}
                  {columnTasks.length === 0 && (
                    <div className="flex flex-1 items-center justify-center py-8">
                      <p className="text-xs text-faint-app select-none">No tasks</p>
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
