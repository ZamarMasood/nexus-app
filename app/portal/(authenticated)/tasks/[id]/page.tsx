import { cookies } from "next/headers";
import { redirect, notFound } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  CalendarDays,
  Download,
  FileText,
  MessageCircle,
} from "lucide-react";
import {
  getPortalTaskById,
  getPortalComments,
} from "@/lib/db/portal";
import { getFilesByTaskId } from "@/lib/db/tasks";
import { CommentForm } from "./CommentForm";

const STATUS_CONFIG = {
  todo:        { label: "To Do",       bg: "bg-surface-subtle",    text: "text-muted-app",   dot: "bg-faint-app" },
  in_progress: { label: "In Progress", bg: "bg-amber-500/10",      text: "text-amber-400",   dot: "bg-amber-400" },
  done:        { label: "Done",        bg: "bg-emerald-500/10",    text: "text-emerald-400", dot: "bg-emerald-400" },
} as const;

const PRIORITY_CONFIG = {
  urgent: { label: "Urgent", bg: "bg-rose-500/10",   text: "text-rose-400"   },
  high:   { label: "High",   bg: "bg-orange-500/10", text: "text-orange-400" },
  normal: { label: "Normal", bg: "bg-sky-500/10",    text: "text-sky-400"    },
  low:    { label: "Low",    bg: "bg-surface-subtle", text: "text-faint-app"  },
} as const;

function getFileIcon(filename: string | null) {
  const ext = filename?.split(".").pop()?.toLowerCase();
  const isImage = ["png", "jpg", "jpeg", "gif", "webp", "svg"].includes(ext ?? "");
  const isPdf = ext === "pdf";
  return isPdf ? "📄" : isImage ? "🖼️" : "📎";
}

export default async function PortalTaskDetailPage({
  params,
}: {
  params: { id: string };
}) {
  const cookieStore = cookies();
  const clientId = cookieStore.get("portal_client_id")?.value;
  if (!clientId) redirect("/portal/login");

  const [task, comments, files] = await Promise.all([
    getPortalTaskById(params.id, clientId),
    getPortalComments(params.id),
    getFilesByTaskId(params.id),
  ]);

  if (!task) notFound();

  const status      = (task.status as keyof typeof STATUS_CONFIG) ?? "todo";
  const statusCfg   = STATUS_CONFIG[status] ?? STATUS_CONFIG.todo;
  const priority    = (task.priority as keyof typeof PRIORITY_CONFIG) ?? "normal";
  const priorityCfg = PRIORITY_CONFIG[priority] ?? PRIORITY_CONFIG.normal;

  return (
    <div className="mx-auto max-w-3xl p-6 sm:p-8 lg:p-10">
      {/* Back */}
      <Link
        href="/portal/tasks"
        className="mb-6 inline-flex items-center gap-1.5 text-[13px] font-medium text-faint-app hover:text-muted-app transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-500/40 rounded"
      >
        <ArrowLeft className="h-3.5 w-3.5" />
        Back to tasks
      </Link>

      {/* Task header card */}
      <div className="rounded-2xl border border-surface bg-surface-card p-6">
        {/* Badges */}
        <div className="mb-4 flex flex-wrap items-center gap-2">
          <span
            className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-[12px] font-semibold ${statusCfg.bg} ${statusCfg.text}`}
          >
            <span className={`h-1.5 w-1.5 rounded-full ${statusCfg.dot}`} />
            {statusCfg.label}
          </span>
          <span
            className={`rounded-full px-3 py-1 text-[12px] font-medium ${priorityCfg.bg} ${priorityCfg.text}`}
          >
            {priorityCfg.label}
          </span>
        </div>

        {/* Title */}
        <h1 className="text-[22px] font-bold tracking-[-0.03em] text-bright leading-snug">
          {task.title}
        </h1>

        {/* Description */}
        {task.description ? (
          <p className="mt-4 text-[14px] leading-[1.75] text-faint-app">
            {task.description}
          </p>
        ) : (
          <p className="mt-4 text-[13px] italic text-dim-app">
            No description provided.
          </p>
        )}

        {/* Meta */}
        {task.due_date && (
          <div className="mt-5 flex items-center gap-2 text-[13px] text-faint-app">
            <CalendarDays className="h-4 w-4 text-dim-app" />
            <span>
              Due{" "}
              <span className="font-semibold text-muted-app">
                {new Date(task.due_date).toLocaleDateString("en-US", {
                  month: "long",
                  day: "numeric",
                  year: "numeric",
                })}
              </span>
            </span>
          </div>
        )}
      </div>

      {/* Files section */}
      {files.length > 0 && (
        <div className="mt-4 rounded-2xl border border-surface bg-surface-card p-6">
          <div className="mb-4 flex items-center gap-2">
            <FileText className="h-4 w-4 text-violet-400" />
            <h2 className="text-[15px] font-semibold text-muted-app">
              Deliverables
            </h2>
            <span className="ml-1 rounded-full bg-violet-500/10 px-2 py-0.5 text-[11px] font-semibold text-violet-400">
              {files.length}
            </span>
          </div>
          <div className="flex flex-col gap-2">
            {files.map((file) => (
              <div
                key={file.id}
                className="flex items-center justify-between rounded-xl border border-surface bg-surface-inset px-4 py-3"
              >
                <div className="flex items-center gap-3">
                  <span className="text-lg">{getFileIcon(file.filename)}</span>
                  <span className="text-[13px] font-medium text-muted-app">
                    {file.filename ?? "Untitled file"}
                  </span>
                </div>
                {file.file_url && (
                  <a
                    href={file.file_url}
                    download
                    target="_blank"
                    rel="noopener noreferrer"
                    className={[
                      "inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5",
                      "text-[12px] font-semibold text-violet-400",
                      "bg-violet-500/10 hover:bg-violet-500 hover:text-white",
                      "transition-[background-color,color] duration-150",
                      "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-500/40",
                    ].join(" ")}
                  >
                    <Download className="h-3 w-3" />
                    Download
                  </a>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Comments section */}
      <div className="mt-4 rounded-2xl border border-surface bg-surface-card p-6">
        <div className="mb-5 flex items-center gap-2">
          <MessageCircle className="h-4 w-4 text-dim-app" />
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
          {comments.map((comment) => {
            const isClient   = comment.user_id === clientId;
            const authorName = isClient
              ? "You"
              : ((comment as Record<string, unknown>).author_name as string | null) ?? "Team";
            const initials   = authorName === "You"
              ? "Y"
              : authorName.split(" ").map((w: string) => w[0]).slice(0, 2).join("").toUpperCase();
            const date = comment.created_at
              ? new Date(comment.created_at).toLocaleDateString("en-US", {
                  month: "short", day: "numeric", hour: "2-digit", minute: "2-digit",
                })
              : "";
            return (
              <div key={comment.id} className="flex gap-3">
                <div className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full ring-2 ring-surface shadow-sm text-xs font-bold ${
                  isClient ? "bg-violet-500/15 text-violet-400" : "bg-violet-500/15 text-violet-400"
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
                  <p className="text-sm text-muted-app leading-relaxed whitespace-pre-wrap">
                    {comment.content}
                  </p>
                </div>
              </div>
            );
          })}

          {comments.length === 0 && (
            <p className="text-sm text-faint-app px-1">No comments yet. Start the conversation.</p>
          )}

          <CommentForm taskId={task.id} clientId={clientId} />
        </div>
      </div>
    </div>
  );
}
