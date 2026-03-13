"use client";

import { useEffect, useState, useRef } from "react";
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
} from "lucide-react";
import {
  getTaskByIdWithAssignee,
  getCommentsByTaskId,
  getFilesByTaskId,
  uploadFileToTask,
} from "@/lib/db/tasks";
import type { TaskWithAssignee, CommentWithAuthor } from "@/lib/db/tasks";
import type { ProjectFile } from "@/lib/types";
import { createCommentAction } from "./actions";

// ── Priority config ───────────────────────────────────────────────────────────

const PRIORITY_CONFIG = {
  urgent: {
    label: "Urgent",
    badge: "bg-rose-500/10 text-rose-400 ring-1 ring-rose-500/20",
    icon: AlertCircle,
    iconColor: "text-rose-400",
  },
  high: {
    label: "High",
    badge: "bg-orange-500/10 text-orange-400 ring-1 ring-orange-500/20",
    icon: ArrowUp,
    iconColor: "text-orange-400",
  },
  normal: {
    label: "Normal",
    badge: "bg-sky-500/10 text-sky-400 ring-1 ring-sky-500/20",
    icon: Minus,
    iconColor: "text-sky-400",
  },
  low: {
    label: "Low",
    badge: "bg-surface-subtle text-muted-app ring-1 ring-surface",
    icon: ArrowDown,
    iconColor: "text-faint-app",
  },
} as const;

const STATUS_CONFIG = {
  todo:        { label: "To Do",       badge: "bg-surface-subtle text-muted-app" },
  in_progress: { label: "In Progress", badge: "bg-amber-500/10 text-amber-400" },
  done:        { label: "Done",        badge: "bg-emerald-500/10 text-emerald-400" },
} as const;

// ── Skeleton ──────────────────────────────────────────────────────────────────

function DetailSkeleton() {
  return (
    <div className="flex flex-col gap-8 animate-pulse">
      <div className="h-8 w-2/3 rounded-lg bg-overlay-xs" />
      <div className="flex gap-3">
        <div className="h-6 w-20 rounded-full bg-overlay-xs" />
        <div className="h-6 w-20 rounded-full bg-overlay-xs" />
        <div className="h-6 w-32 rounded-full bg-overlay-xs" />
      </div>
      <div className="space-y-2">
        <div className="h-3 w-full rounded bg-overlay-xs" />
        <div className="h-3 w-full rounded bg-overlay-xs" />
        <div className="h-3 w-3/4 rounded bg-overlay-xs" />
      </div>
    </div>
  );
}

// ── Comment item ──────────────────────────────────────────────────────────────

function CommentItem({ comment }: { comment: CommentWithAuthor }) {
  const authorName = comment.author_name ?? "Team Member";
  const initials   = authorName
    .split(" ")
    .map((w) => w[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

  const date = comment.created_at
    ? new Date(comment.created_at).toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      })
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
        <p className="text-sm text-muted-app leading-relaxed whitespace-pre-wrap">
          {comment.content}
        </p>
      </div>
    </div>
  );
}

// ── File item ─────────────────────────────────────────────────────────────────

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
            {new Date(file.created_at).toLocaleDateString("en-US", {
              month: "short",
              day: "numeric",
            })}
          </p>
        )}
      </div>
      <ExternalLink className="h-3.5 w-3.5 text-faint-app group-hover:text-violet-400 transition-colors shrink-0" />
    </a>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default function TaskDetailPage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const [task, setTask] = useState<TaskWithAssignee | null>(null);
  const [comments, setComments] = useState<CommentWithAuthor[]>([]);
  const [files, setFiles] = useState<ProjectFile[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [commentText, setCommentText] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [commentError, setCommentError] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    async function load() {
      try {
        const [taskData, commentData, fileData] = await Promise.all([
          getTaskByIdWithAssignee(params.id),
          getCommentsByTaskId(params.id),
          getFilesByTaskId(params.id),
        ]);
        setTask(taskData);
        setComments(commentData);
        setFiles(fileData);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load task");
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [params.id]);

  async function handleFileUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    setUploadError(null);
    try {
      const newFile = await uploadFileToTask(params.id, file);
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
      const newComment = await createCommentAction(params.id, commentText.trim());
      setComments((prev) => [...prev, newComment]);
      setCommentText("");
    } catch (err) {
      setCommentError(err instanceof Error ? err.message : "Failed to post comment.");
    } finally {
      setSubmitting(false);
    }
  }

  const priority = task?.priority as keyof typeof PRIORITY_CONFIG | undefined;
  const priorityConfig = priority ? PRIORITY_CONFIG[priority] ?? PRIORITY_CONFIG.normal : null;
  const PriorityIcon = priorityConfig?.icon;

  const status = task?.status as keyof typeof STATUS_CONFIG | undefined;
  const statusConfig = status ? STATUS_CONFIG[status] ?? STATUS_CONFIG.todo : null;

  return (
    <div className="mx-auto max-w-4xl p-6 sm:p-8 lg:p-10">
      {/* Back nav */}
      <button
        onClick={() => router.back()}
        className="mb-6 flex items-center gap-1.5 text-sm text-faint-app hover:text-secondary-app transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-400 rounded"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to tasks
      </button>

      {loading ? (
        <DetailSkeleton />
      ) : error ? (
        <div className="rounded-xl border border-rose-500/20 bg-rose-500/10 px-5 py-4 text-sm text-rose-400">
          {error}
        </div>
      ) : task ? (
        <div className="flex flex-col gap-8">
          {/* Title + meta */}
          <div className="rounded-2xl border border-surface bg-surface-card p-7">
            <div className="flex flex-wrap items-center gap-2 mb-5">
              {statusConfig && (
                <span className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${statusConfig.badge}`}>
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

            <h1 className="text-2xl font-bold tracking-[-0.03em] text-bright leading-tight mb-6">
              {task.title}
            </h1>

            {/* Meta row */}
            <div className="grid grid-cols-2 gap-x-8 gap-y-4 sm:grid-cols-3 border-t border-surface pt-5">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-dim-app mb-1.5">Assignee</p>
                {task.assignee ? (
                  <div className="flex items-center gap-2">
                    {task.assignee.avatar_url ? (
                      <Image
                        src={task.assignee.avatar_url}
                        alt={task.assignee.name}
                        width={24}
                        height={24}
                        className="h-6 w-6 rounded-full object-cover"
                      />
                    ) : (
                      <div className="flex h-6 w-6 items-center justify-center rounded-full bg-violet-500/15">
                        <span className="text-[10px] font-bold text-violet-400">
                          {task.assignee.name.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2)}
                        </span>
                      </div>
                    )}
                    <span className="text-sm text-secondary-app">{task.assignee.name}</span>
                    {task.assignee.role && (
                      <span className="text-xs text-dim-app">· {task.assignee.role}</span>
                    )}
                  </div>
                ) : (
                  <div className="flex items-center gap-2 text-sm text-faint-app">
                    <User className="h-4 w-4" />
                    Unassigned
                  </div>
                )}
              </div>

              <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-dim-app mb-1.5">Due Date</p>
                {task.due_date ? (
                  <div className="flex items-center gap-1.5 text-sm text-secondary-app">
                    <CalendarDays className="h-4 w-4 text-dim-app" />
                    {new Date(task.due_date).toLocaleDateString("en-US", {
                      weekday: "short",
                      month: "short",
                      day: "numeric",
                      year: "numeric",
                    })}
                  </div>
                ) : (
                  <span className="text-sm text-faint-app">No due date</span>
                )}
              </div>

              <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-dim-app mb-1.5">Created</p>
                <span className="text-sm text-secondary-app">
                  {task.created_at
                    ? new Date(task.created_at).toLocaleDateString("en-US", {
                        month: "short",
                        day: "numeric",
                        year: "numeric",
                      })
                    : "—"}
                </span>
              </div>
            </div>

            {/* Description */}
            {task.description && (
              <div className="mt-6 border-t border-surface pt-5">
                <p className="text-xs font-semibold uppercase tracking-wider text-dim-app mb-3">Description</p>
                <p className="text-sm text-muted-app leading-relaxed whitespace-pre-wrap">{task.description}</p>
              </div>
            )}
          </div>

          {/* File attachments */}
          <div>
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
              <input
                ref={fileInputRef}
                type="file"
                className="hidden"
                onChange={handleFileUpload}
              />
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
              <p className="mb-3 rounded-lg bg-rose-500/10 px-3 py-2 text-sm text-rose-400 ring-1 ring-rose-500/20">
                {uploadError}
              </p>
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
                {files.map((file) => (
                  <FileItem key={file.id} file={file} />
                ))}
              </div>
            )}
          </div>

          {/* Comments */}
          <div className="rounded-2xl border border-surface bg-surface-card p-6">
            <div className="flex items-center gap-2 mb-5">
              <MessageSquare className="h-4 w-4 text-dim-app" />
              <h2 className="text-sm font-semibold text-secondary-app">
                Comments
              </h2>
              {comments.length > 0 && (
                <span className="ml-1 inline-flex h-5 min-w-[20px] items-center justify-center rounded-full bg-overlay-xs px-1.5 text-[11px] font-semibold text-muted-app">
                  {comments.length}
                </span>
              )}
            </div>

            <div className="flex flex-col gap-3">
              {comments.map((comment) => (
                <CommentItem key={comment.id} comment={comment} />
              ))}

              {comments.length === 0 && (
                <p className="text-sm text-faint-app px-1">No comments yet. Start the conversation.</p>
              )}

              {commentError && (
                <p className="rounded-lg bg-rose-500/10 px-3 py-2 text-sm text-rose-400 ring-1 ring-rose-500/20">
                  {commentError}
                </p>
              )}

              {/* Comment form */}
              <div className="mt-2 flex gap-3">
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-violet-500/15 ring-2 ring-surface self-start mt-0.5">
                  <User className="h-4 w-4 text-violet-400" />
                </div>
                <form
                  onSubmit={handleSubmitComment}
                  className="flex-1 rounded-xl border border-surface bg-surface-inset overflow-hidden focus-within:border-violet-500/40 focus-within:shadow-[0_0_0_3px_rgba(139,92,246,0.1)] transition-[border-color,box-shadow]"
                >
                  <textarea
                    ref={textareaRef}
                    value={commentText}
                    onChange={(e) => setCommentText(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
                        handleSubmitComment(e);
                      }
                    }}
                    placeholder="Add a comment… (⌘↵ to send)"
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
      ) : null}
    </div>
  );
}
