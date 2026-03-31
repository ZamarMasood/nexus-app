import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import {
  Layers,
  Download,
  FolderOpen,
  FileImage,
  FileText,
  Sheet,
  Archive,
  Film,
  Paperclip,
} from "lucide-react";
import { getPortalFiles } from "@/lib/db/portal";
import type { PortalFileWithContext } from "@/lib/db/portal";

function getFileIcon(filename: string | null) {
  const ext = filename?.split(".").pop()?.toLowerCase() ?? "";
  if (["png", "jpg", "jpeg", "gif", "webp", "svg"].includes(ext))
    return { Icon: FileImage, color: "text-sky-400", bg: "bg-sky-500/10" };
  if (ext === "pdf")
    return { Icon: FileText, color: "text-[#e5484d]", bg: "bg-[rgba(229,72,77,0.1)]" };
  if (["doc", "docx"].includes(ext))
    return { Icon: FileText, color: "text-blue-400", bg: "bg-blue-500/10" };
  if (["xls", "xlsx", "csv"].includes(ext))
    return { Icon: Sheet, color: "text-[#26c97f]", bg: "bg-[rgba(38,201,127,0.1)]" };
  if (["zip", "rar", "tar", "gz"].includes(ext))
    return { Icon: Archive, color: "text-[#e79d13]", bg: "bg-[rgba(231,157,19,0.1)]" };
  if (["mp4", "mov", "avi"].includes(ext))
    return { Icon: Film, color: "text-purple-400", bg: "bg-purple-500/10" };
  return { Icon: Paperclip, color: "text-[#5e6ad2]", bg: "bg-[rgba(94,106,210,0.15)]" };
}

function formatDate(dateStr: string | null): string {
  if (!dateStr) return "";
  return new Date(dateStr).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export default async function PortalFilesPage() {
  const cookieStore = cookies();
  const clientId = cookieStore.get("portal_client_id")?.value;
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

  return (
    <div className="flex flex-col h-full bg-[#0d0d0d]">

      {/* Header toolbar */}
      <div className="flex items-center justify-between px-6 h-[60px] border-b border-[rgba(255,255,255,0.06)] shrink-0">
        <div className="flex items-center gap-3">
          <Layers size={16} className="text-[#555]" />
          <h1 className="text-[15px] font-medium text-[#e8e8e8]">Files</h1>
          <span className="text-[12px] text-[#555]">{files.length} total</span>
        </div>
      </div>

      {/* Main content */}
      <div className="flex-1 overflow-y-auto">
        <div className="p-6">

          {files.length === 0 ? (
            <div className="text-center py-12">
              <div className="flex h-14 w-14 mx-auto items-center justify-center rounded-lg bg-[#111111] border border-[rgba(255,255,255,0.06)] mb-4">
                <FolderOpen className="h-6 w-6 text-[#555]" />
              </div>
              <p className="text-[13px] text-[#888] mb-2">No files yet</p>
              <p className="text-[12px] text-[#444]">
                Files shared by your team will appear here.
              </p>
            </div>
          ) : (
            <div className="space-y-6">
              {groups.map(({ name, files: groupFiles }) => (
                <div key={name}>
                  {/* Project group header */}
                  <div className="flex items-center gap-3 mb-3">
                    <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-[rgba(94,106,210,0.12)]">
                      <FolderOpen className="h-3.5 w-3.5 text-[#5e6ad2]" />
                    </div>
                    <h2 className="text-[13px] font-medium text-[#e8e8e8]">{name}</h2>
                    <span className="text-[11px] text-[#555]">
                      {groupFiles.length} {groupFiles.length === 1 ? "file" : "files"}
                    </span>
                    <div className="flex-1 h-px bg-[rgba(255,255,255,0.06)] ml-1" />
                  </div>

                  {/* File table */}
                  <div className="rounded-lg border border-[rgba(255,255,255,0.06)] overflow-hidden">
                    {groupFiles.map((file, i) => {
                      const { Icon, color, bg } = getFileIcon(file.filename);
                      const ext = file.filename?.split(".").pop()?.toUpperCase() ?? "FILE";

                      return (
                        <div
                          key={file.id}
                          className={[
                            "group flex items-center gap-3 px-4 py-2.5",
                            i < groupFiles.length - 1
                              ? "border-b border-[rgba(255,255,255,0.06)]"
                              : "",
                            "hover:bg-[#1a1a1a] transition-colors duration-[120ms]",
                          ].join(" ")}
                        >
                          <div className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${bg}`}>
                            <Icon className={`h-4 w-4 ${color}`} />
                          </div>

                          <div className="flex-1 min-w-0">
                            <p className="text-[13px] font-medium text-[#d4d4d4] truncate">
                              {file.filename ?? "Untitled file"}
                            </p>
                            <div className="flex items-center gap-2 mt-0.5">
                              <span
                                className={`inline-block rounded px-1.5 py-0.5 text-[10px] font-medium uppercase tracking-wide ${bg} ${color}`}
                              >
                                {ext}
                              </span>
                              {file.taskTitle && (
                                <span className="text-[11px] text-[#555] truncate">
                                  {file.taskTitle}
                                </span>
                              )}
                              {file.created_at && (
                                <span className="text-[11px] text-[#555] hidden sm:block">
                                  · {formatDate(file.created_at)}
                                </span>
                              )}
                            </div>
                          </div>

                          {file.file_url ? (
                            <a
                              href={file.file_url}
                              download
                              target="_blank"
                              rel="noopener noreferrer"
                              className="shrink-0 inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md
                                text-[12px] font-medium text-[#5e6ad2] bg-[rgba(94,106,210,0.15)]
                                hover:bg-[#5e6ad2] hover:text-white
                                transition-colors duration-150
                                focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[rgba(94,106,210,0.35)]"
                            >
                              <Download className="h-3 w-3" />
                              <span className="hidden sm:inline">Download</span>
                            </a>
                          ) : (
                            <span className="shrink-0 text-[11px] text-[#3a3a3a] italic">
                              No file
                            </span>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
