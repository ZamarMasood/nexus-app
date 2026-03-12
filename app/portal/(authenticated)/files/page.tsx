import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { Download, FolderOpen } from "lucide-react";
import { getPortalFiles } from "@/lib/db/portal";
import type { PortalFileWithContext } from "@/lib/db/portal";

function getFileIcon(filename: string | null): string {
  const ext = filename?.split(".").pop()?.toLowerCase();
  if (["png", "jpg", "jpeg", "gif", "webp", "svg"].includes(ext ?? "")) return "🖼️";
  if (ext === "pdf") return "📄";
  if (["doc", "docx"].includes(ext ?? "")) return "📝";
  if (["xls", "xlsx", "csv"].includes(ext ?? "")) return "📊";
  if (["zip", "rar", "tar", "gz"].includes(ext ?? "")) return "📦";
  if (["mp4", "mov", "avi"].includes(ext ?? "")) return "🎬";
  return "📎";
}

function formatDate(dateStr: string | null): string {
  if (!dateStr) return "";
  return new Date(dateStr).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function FileCard({ file }: { file: PortalFileWithContext }) {
  return (
    <div className="flex items-center gap-4 rounded-2xl border border-[#d4ede9] bg-white px-4 py-3 shadow-[0_2px_8px_rgba(0,184,160,0.04)]">
      {/* Icon */}
      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#f0faf8] text-xl">
        {getFileIcon(file.filename)}
      </div>

      {/* Name + task */}
      <div className="flex-1 min-w-0">
        <p className="text-[13px] font-semibold text-[#0d3330] truncate">
          {file.filename ?? "Untitled file"}
        </p>
        <p className="mt-0.5 text-[11px] text-[#7ab5af] truncate">
          {file.taskTitle}
          {file.created_at && (
            <span className="ml-2 text-slate-300">{formatDate(file.created_at)}</span>
          )}
        </p>
      </div>

      {/* Download */}
      {file.file_url ? (
        <a
          href={file.file_url}
          download
          target="_blank"
          rel="noopener noreferrer"
          className={[
            "shrink-0 inline-flex items-center gap-1.5 rounded-xl px-3 py-2",
            "text-[12px] font-semibold text-[#00866b] bg-[#e6f7f5]",
            "hover:bg-[#00b8a0] hover:text-white",
            "transition-[background-color,color]",
            "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#00b8a0]",
            "active:scale-[0.98]",
          ].join(" ")}
        >
          <Download className="h-3.5 w-3.5" />
          Download
        </a>
      ) : (
        <span className="shrink-0 text-[11px] text-slate-300">No file</span>
      )}
    </div>
  );
}

export default async function PortalFilesPage() {
  const cookieStore = cookies();
  const clientId = cookieStore.get("portal_client_id")?.value;
  if (!clientId) redirect("/portal/login");

  const files = await getPortalFiles(clientId);

  // Group by project
  const projectGroups = new Map<
    string,
    { name: string; files: PortalFileWithContext[] }
  >();

  for (const file of files) {
    if (!projectGroups.has(file.projectId)) {
      projectGroups.set(file.projectId, {
        name: file.projectName,
        files: [],
      });
    }
    projectGroups.get(file.projectId)!.files.push(file);
  }

  const groups = Array.from(projectGroups.values());

  return (
    <div className="px-8 py-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-[28px] font-bold tracking-[-0.03em] text-[#0d3330]">
          Files
        </h1>
        <p className="mt-1 text-[15px] leading-relaxed text-[#5f8a86]">
          Download deliverables and project assets from your team.
        </p>
      </div>

      {/* Empty state */}
      {files.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-[#b8e0da] bg-white py-20">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#e6f7f5]">
            <FolderOpen className="h-6 w-6 text-[#00b8a0]" />
          </div>
          <p className="mt-4 text-base font-semibold text-[#0d3330]">
            No files yet
          </p>
          <p className="mt-1 text-sm text-[#7ab5af]">
            Files shared by your team will appear here.
          </p>
        </div>
      ) : (
        <div className="flex flex-col gap-8">
          {groups.map(({ name, files: groupFiles }) => (
            <div key={name}>
              {/* Project header */}
              <div className="mb-3 flex items-center gap-2">
                <div className="flex h-6 w-6 items-center justify-center rounded-lg bg-[#e6f7f5]">
                  <FolderOpen className="h-3.5 w-3.5 text-[#00b8a0]" />
                </div>
                <h2 className="text-[14px] font-bold tracking-[-0.01em] text-[#0d3330]">
                  {name}
                </h2>
                <span className="rounded-full bg-[#e6f7f5] px-2 py-0.5 text-[11px] font-semibold text-[#00866b]">
                  {groupFiles.length} {groupFiles.length === 1 ? "file" : "files"}
                </span>
              </div>

              {/* File cards */}
              <div className="flex flex-col gap-2">
                {groupFiles.map((file) => (
                  <FileCard key={file.id} file={file} />
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
