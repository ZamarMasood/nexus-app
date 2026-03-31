"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import Image from "next/image";
import {
  ArrowLeft,
  Layers,
  CalendarDays,
  User,
  Paperclip,
  MessageSquare,
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

const STATUS_COLORS: Record<string, { bg: string; text: string; dot: string }> = {
  todo:        { bg: "rgba(136,136,136,0.12)", text: "#888", dot: "#888" },
  in_progress: { bg: "rgba(94,106,210,0.12)",  text: "#5e6ad2", dot: "#5e6ad2" },
  done:        { bg: "rgba(38,201,127,0.12)",   text: "#26c97f", dot: "#26c97f" },
};

const PRIORITY_DOT: Record<string, string> = {
  urgent: "#e5484d",
  high:   "#e79d13",
  normal: "#5e6ad2",
  low:    "#8a8a8a",
};

function StatusBadge({ status }: { status: string }) {
  const colors = STATUS_COLORS[status] ?? STATUS_COLORS.todo;
  const label = status.replace("_", " ");
  return (
    <span
      className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md text-xs font-medium capitalize"
      style={{ background: colors.bg, color: colors.text }}
    >
      <span className="w-1.5 h-1.5 rounded-full" style={{ background: colors.dot }} />
      {label}
    </span>
  );
}

// ── Sub-components ───────────────────────────────────────────────────────────

function CommentItem({ comment, clientId }: { comment: Comment; clientId: string }) {
  const isClient = comment.user_id === clientId;
  const authorName = isClient
    ? "You"
    : ((comment as Record<string, unknown>).author_name as string | null) ?? "Team";
  const initials = authorName === "You"
    ? "Y"
    : authorName.split(" ").map((w: string) => w[0]).slice(0, 2).join("").toUpperCase();
  const raw = comment.created_at ?? "";
  const utc = raw && !raw.endsWith("Z") && !raw.includes("+") ? raw + "Z" : raw;
  const date = utc
    ? new Date(utc).toLocaleString(undefined, { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit", hour12: true })
    : "";

  return (
    <div className="flex gap-3">
      <div
        className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-[10px] font-medium ${
          isClient
            ? "bg-[rgba(94,106,210,0.15)] text-[#5e6ad2]"
            : "bg-sky-500/15 text-sky-400"
        }`}
      >
        {initials}
      </div>
      <div className="flex-1 rounded-lg border border-[rgba(255,255,255,0.06)] bg-[#161616] px-4 py-3">
        <div className="flex items-center justify-between gap-2 mb-1">
          <span className={`text-[12px] font-medium ${isClient ? "text-[#5e6ad2]" : "text-[#8a8a8a]"}`}>
            {authorName}
          </span>
          <span className="text-[11px] text-[#555]">{date}</span>
        </div>
        <p className="text-[13px] text-[#8a8a8a] leading-relaxed whitespace-pre-wrap">{comment.content}</p>
      </div>
    </div>
  );
}

function FileItem({ file }: { file: ProjectFile }) {
  return (
    <div className="flex items-center gap-3 rounded-lg border border-[rgba(255,255,255,0.06)] bg-[#161616] px-4 py-2.5 group">
      <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-[rgba(94,106,210,0.12)]">
        <FileText className="h-3.5 w-3.5 text-[#5e6ad2]" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-[13px] font-medium text-[#d4d4d4] truncate">{file.filename ?? "Unnamed file"}</p>
        {file.created_at && (
          <p className="text-[11px] text-[#555]">
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
          className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[12px] font-medium
            text-[#5e6ad2] bg-[rgba(94,106,210,0.15)]
            hover:bg-[#5e6ad2] hover:text-white
            transition-colors duration-150
            focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[rgba(94,106,210,0.35)]
            shrink-0"
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
  csrfToken: string;
}

export default function PortalTaskDetailClient({
  task,
  comments,
  files,
  sidebarTasks,
  projectName,
  clientId,
  csrfToken,
}: PortalTaskDetailClientProps) {
  const [search, setSearch] = useState("");

  const filteredSidebarTasks = useMemo(() => {
    if (!search.trim()) return sidebarTasks;
    const q = search.toLowerCase();
    return sidebarTasks.filter((t) => t.title.toLowerCase().includes(q));
  }, [sidebarTasks, search]);

  const isHighPriority = task.priority === "urgent" || task.priority === "high";

  return (
    <div className="flex flex-col h-full bg-[#0d0d0d]">

      {/* Header toolbar */}
      <div className="flex items-center justify-between px-6 h-[60px] border-b border-[rgba(255,255,255,0.06)] shrink-0">
        <div className="flex items-center gap-3">
          <Link
            href="/portal/tasks"
            className="p-1 rounded-md text-[#555] hover:text-[#8a8a8a] hover:bg-white/5
              transition-colors duration-150"
          >
            <ArrowLeft size={16} />
          </Link>
          <Layers size={16} className="text-[#555]" />
          <h1 className="text-[15px] font-medium text-[#e8e8e8] truncate">{task.title}</h1>
        </div>
        <div className="flex items-center gap-2">
          <StatusBadge status={task.status ?? "todo"} />
          {isHighPriority && (
            <div
              className="w-2 h-2 rounded-full"
              style={{ background: PRIORITY_DOT[task.priority ?? "normal"] }}
            />
          )}
        </div>
      </div>

      {/* Main content area */}
      <div className="flex-1 flex overflow-hidden">

        {/* Left sidebar — Task list */}
        <aside className="hidden lg:flex w-[280px] shrink-0 flex-col border-r border-[rgba(255,255,255,0.06)] bg-[#0d0d0d]">
          <div className="px-4 py-3 border-b border-[rgba(255,255,255,0.06)]">
            <div className="relative">
              <Search className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-[#555]" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search tasks…"
                className="w-full rounded-md bg-[#111111] border border-[rgba(255,255,255,0.08)]
                  pl-9 pr-3 py-1.5 text-[13px] text-[#f0f0f0] placeholder:text-[#555]
                  focus:outline-none focus:border-[rgba(94,106,210,0.5)]
                  transition-colors duration-150"
              />
            </div>
          </div>

          <div className="flex-1 overflow-y-auto">
            {filteredSidebarTasks.length === 0 ? (
              <div className="flex flex-col items-center justify-center gap-2 py-12 text-center px-4">
                <ListTodo className="h-5 w-5 text-[#555]" />
                <p className="text-[12px] text-[#555]">No tasks found</p>
              </div>
            ) : (
              filteredSidebarTasks.map((t) => {
                const isActive = t.id === task.id;
                const tStatus = t.status ?? "todo";
                const colors = STATUS_COLORS[tStatus] ?? STATUS_COLORS.todo;

                return (
                  <Link
                    key={t.id}
                    href={`/portal/tasks/${t.id}`}
                    className={[
                      "block px-4 py-2.5 border-b border-[rgba(255,255,255,0.06)] last:border-0",
                      "transition-colors duration-150",
                      isActive
                        ? "bg-white/[0.08]"
                        : "hover:bg-[#1c1c1c]",
                    ].join(" ")}
                  >
                    <p className={`text-[13px] truncate ${isActive ? "text-[#e8e8e8]" : "text-[#d4d4d4]"}`}>
                      {t.title}
                    </p>
                    <div className="flex items-center gap-2 mt-1">
                      <StatusBadge status={tStatus} />
                      {t.due_date && (
                        <span className="text-[11px] text-[#555]">
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

        {/* Right panel — Task detail */}
        <div className="flex-1 overflow-y-auto">
          <div className="p-6 space-y-6">

            {/* Task info card */}
            <div className="rounded-xl border border-[rgba(255,255,255,0.06)] bg-[#111111] overflow-hidden">
              <div className="px-6 py-5">
                <h2 className="text-[18px] font-medium text-[#e8e8e8] tracking-[-0.02em] mb-5">
                  {task.title}
                </h2>

                {/* Meta grid */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 border-t border-[rgba(255,255,255,0.06)] pt-5">
                  <div>
                    <p className="text-[11px] font-medium text-[#555] uppercase tracking-[0.06em] mb-1.5">
                      Assignee
                    </p>
                    {task.assignee ? (
                      <div className="flex items-center gap-2">
                        {task.assignee.avatar_url ? (
                          <Image
                            src={task.assignee.avatar_url}
                            alt={task.assignee.name}
                            width={20}
                            height={20}
                            className="h-5 w-5 rounded-full object-cover"
                          />
                        ) : (
                          <div className="w-5 h-5 rounded-full bg-[rgba(94,106,210,0.15)] flex items-center justify-center">
                            <span className="text-[8px] font-medium text-[#5e6ad2]">
                              {task.assignee.name.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2)}
                            </span>
                          </div>
                        )}
                        <span className="text-[13px] text-[#8a8a8a]">{task.assignee.name}</span>
                      </div>
                    ) : (
                      <div className="flex items-center gap-2 text-[13px] text-[#555]">
                        <User className="h-4 w-4" /> Unassigned
                      </div>
                    )}
                  </div>

                  <div>
                    <p className="text-[11px] font-medium text-[#555] uppercase tracking-[0.06em] mb-1.5">
                      Project
                    </p>
                    <span className="text-[13px] text-[#8a8a8a]">{projectName ?? "—"}</span>
                  </div>

                  <div>
                    <p className="text-[11px] font-medium text-[#555] uppercase tracking-[0.06em] mb-1.5">
                      Due Date
                    </p>
                    {task.due_date ? (
                      <div className="flex items-center gap-1.5 text-[13px] text-[#8a8a8a]">
                        <CalendarDays className="h-3.5 w-3.5 text-[#555]" />
                        {formatDate(task.due_date)}
                      </div>
                    ) : (
                      <span className="text-[13px] text-[#555]">No due date</span>
                    )}
                  </div>

                  <div>
                    <p className="text-[11px] font-medium text-[#555] uppercase tracking-[0.06em] mb-1.5">
                      Created
                    </p>
                    <span className="text-[13px] text-[#8a8a8a]">
                      {task.created_at ? formatDate(task.created_at) : "—"}
                    </span>
                  </div>
                </div>

                {/* Description */}
                {task.description && (
                  <div className="mt-5 border-t border-[rgba(255,255,255,0.06)] pt-5">
                    <p className="text-[11px] font-medium text-[#555] uppercase tracking-[0.06em] mb-2">
                      Description
                    </p>
                    <p className="text-[13px] text-[#8a8a8a] leading-relaxed whitespace-pre-wrap">
                      {task.description}
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* Attachments */}
            <div className="rounded-xl border border-[rgba(255,255,255,0.06)] bg-[#111111] overflow-hidden">
              <div className="flex items-center gap-2 px-6 py-3 border-b border-[rgba(255,255,255,0.06)]">
                <Paperclip className="h-4 w-4 text-[#555]" />
                <h3 className="text-[13px] font-medium text-[#e8e8e8]">Attachments</h3>
                {files.length > 0 && (
                  <span className="text-[11px] text-[#555]">{files.length}</span>
                )}
              </div>
              <div className="p-4">
                {files.length === 0 ? (
                  <p className="text-[13px] text-[#555] text-center py-4">No attachments yet</p>
                ) : (
                  <div className="grid gap-2 sm:grid-cols-2">
                    {files.map((file) => (
                      <FileItem key={file.id} file={file} />
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Comments */}
            <div className="rounded-xl border border-[rgba(255,255,255,0.06)] bg-[#111111] overflow-hidden">
              <div className="flex items-center gap-2 px-6 py-3 border-b border-[rgba(255,255,255,0.06)]">
                <MessageSquare className="h-4 w-4 text-[#555]" />
                <h3 className="text-[13px] font-medium text-[#e8e8e8]">Comments</h3>
                {comments.length > 0 && (
                  <span className="text-[11px] text-[#555]">{comments.length}</span>
                )}
              </div>
              <div className="p-4">
                <div className="flex flex-col gap-3">
                  {comments.map((comment) => (
                    <CommentItem key={comment.id} comment={comment} clientId={clientId} />
                  ))}
                  {comments.length === 0 && (
                    <p className="text-[13px] text-[#555] px-1">No comments yet. Start the conversation.</p>
                  )}
                  <CommentForm taskId={task.id} clientId={clientId} csrfToken={csrfToken} />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
