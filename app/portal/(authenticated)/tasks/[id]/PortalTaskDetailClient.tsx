"use client";

import { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import {
  ArrowLeft,
  AlertCircle,
  ArrowUp,
  Minus,
  ArrowDown,
  CalendarDays,
  User,
  Paperclip,
  MessageSquare,
  ExternalLink,
  FileText,
  Download,
  Search,
  ListTodo,
} from "lucide-react";
import type { PortalTask } from "@/lib/db/portal";
import type { ProjectFile, Comment, TaskStatus, TaskPriority } from "@/lib/types";
import { formatDate } from "@/lib/utils";
import { CommentForm } from "./CommentForm";

// ── Config ───────────────────────────────────────────────────────────────────

const PRIORITY_CONFIG: Record<string, { label: string; badge: string; icon: typeof AlertCircle; iconColor: string }> = {
  urgent: { label: "Urgent", badge: "bg-rose-500/10 text-rose-400 ring-1 ring-rose-500/20", icon: AlertCircle, iconColor: "text-rose-400" },
  high:   { label: "High",   badge: "bg-orange-500/10 text-orange-400 ring-1 ring-orange-500/20", icon: ArrowUp, iconColor: "text-orange-400" },
  normal: { label: "Normal", badge: "bg-sky-500/10 text-sky-400 ring-1 ring-sky-500/20", icon: Minus, iconColor: "text-sky-400" },
  low:    { label: "Low",    badge: "bg-surface-subtle text-muted-app ring-1 ring-surface", icon: ArrowDown, iconColor: "text-faint-app" },
};

const STATUS_CONFIG: Record<string, { label: string; badge: string; dot: string }> = {
  todo:        { label: "To Do",       badge: "bg-surface-subtle text-secondary-app ring-1 ring-surface", dot: "bg-slate-400" },
  in_progress: { label: "In Progress", badge: "bg-amber-400/10 text-amber-400 ring-1 ring-amber-400/20", dot: "bg-amber-400" },
  done:        { label: "Done",        badge: "bg-emerald-400/10 text-emerald-400 ring-1 ring-emerald-400/20", dot: "bg-emerald-400" },
};

// ── Sub-components ───────────────────────────────────────────────────────────

function CommentItem({ comment, clientId }: { comment: Comment; clientId: string }) {
  const isClient = comment.user_id === clientId;
  const authorName = isClient
    ? "You"
    : ((comment as Record<string, unknown>).author_name as string | null) ?? "Team";
  const initials = authorName === "You"
    ? "Y"
    : authorName.split(" ").map((w: string) => w[0]).slice(0, 2).join("").toUpperCase();
  const date = comment.created_at
    ? new Date(comment.created_at).toLocaleDateString("en-US", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })
    : "";

  return (
    <div className="flex gap-3">
      <div className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full ring-2 ring-surface shadow-sm text-xs font-bold ${
        isClient ? "bg-violet-500/15 text-violet-400" : "bg-sky-500/15 text-sky-400"
      }`}>
        {initials}
      </div>
      <div className="flex-1 rounded-xl border border-surface bg-surface-card px-4 py-3">
        <div className="flex items-center justify-between gap-2 mb-1.5">
          <span className={`text-xs font-semibold ${isClient ? "text-violet-400" : "text-secondary-app"}`}>
            {authorName}
          </span>
          <span className="text-[11px] text-dim-app">{date}</span>
        </div>
        <p className="text-sm text-muted-app leading-relaxed whitespace-pre-wrap">{comment.content}</p>
      </div>
    </div>
  );
}

function FileItem({ file }: { file: ProjectFile }) {
  return (
    <div className="flex items-center gap-3 rounded-xl border border-surface bg-surface-card px-4 py-3 group">
      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-violet-500/15 ring-1 ring-violet-500/20">
        <FileText className="h-4 w-4 text-violet-400" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-secondary-app truncate">{file.filename ?? "Unnamed file"}</p>
        {file.created_at && (
          <p className="text-[11px] text-dim-app">
            {new Date(file.created_at).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
          </p>
        )}
      </div>
      {file.file_url && (
        <a
          href={file.file_url}
          download
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-[12px] font-semibold text-violet-400 bg-violet-500/10 hover:bg-violet-500 hover:text-white transition-[background-color,color] duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-500/40 shrink-0"
        >
          <Download className="h-3 w-3" />
          Download
        </a>
      )}
    </div>
  );
}

// ── Props & Component ────────────────────────────────────────────────────────

interface PortalTaskDetailClientProps {
  task: PortalTask;
  comments: Comment[];
  files: ProjectFile[];
  sidebarTasks: PortalTask[];
  projectName: string | null;
  clientId: string;
}

export default function PortalTaskDetailClient({
  task,
  comments,
  files,
  sidebarTasks,
  projectName,
  clientId,
}: PortalTaskDetailClientProps) {
  const router = useRouter();
  const [search, setSearch] = useState("");

  const filteredSidebarTasks = useMemo(() => {
    if (!search.trim()) return sidebarTasks;
    const q = search.toLowerCase();
    return sidebarTasks.filter((t) => t.title.toLowerCase().includes(q));
  }, [sidebarTasks, search]);

  const priority = task.priority as keyof typeof PRIORITY_CONFIG | undefined;
  const priorityConfig = priority ? PRIORITY_CONFIG[priority] : null;
  const PriorityIcon = priorityConfig?.icon;
  const status = task.status as keyof typeof STATUS_CONFIG | undefined;
  const statusConfig = status ? STATUS_CONFIG[status] : null;

  return (
    <div className="p-4 sm:p-6 lg:p-8">
      {/* Mobile back button */}
      <Link
        href="/portal/tasks"
        className="flex lg:hidden items-center gap-1.5 mb-4 rounded text-sm text-faint-app transition-colors hover:text-muted-app focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-500"
      >
        <ArrowLeft className="h-3.5 w-3.5" />
        Back to tasks
      </Link>

      <div className="flex gap-6 items-start">
        {/* ── Left sidebar — Client's tasks ──────────────────────── */}
        <aside className="hidden lg:flex w-[300px] shrink-0 flex-col rounded-xl border border-surface bg-surface-card overflow-hidden sticky top-6 h-[calc(100vh-112px)]">
          <div className="px-4 pt-4 pb-3 border-b border-surface/60">
            <div className="flex items-center gap-2 mb-3">
              <Link
                href="/portal/tasks"
                className="flex items-center justify-center h-7 w-7 rounded-lg text-faint-app hover:text-bright hover:bg-surface-subtle transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-500"
                title="Back to Tasks"
              >
                <ArrowLeft className="h-4 w-4" />
              </Link>
              <h2 className="text-[15px] font-bold tracking-[-0.02em] text-bright flex items-center gap-2">
                <ListTodo className="h-4 w-4 text-violet-400" />
                My Tasks
              </h2>
            </div>
            <div className="relative">
              <Search className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-app" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search tasks…"
                className="w-full rounded-lg bg-surface-subtle border border-surface pl-9 pr-3 py-2 text-[13px] text-primary-app placeholder:text-muted-app outline-none focus:border-violet-500/40 transition-[border-color] duration-150"
              />
            </div>
          </div>

          <div className="flex-1 overflow-y-auto">
            {filteredSidebarTasks.length === 0 ? (
              <div className="flex flex-col items-center justify-center gap-2 py-12 text-center px-4">
                <ListTodo className="h-5 w-5 text-faint-app" />
                <p className="text-xs text-dim-app">No tasks found</p>
              </div>
            ) : (
              filteredSidebarTasks.map((t) => {
                const tStatus = (t.status ?? "todo") as TaskStatus;
                const tPriority = (t.priority ?? "normal") as TaskPriority;
                const tStatusCfg = STATUS_CONFIG[tStatus] ?? STATUS_CONFIG.todo;
                const tPriorityCfg = PRIORITY_CONFIG[tPriority] ?? PRIORITY_CONFIG.normal;
                const isActive = t.id === task.id;
                const isOverdue = t.due_date && tStatus !== "done" && new Date(t.due_date) < new Date();
                return (
                  <Link
                    key={t.id}
                    href={`/portal/tasks/${t.id}`}
                    className={[
                      "w-full text-left px-4 py-3 border-b border-surface/40 last:border-0 transition-[background-color] duration-150 group block",
                      "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-violet-500",
                      isActive ? "bg-violet-500/[0.08]" : "hover:bg-overlay-xs",
                    ].join(" ")}
                  >
                    <div className="flex items-center justify-between gap-2 mb-1">
                      <span
                        className={[
                          "text-[13px] font-semibold truncate",
                          isActive ? "text-violet-400" : "text-primary-app group-hover:text-violet-400",
                        ].join(" ")}
                      >
                        {t.title}
                      </span>
                    </div>
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-medium capitalize ${tStatusCfg.badge}`}>
                        <span className={`h-1.5 w-1.5 rounded-full ${tStatusCfg.dot}`} />
                        {tStatusCfg.label}
                      </span>
                      <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-medium ${tPriorityCfg.badge}`}>
                        {tPriorityCfg.label}
                      </span>
                      {t.due_date && (
                        <span className={`text-[11px] ${isOverdue ? "text-rose-400" : "text-dim-app"}`}>
                          {formatDate(t.due_date)}
                        </span>
                      )}
                    </div>
                  </Link>
                );
              })
            )}
          </div>
        </aside>

        {/* ── Right panel — Task detail ─────────────────────────────── */}
        <div className="flex-1 min-w-0">
          <div className="space-y-6 animate-in">
            {/* Task info card */}
            <div className="overflow-hidden rounded-xl bg-surface-card border border-surface">
              <div className="px-4 sm:px-6 pt-5 sm:pt-6 pb-5">
                <div className="flex flex-wrap items-center gap-2 mb-5">
                  {statusConfig && (
                    <span className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold ${statusConfig.badge}`}>
                      <span className={`h-1.5 w-1.5 rounded-full ${statusConfig.dot}`} />
                      {statusConfig.label}
                    </span>
                  )}
                  {priorityConfig && PriorityIcon && (
                    <span className={`inline-flex items-center gap-1 rounded-full px-3 py-1 text-xs font-semibold ${priorityConfig.badge}`}>
                      <PriorityIcon className={`h-3 w-3 ${priorityConfig.iconColor}`} />
                      {priorityConfig.label}
                    </span>
                  )}
                </div>

                <h1 className="font-display text-xl sm:text-2xl font-bold tracking-[-0.03em] text-bright leading-tight mb-6">
                  {task.title}
                </h1>

                {/* Meta row */}
                <div className="grid grid-cols-2 gap-x-6 gap-y-4 sm:grid-cols-4 border-t border-surface pt-5">
                  <div>
                    <p className="text-[11px] font-semibold uppercase tracking-wide text-dim-app mb-1.5">Assignee</p>
                    {task.assignee ? (
                      <div className="flex items-center gap-2">
                        {task.assignee.avatar_url ? (
                          <Image src={task.assignee.avatar_url} alt={task.assignee.name} width={24} height={24} className="h-6 w-6 rounded-full object-cover" />
                        ) : (
                          <div className="flex h-6 w-6 items-center justify-center rounded-full bg-violet-500/15">
                            <span className="text-[10px] font-bold text-violet-400">
                              {task.assignee.name.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2)}
                            </span>
                          </div>
                        )}
                        <span className="text-sm text-secondary-app">{task.assignee.name}</span>
                      </div>
                    ) : (
                      <div className="flex items-center gap-2 text-sm text-faint-app">
                        <User className="h-4 w-4" /> Unassigned
                      </div>
                    )}
                  </div>

                  <div>
                    <p className="text-[11px] font-semibold uppercase tracking-wide text-dim-app mb-1.5">Project</p>
                    <span className="text-sm text-secondary-app">{projectName ?? "—"}</span>
                  </div>

                  <div>
                    <p className="text-[11px] font-semibold uppercase tracking-wide text-dim-app mb-1.5">Due Date</p>
                    {task.due_date ? (
                      <div className="flex items-center gap-1.5 text-sm text-secondary-app">
                        <CalendarDays className="h-4 w-4 text-dim-app" />
                        {formatDate(task.due_date)}
                      </div>
                    ) : (
                      <span className="text-sm text-faint-app">No due date</span>
                    )}
                  </div>

                  <div>
                    <p className="text-[11px] font-semibold uppercase tracking-wide text-dim-app mb-1.5">Created</p>
                    <span className="text-sm text-secondary-app">
                      {task.created_at ? formatDate(task.created_at) : "—"}
                    </span>
                  </div>
                </div>

                {/* Description */}
                {task.description && (
                  <div className="mt-6 border-t border-surface pt-5">
                    <p className="text-[11px] font-semibold uppercase tracking-wide text-dim-app mb-3">Description</p>
                    <p className="text-sm text-muted-app leading-relaxed whitespace-pre-wrap">{task.description}</p>
                  </div>
                )}
              </div>
            </div>

            {/* Attachments */}
            <div className="overflow-hidden rounded-xl bg-surface-card border border-surface p-4 sm:p-6">
              <div className="flex items-center gap-2 mb-4">
                <Paperclip className="h-4 w-4 text-dim-app" />
                <h2 className="text-sm font-semibold text-secondary-app">
                  Attachments
                  {files.length > 0 && (
                    <span className="ml-1.5 inline-flex h-5 min-w-[20px] items-center justify-center rounded-full bg-overlay-xs px-1.5 text-[11px] font-semibold text-muted-app">
                      {files.length}
                    </span>
                  )}
                </h2>
              </div>
              {files.length === 0 ? (
                <div className="rounded-xl border border-dashed border-surface bg-surface-subtle px-5 py-8 text-center">
                  <Paperclip className="mx-auto h-6 w-6 text-faint-app mb-2" />
                  <p className="text-sm text-faint-app">No attachments yet</p>
                  <p className="mt-0.5 text-xs text-dim-app">Files will appear here when uploaded by the team</p>
                </div>
              ) : (
                <div className="grid gap-2 sm:grid-cols-2">
                  {files.map((file) => <FileItem key={file.id} file={file} />)}
                </div>
              )}
            </div>

            {/* Comments */}
            <div className="rounded-xl border border-surface bg-surface-card p-4 sm:p-6">
              <div className="flex items-center gap-2 mb-5">
                <MessageSquare className="h-4 w-4 text-dim-app" />
                <h2 className="text-sm font-semibold text-secondary-app">Comments</h2>
                {comments.length > 0 && (
                  <span className="ml-1 inline-flex h-5 min-w-[20px] items-center justify-center rounded-full bg-overlay-xs px-1.5 text-[11px] font-semibold text-muted-app">
                    {comments.length}
                  </span>
                )}
              </div>

              <div className="flex flex-col gap-3">
                {comments.map((comment) => (
                  <CommentItem key={comment.id} comment={comment} clientId={clientId} />
                ))}
                {comments.length === 0 && (
                  <p className="text-sm text-faint-app px-1">No comments yet. Start the conversation.</p>
                )}

                <CommentForm taskId={task.id} clientId={clientId} />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
