import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import {
  Download, FolderOpen,
  FileImage, FileText, Sheet, Archive, Film, Paperclip,
} from "lucide-react";
import { getPortalFiles } from "@/lib/db/portal";
import type { PortalFileWithContext } from "@/lib/db/portal";

function getFileIcon(filename: string | null) {
  const ext = filename?.split(".").pop()?.toLowerCase() ?? "";
  if (["png", "jpg", "jpeg", "gif", "webp", "svg"].includes(ext))
    return { Icon: FileImage, color: "text-sky-400",    bg: "bg-sky-500/10"    };
  if (ext === "pdf")
    return { Icon: FileText,  color: "text-rose-400",   bg: "bg-rose-500/10"   };
  if (["doc", "docx"].includes(ext))
    return { Icon: FileText,  color: "text-blue-400",   bg: "bg-blue-500/10"   };
  if (["xls", "xlsx", "csv"].includes(ext))
    return { Icon: Sheet,     color: "text-emerald-400", bg: "bg-emerald-500/10" };
  if (["zip", "rar", "tar", "gz"].includes(ext))
    return { Icon: Archive,   color: "text-amber-400",  bg: "bg-amber-500/10"  };
  if (["mp4", "mov", "avi"].includes(ext))
    return { Icon: Film,      color: "text-purple-400", bg: "bg-purple-500/10" };
  return   { Icon: Paperclip, color: "text-violet-400", bg: "bg-violet-500/10" };
}

function formatDate(dateStr: string | null): string {
  if (!dateStr) return "";
  return new Date(dateStr).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

function FileCard({ file, delay }: { file: PortalFileWithContext; delay: number }) {
  const { Icon, color, bg } = getFileIcon(file.filename);
  const ext = file.filename?.split(".").pop()?.toUpperCase() ?? "FILE";

  return (
    <div
      className={[
        "group flex items-center gap-4 rounded-xl border border-surface bg-surface-card px-4 py-3.5",
        "hover:bg-surface-subtle hover:border-violet-500/20",
        "transition-[background-color,border-color,box-shadow] duration-150",
        "hover:shadow-[0_4px_16px_rgba(0,0,0,0.06)]",
        "animate-in",
      ].join(" ")}
      style={{ animationDelay: `${delay}ms` }}
    >
      {/* File icon */}
      <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${bg}`}>
        <Icon className={`h-5 w-5 ${color}`} />
      </div>

      {/* File info */}
      <div className="flex-1 min-w-0">
        <p className="text-[13px] font-semibold text-secondary-app group-hover:text-bright transition-colors duration-100 truncate">
          {file.filename ?? "Untitled file"}
        </p>
        <div className="mt-0.5 flex items-center gap-2">
          <span className={`inline-block rounded px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wide ${bg} ${color}`}>
            {ext}
          </span>
          {file.taskTitle && (
            <span className="text-[11px] text-dim-app truncate">{file.taskTitle}</span>
          )}
          {file.created_at && (
            <span className="text-[11px] text-dim-app hidden sm:block">· {formatDate(file.created_at)}</span>
          )}
        </div>
      </div>

      {/* Download */}
      {file.file_url ? (
        <a
          href={file.file_url}
          download
          target="_blank"
          rel="noopener noreferrer"
          className={[
            "shrink-0 inline-flex items-center gap-1.5 rounded-lg px-3 py-2",
            "text-[12px] font-semibold text-violet-400 bg-violet-500/10",
            "hover:bg-violet-600 hover:text-white",
            "transition-[background-color,color,transform] duration-150",
            "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-500/40",
            "active:scale-[0.97]",
          ].join(" ")}
        >
          <Download className="h-3.5 w-3.5" />
          <span className="hidden sm:inline">Download</span>
        </a>
      ) : (
        <span className="shrink-0 text-[11px] text-dim-app italic">No file</span>
      )}
    </div>
  );
}

export default async function PortalFilesPage() {
  const cookieStore = cookies();
  const clientId    = cookieStore.get("portal_client_id")?.value;
  if (!clientId) redirect("/portal/login");

  const files = await getPortalFiles(clientId);

  const projectGroups = new Map<string, { name: string; files: PortalFileWithContext[] }>();
  for (const file of files) {
    if (!projectGroups.has(file.projectId)) {
      projectGroups.set(file.projectId, { name: file.projectName, files: [] });
    }
    projectGroups.get(file.projectId)!.files.push(file);
  }
  const groups = Array.from(projectGroups.values());

  let globalDelay = 300;

  return (
    <div className="p-6 sm:p-8 lg:p-10">

      {/* Header */}
      <div className="mb-8 animate-in" style={{ animationDelay: "0ms" }}>
        <p className="text-[11px] font-semibold uppercase tracking-widest text-dim-app mb-1">Assets</p>
        <div className="flex items-end justify-between gap-4">
          <div>
            <h1 className="text-[28px] font-bold tracking-[-0.04em] text-bright leading-tight">Files</h1>
            <p className="mt-1 text-sm text-faint-app">
              Download deliverables and project assets from your team.
            </p>
          </div>
          {files.length > 0 && (
            <div
              className="hidden sm:flex items-center gap-1.5 rounded-full bg-violet-500/10 border border-violet-500/20 px-3 py-1 animate-in"
              style={{ animationDelay: "80ms" }}
            >
              <span className="text-[13px] font-bold text-violet-400 tabular-nums">{files.length}</span>
              <span className="text-[11px] text-violet-400/70">{files.length === 1 ? "file" : "files"} total</span>
            </div>
          )}
        </div>
      </div>

      {files.length === 0 ? (
        <div
          className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-surface bg-surface-card py-24 animate-in"
          style={{ animationDelay: "160ms" }}
        >
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-surface-inset border border-surface mb-4">
            <FolderOpen className="h-6 w-6 text-dim-app" />
          </div>
          <p className="text-sm font-semibold text-muted-app">No files yet</p>
          <p className="mt-1 text-xs text-dim-app text-center max-w-xs">
            Files shared by your team will appear here.
          </p>
        </div>
      ) : (
        <div className="flex flex-col gap-8">
          {groups.map(({ name, files: groupFiles }, groupIdx) => {
            const groupDelay = 160 + groupIdx * 60;
            return (
              <div key={name}>
                {/* Project group header */}
                <div
                  className="mb-3 flex items-center gap-3 animate-in"
                  style={{ animationDelay: `${groupDelay}ms` }}
                >
                  <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-violet-500/10">
                    <FolderOpen className="h-3.5 w-3.5 text-violet-400" />
                  </div>
                  <h2 className="text-[14px] font-bold tracking-[-0.01em] text-bright">{name}</h2>
                  <span className="rounded-full bg-violet-500/10 border border-violet-500/15 px-2 py-0.5 text-[11px] font-semibold text-violet-400">
                    {groupFiles.length} {groupFiles.length === 1 ? "file" : "files"}
                  </span>
                  <div className="flex-1 h-px bg-surface-subtle ml-1" />
                </div>

                {/* File cards */}
                <div className="flex flex-col gap-2">
                  {groupFiles.map((file) => {
                    const d = globalDelay;
                    globalDelay += 40;
                    return <FileCard key={file.id} file={file} delay={d} />;
                  })}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
