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
  todo: { label: "To Do", className: "bg-slate-100 text-slate-600" },
  in_progress: {
    label: "In Progress",
    className: "bg-[#e6f7f5] text-[#00866b]",
  },
  done: { label: "Done", className: "bg-emerald-50 text-emerald-700" },
} as const;

const PRIORITY_CONFIG = {
  urgent: { label: "Urgent", className: "bg-rose-50 text-rose-600 ring-1 ring-rose-200" },
  high: { label: "High", className: "bg-orange-50 text-orange-600 ring-1 ring-orange-200" },
  normal: { label: "Normal", className: "bg-teal-50 text-teal-700 ring-1 ring-teal-200" },
  low: { label: "Low", className: "bg-slate-100 text-slate-500 ring-1 ring-slate-200" },
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

  const status =
    (task.status as keyof typeof STATUS_CONFIG) ?? "todo";
  const statusCfg = STATUS_CONFIG[status] ?? STATUS_CONFIG.todo;
  const priority =
    (task.priority as keyof typeof PRIORITY_CONFIG) ?? "normal";
  const priorityCfg = PRIORITY_CONFIG[priority] ?? PRIORITY_CONFIG.normal;

  return (
    <div className="mx-auto max-w-3xl px-8 py-8">
      {/* Back */}
      <Link
        href="/portal/tasks"
        className="mb-6 inline-flex items-center gap-1.5 text-[13px] font-medium text-[#7ab5af] hover:text-[#00b8a0] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#00b8a0] rounded"
      >
        <ArrowLeft className="h-3.5 w-3.5" />
        Back to tasks
      </Link>

      {/* Task header card */}
      <div className="rounded-2xl border border-[#d4ede9] bg-white p-6 shadow-[0_2px_12px_rgba(0,184,160,0.07)]">
        {/* Badges */}
        <div className="mb-4 flex flex-wrap items-center gap-2">
          <span
            className={`rounded-full px-3 py-1 text-[12px] font-semibold ${statusCfg.className}`}
          >
            {statusCfg.label}
          </span>
          <span
            className={`rounded-full px-3 py-1 text-[12px] font-medium ${priorityCfg.className}`}
          >
            {priorityCfg.label}
          </span>
        </div>

        {/* Title */}
        <h1 className="text-[22px] font-bold tracking-[-0.02em] text-[#0d3330] leading-snug">
          {task.title}
        </h1>

        {/* Description */}
        {task.description ? (
          <p className="mt-4 text-[14px] leading-[1.75] text-slate-500">
            {task.description}
          </p>
        ) : (
          <p className="mt-4 text-[13px] italic text-slate-300">
            No description provided.
          </p>
        )}

        {/* Meta */}
        {task.due_date && (
          <div className="mt-5 flex items-center gap-2 text-[13px] text-[#5f8a86]">
            <CalendarDays className="h-4 w-4 text-[#7ab5af]" />
            <span>
              Due{" "}
              <span className="font-semibold text-[#0d3330]">
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
        <div className="mt-6 rounded-2xl border border-[#d4ede9] bg-white p-6 shadow-[0_2px_12px_rgba(0,184,160,0.07)]">
          <div className="mb-4 flex items-center gap-2">
            <FileText className="h-4 w-4 text-[#00b8a0]" />
            <h2 className="text-[15px] font-semibold text-[#0d3330]">
              Deliverables
            </h2>
            <span className="ml-1 rounded-full bg-[#e6f7f5] px-2 py-0.5 text-[11px] font-semibold text-[#00866b]">
              {files.length}
            </span>
          </div>
          <div className="flex flex-col gap-2">
            {files.map((file) => (
              <div
                key={file.id}
                className="flex items-center justify-between rounded-xl border border-[#e6f7f5] bg-[#f6fffe] px-4 py-3"
              >
                <div className="flex items-center gap-3">
                  <span className="text-lg">{getFileIcon(file.filename)}</span>
                  <span className="text-[13px] font-medium text-slate-700">
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
                      "text-[12px] font-semibold text-[#00866b]",
                      "bg-[#e6f7f5] hover:bg-[#00b8a0] hover:text-white",
                      "transition-[background-color,color]",
                      "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#00b8a0]",
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
      <div className="mt-6 rounded-2xl border border-[#d4ede9] bg-white p-6 shadow-[0_2px_12px_rgba(0,184,160,0.07)]">
        <div className="mb-5 flex items-center gap-2">
          <MessageCircle className="h-4 w-4 text-[#00b8a0]" />
          <h2 className="text-[15px] font-semibold text-[#0d3330]">
            Comments
          </h2>
          {comments.length > 0 && (
            <span className="ml-1 rounded-full bg-[#e6f7f5] px-2 py-0.5 text-[11px] font-semibold text-[#00866b]">
              {comments.length}
            </span>
          )}
        </div>

        {/* Comment thread */}
        {comments.length > 0 && (
          <div className="mb-5 flex flex-col gap-3">
            {comments.map((comment) => {
              const isClient = comment.user_id === clientId;
              return (
                <div
                  key={comment.id}
                  className={`flex flex-col gap-1 rounded-xl p-4 ${
                    isClient
                      ? "bg-[#e6f7f5] border border-[#b8e0da]"
                      : "bg-slate-50 border border-slate-100"
                  }`}
                >
                  <div className="flex items-center justify-between gap-2">
                    <span
                      className={`text-[11px] font-semibold uppercase tracking-wider ${
                        isClient ? "text-[#00866b]" : "text-slate-400"
                      }`}
                    >
                      {isClient ? "You" : "Team"}
                    </span>
                    {comment.created_at && (
                      <span className="text-[11px] text-slate-300">
                        {new Date(comment.created_at).toLocaleDateString(
                          "en-US",
                          { month: "short", day: "numeric", year: "numeric" }
                        )}
                      </span>
                    )}
                  </div>
                  <p className="text-[13px] leading-relaxed text-slate-700">
                    {comment.content}
                  </p>
                </div>
              );
            })}
          </div>
        )}

        {comments.length === 0 && (
          <p className="mb-5 text-[13px] text-slate-400">
            No comments yet. Start the conversation below.
          </p>
        )}

        {/* Comment form */}
        <CommentForm taskId={task.id} clientId={clientId} />
      </div>
    </div>
  );
}
