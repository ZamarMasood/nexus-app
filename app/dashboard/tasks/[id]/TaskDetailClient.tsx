"use client";

import { useState, useRef, useMemo, useEffect } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
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
  Send,
  ExternalLink,
  FileText,
  Upload,
  Search,
  ListTodo,
} from "lucide-react";
import { uploadFileToTask, getTaskByIdWithAssignee, getCommentsByTaskId, getFilesByTaskId } from "@/lib/db/tasks";
import type { TaskWithAssignee, CommentWithAuthor, TaskSidebarItem } from "@/lib/db/tasks";
import type { ProjectFile, TaskStatus, TaskPriority } from "@/lib/types";
import { formatDate } from "@/lib/utils";
import { createCommentAction } from "./actions";

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

function CommentItem({ comment }: { comment: CommentWithAuthor }) {
  const authorName = comment.author_name ?? "Team Member";
  const initials = authorName.split(" ").map((w) => w[0]).slice(0, 2).join("").toUpperCase();
  const date = comment.created_at
    ? new Date(comment.created_at).toLocaleDateString("en-US", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })
    : "";

  return (
    <div className="flex gap-3">
      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-violet-500/15 ring-2 ring-surface shadow-sm">
        <span className="text-xs font-bold text-violet-400">{initials}</span>
      </div>
      <div className="flex-1 rounded-xl border border-surface bg-surface-card px-4 py-3">
        <div className="flex items-center justify-between gap-2 mb-1.5">
          <span className="text-xs font-semibold text-secondary-app">{authorName}</span>
          <span className="text-[11px] text-dim-app">{date}</span>
        </div>
        <p className="text-sm text-muted-app leading-relaxed whitespace-pre-wrap">{comment.content}</p>
      </div>
    </div>
  );
}

function FileItem({ file }: { file: ProjectFile }) {
  return (
    <a
      href={file.file_url ?? "#"}
      target="_blank"
      rel="noopener noreferrer"
      className="flex items-center gap-3 rounded-xl border border-surface bg-surface-card px-4 py-3 hover:border-violet-500/30 hover:shadow-[0_2px_8px_rgba(139,92,246,0.1)] transition-[border-color,box-shadow] group focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-400"
    >
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
      <ExternalLink className="h-3.5 w-3.5 text-faint-app group-hover:text-violet-400 transition-colors shrink-0" />
    </a>
  );
}

// ── Props & Component ────────────────────────────────────────────────────────

interface TaskDetailClientProps {
  task: TaskWithAssignee;
  initialComments: CommentWithAuthor[];
  initialFiles: ProjectFile[];
  sidebarTasks: TaskSidebarItem[];
  projectName: string | null;
}

export default function TaskDetailClient({
  task: initialTask,
  initialComments,
  initialFiles,
  sidebarTasks,
  projectName: initialProjectName,
}: TaskDetailClientProps) {
  const router = useRouter();
  const [selectedId, setSelectedId] = useState(initialTask.id);
  const [search, setSearch] = useState("");

  const [task, setTask] = useState<TaskWithAssignee>(initialTask);
  const [comments, setComments] = useState<CommentWithAuthor[]>(initialComments);
  const [files, setFiles] = useState<ProjectFile[]>(initialFiles);
  const [projectName, setProjectName] = useState<string | null>(initialProjectName);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [commentText, setCommentText] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [commentError, setCommentError] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [loadedId, setLoadedId] = useState(initialTask.id);

  const filteredSidebarTasks = useMemo(() => {
    if (!search.trim()) return sidebarTasks;
    const q = search.toLowerCase();
    return sidebarTasks.filter((t) => t.title.toLowerCase().includes(q));
  }, [sidebarTasks, search]);

  // Fetch when switching tasks via sidebar
  useEffect(() => {
    if (selectedId === loadedId) return;
    async function loadData() {
      setLoading(true);
      setError(null);
      try {
        const [t, c, f] = await Promise.all([
          getTaskByIdWithAssignee(selectedId),
          getCommentsByTaskId(selectedId),
          getFilesByTaskId(selectedId),
        ]);
        setTask(t);
        setComments(c);
        setFiles(f);
        setProjectName(null); // Will be fetched if needed
        setLoadedId(selectedId);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load task.");
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, [selectedId, loadedId]);

  function selectTask(id: string) {
    if (id === selectedId) return;
    setSelectedId(id);
    window.history.replaceState(null, "", `/dashboard/tasks/${id}`);
  }

  async function handleFileUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    setUploadError(null);
    try {
      const newFile = await uploadFileToTask(task.id, file);
      setFiles((prev) => [newFile, ...prev]);
    } catch (err) {
      setUploadError(err instanceof Error ? err.message : "Upload failed.");
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  }

  async function handleSubmitComment(e: React.FormEvent) {
    e.preventDefault();
    if (!commentText.trim() || submitting) return;
    setSubmitting(true);
    setCommentError(null);
    try {
      const newComment = await createCommentAction(task.id, commentText.trim());
      setComments((prev) => [...prev, newComment]);
      setCommentText("");
    } catch (err) {
      setCommentError(err instanceof Error ? err.message : "Failed to post comment.");
    } finally {
      setSubmitting(false);
    }
  }

  const priority = task.priority as keyof typeof PRIORITY_CONFIG | undefined;
  const priorityConfig = priority ? PRIORITY_CONFIG[priority] : null;
  const PriorityIcon = priorityConfig?.icon;
  const status = task.status as keyof typeof STATUS_CONFIG | undefined;
  const statusConfig = status ? STATUS_CONFIG[status] : null;

  const assigneeName = task.assignee?.name ?? "Unassigned";

  return (
    <div className="p-4 sm:p-6 lg:p-8">
      {/* Mobile back button */}
      <button
        onClick={() => router.push("/dashboard/tasks")}
        className="flex lg:hidden items-center gap-1.5 mb-4 rounded text-sm text-faint-app transition-colors hover:text-muted-app focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-500"
      >
        <ArrowLeft className="h-3.5 w-3.5" />
        Back to Tasks
      </button>

      <div className="flex gap-6 items-start">
        {/* ── Left sidebar — Assignee's tasks ──────────────────────── */}
        <aside className="hidden lg:flex w-[300px] shrink-0 flex-col rounded-xl border border-surface bg-surface-card overflow-hidden sticky top-6 h-[calc(100vh-112px)]">
          <div className="px-4 pt-4 pb-3 border-b border-surface/60">
            <div className="flex items-center gap-2 mb-3">
              <button
                onClick={() => router.push("/dashboard/tasks")}
                className="flex items-center justify-center h-7 w-7 rounded-lg text-faint-app hover:text-bright hover:bg-surface-subtle transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-500"
                title="Back to Tasks"
              >
                <ArrowLeft className="h-4 w-4" />
              </button>
              <h2 className="text-[15px] font-bold tracking-[-0.02em] text-bright flex items-center gap-2">
                <ListTodo className="h-4 w-4 text-violet-400" />
                {task.assignee ? `${task.assignee.name.split(" ")[0]}'s Tasks` : "All Tasks"}
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
                const isActive = t.id === selectedId;
                const isOverdue = t.due_date && tStatus !== "done" && new Date(t.due_date) < new Date();
                return (
                  <button
                    key={t.id}
                    onClick={() => selectTask(t.id)}
                    className={[
                      "w-full text-left px-4 py-3 border-b border-surface/40 last:border-0 transition-[background-color] duration-150 group",
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
                  </button>
                );
              })
            )}
          </div>
        </aside>

        {/* ── Right panel — Task detail ─────────────────────────────── */}
        <div className="flex-1 min-w-0">
          {loading ? (
            <div className="space-y-6 animate-pulse">
              {/* Skeleton: task info card */}
              <div className="rounded-xl border border-surface bg-surface-card overflow-hidden">
                <div className="px-4 sm:px-6 pt-5 sm:pt-6 pb-5">
                  <div className="flex gap-2 mb-5">
                    <div className="h-6 w-24 rounded-full bg-overlay-xs" />
                    <div className="h-6 w-18 rounded-full bg-overlay-xs" />
                  </div>
                  <div className="h-7 w-72 max-w-full rounded-md bg-overlay-xs mb-6" />
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-x-6 gap-y-4 border-t border-surface pt-5">
                    {[0, 1, 2, 3].map((i) => (
                      <div key={i} className="space-y-2">
                        <div className="h-2.5 w-14 rounded bg-white/[0.04]" />
                        <div className="h-4 w-24 rounded-md bg-overlay-xs" />
                      </div>
                    ))}
                  </div>
                  <div className="mt-6 border-t border-surface pt-5">
                    <div className="h-2.5 w-20 rounded bg-white/[0.04] mb-3" />
                    <div className="space-y-2.5">
                      <div className="h-3.5 w-full rounded-md bg-overlay-xs" />
                      <div className="h-3.5 w-4/5 rounded-md bg-overlay-xs" />
                      <div className="h-3.5 w-3/5 rounded-md bg-overlay-xs" />
                    </div>
                  </div>
                </div>
              </div>
              {/* Skeleton: attachments */}
              <div className="rounded-xl border border-surface bg-surface-card p-4 sm:p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <div className="h-4 w-4 rounded bg-overlay-xs" />
                    <div className="h-4 w-24 rounded-md bg-overlay-xs" />
                  </div>
                  <div className="h-7 w-24 rounded-lg bg-overlay-xs" />
                </div>
                <div className="h-24 rounded-xl border border-dashed border-surface bg-surface-subtle" />
              </div>
              {/* Skeleton: comments */}
              <div className="rounded-xl border border-surface bg-surface-card p-4 sm:p-6">
                <div className="flex items-center gap-2 mb-5">
                  <div className="h-4 w-4 rounded bg-overlay-xs" />
                  <div className="h-4 w-20 rounded-md bg-overlay-xs" />
                </div>
                <div className="space-y-3">
                  {[0, 1].map((i) => (
                    <div key={i} className="flex gap-3">
                      <div className="h-8 w-8 shrink-0 rounded-full bg-overlay-xs" />
                      <div className="flex-1 rounded-xl bg-white/[0.04] h-20" />
                    </div>
                  ))}
                </div>
                <div className="mt-5 flex gap-3">
                  <div className="h-8 w-8 shrink-0 rounded-full bg-overlay-xs" />
                  <div className="flex-1 h-24 rounded-xl border border-surface bg-surface-inset" />
                </div>
              </div>
            </div>
          ) : error ? (
            <div className="rounded-xl bg-rose-500/10 border border-rose-500/20 px-6 py-4 text-sm text-rose-400">
              {error}
            </div>
          ) : (
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
                  <input ref={fileInputRef} type="file" className="hidden" onChange={handleFileUpload} />
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    disabled={uploading}
                    className="ml-auto flex items-center gap-1.5 rounded-lg border border-surface bg-surface-card px-3 py-1.5 text-xs font-semibold text-muted-app hover:border-violet-500/30 hover:text-violet-400 disabled:opacity-50 disabled:cursor-not-allowed transition-[border-color,color] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-400"
                  >
                    <Upload className="h-3.5 w-3.5" />
                    {uploading ? "Uploading…" : "Upload file"}
                  </button>
                </div>
                {uploadError && (
                  <p className="mb-3 rounded-lg bg-rose-500/10 px-3 py-2 text-sm text-rose-400 ring-1 ring-rose-500/20">{uploadError}</p>
                )}
                {files.length === 0 ? (
                  <div
                    className="rounded-xl border border-dashed border-surface bg-surface-subtle px-5 py-8 text-center cursor-pointer hover:border-violet-500/30 hover:bg-violet-500/[0.03] transition-colors"
                    onClick={() => fileInputRef.current?.click()}
                  >
                    <Upload className="mx-auto h-6 w-6 text-faint-app mb-2" />
                    <p className="text-sm text-faint-app">Click to upload a file</p>
                    <p className="mt-0.5 text-xs text-dim-app">Any file type supported</p>
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
                  {comments.map((comment) => <CommentItem key={comment.id} comment={comment} />)}
                  {comments.length === 0 && (
                    <p className="text-sm text-faint-app px-1">No comments yet. Start the conversation.</p>
                  )}
                  {commentError && (
                    <p className="rounded-lg bg-rose-500/10 px-3 py-2 text-sm text-rose-400 ring-1 ring-rose-500/20">{commentError}</p>
                  )}

                  {/* Comment form */}
                  <div className="mt-2 flex gap-3">
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-violet-500/15 ring-2 ring-surface self-start mt-0.5">
                      <User className="h-4 w-4 text-violet-400" />
                    </div>
                    <form onSubmit={handleSubmitComment} className="flex-1 rounded-xl border border-surface bg-surface-inset overflow-hidden focus-within:border-violet-500/40 focus-within:shadow-[0_0_0_3px_rgba(139,92,246,0.1)] transition-[border-color,box-shadow]">
                      <textarea
                        ref={textareaRef}
                        value={commentText}
                        onChange={(e) => setCommentText(e.target.value)}
                        onKeyDown={(e) => { if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) handleSubmitComment(e); }}
                        placeholder="Add a comment…"
                        rows={2}
                        className="w-full resize-none bg-transparent px-4 py-3 text-sm text-secondary-app placeholder:text-dim-app focus:outline-none"
                      />
                      <div className="flex items-center justify-end border-t border-surface px-3 py-2">
                        <button
                          type="submit"
                          disabled={!commentText.trim() || submitting}
                          className="flex items-center gap-1.5 rounded-lg bg-violet-600 px-3 py-1.5 text-xs font-semibold text-white shadow-[0_2px_6px_rgba(139,92,246,0.3)] hover:bg-violet-700 disabled:opacity-40 disabled:cursor-not-allowed disabled:shadow-none active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-400 transition-[background-color,opacity,transform,box-shadow]"
                        >
                          <Send className="h-3 w-3" />
                          {submitting ? "Posting…" : "Comment"}
                        </button>
                      </div>
                    </form>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
