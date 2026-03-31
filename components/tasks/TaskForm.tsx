"use client";

import { useState, useEffect } from "react";
import { Loader2, CalendarDays, AlignLeft, FolderKanban, UserCircle2, Flag, Hash } from "lucide-react";
import { updateTask } from "@/lib/db/tasks";
import { createTaskAction } from "@/app/dashboard/tasks/actions";
import { getProjects } from "@/lib/db/projects";
import { getTeamMembers } from "@/lib/db/team-members";
import { revalidateDashboard } from "@/app/dashboard/actions";
import { getTaskStatuses, type TaskStatusRow } from "@/lib/db/task-statuses";
import type { Task, TaskPriority, TaskStatus, Project, TeamMember } from "@/lib/types";
import {
  Dialog,
  DialogContent,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface TaskFormDialogProps {
  open:              boolean;
  onOpenChange:      (open: boolean) => void;
  task?:             Task;
  defaultProjectId?: string;
  defaultStatus?:    string;
  defaultAssigneeId?: string;
  isAdmin?:          boolean;
  onSuccess?:        () => void;
}

interface FormErrors {
  title?:      string;
  project_id?: string;
}

const LABEL = "block text-[12px] font-medium text-[#8a8a8a] uppercase tracking-[0.04em] mb-1.5";
const FIELD = `w-full px-3 py-2 rounded-md bg-[#1a1a1a] border border-[rgba(255,255,255,0.10)]
  text-[#f0f0f0] text-[13px] placeholder:text-[#555]
  focus:outline-none focus:border-[rgba(255,255,255,0.16)]
  focus:ring-1 focus:ring-[rgba(94,106,210,0.35)]
  transition-colors duration-150`;
const SELECT_TRIGGER = `w-full rounded-md border border-[rgba(255,255,255,0.10)] bg-[#1a1a1a]
  h-[38px] text-[13px] text-[#f0f0f0]
  focus:ring-1 focus:ring-[rgba(94,106,210,0.35)] focus:border-[rgba(255,255,255,0.16)]
  data-[placeholder]:text-[#555]`;
const SELECT_CONTENT = "bg-[#1c1c1c] border-[rgba(255,255,255,0.10)] text-[#f0f0f0]";
const SELECT_ITEM = "text-[13px] text-[#8a8a8a] focus:bg-white/5 focus:text-[#f0f0f0] cursor-pointer";

const PRIORITY_COLORS: Record<string, string> = {
  urgent: "text-[#e5484d]",
  high:   "text-[#e79d13]",
  normal: "text-[#5e6ad2]",
  low:    "text-[#888]",
};

const STATUS_COLORS: Record<string, string> = {
  todo:        "text-[#888]",
  in_progress: "text-[#5e6ad2]",
  done:        "text-[#26c97f]",
};

export function TaskFormDialog({
  open,
  onOpenChange,
  task,
  defaultProjectId,
  defaultStatus,
  defaultAssigneeId,
  isAdmin = false,
  onSuccess,
}: TaskFormDialogProps) {
  const isEdit = !!task;

  const [title, setTitle]           = useState("");
  const [description, setDescription] = useState("");
  const [projectId, setProjectId]   = useState("");
  const [assigneeId, setAssigneeId] = useState("");
  const [status, setStatus]         = useState<TaskStatus>("todo");
  const [priority, setPriority]     = useState<TaskPriority>("normal");
  const [dueDate, setDueDate]       = useState("");
  const [errors, setErrors]         = useState<FormErrors>({});
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const [projects, setProjects]       = useState<Project[]>([]);
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);
  const [taskStatuses, setTaskStatuses] = useState<TaskStatusRow[]>([]);
  const [loadError, setLoadError]     = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;

    setTitle(task?.title ?? "");
    setDescription(task?.description ?? "");
    setProjectId(task?.project_id ?? defaultProjectId ?? "");
    setAssigneeId(task?.assignee_id ?? defaultAssigneeId ?? "");
    setStatus((task?.status as TaskStatus) ?? defaultStatus ?? "todo");
    setPriority((task?.priority as TaskPriority) ?? "normal");
    setDueDate(task?.due_date ?? "");
    setErrors({});
    setSubmitError(null);

    Promise.all([getProjects(), getTeamMembers(), getTaskStatuses()])
      .then(([p, t, s]) => { setProjects(p); setTeamMembers(t); setTaskStatuses(s); })
      .catch((err: unknown) => {
        setLoadError(err instanceof Error ? err.message : "Failed to load form data");
      });
  }, [open, task, defaultProjectId, defaultStatus, defaultAssigneeId]);

  function validate(): boolean {
    const next: FormErrors = {};
    if (!title.trim()) next.title = "Title is required";
    if (!projectId)    next.project_id = "Project is required";
    setErrors(next);
    return Object.keys(next).length === 0;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!validate()) return;

    setSubmitting(true);
    setSubmitError(null);

    try {
      const payload = {
        title:       title.trim(),
        description: description.trim() || null,
        project_id:  projectId,
        assignee_id: assigneeId || null,
        status,
        priority,
        due_date:    dueDate || null,
      };

      if (isEdit && task) {
        await updateTask(task.id, payload);
      } else {
        await createTaskAction(payload);
      }

      onOpenChange(false);
      await revalidateDashboard();
      onSuccess?.();
    } catch (err: unknown) {
      setSubmitError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="
        bg-[#161616] border border-[rgba(255,255,255,0.10)] rounded-lg
        shadow-[0_24px_64px_rgba(0,0,0,0.7)] p-0 gap-0
        max-w-[560px] w-full">

        <div className="flex items-center justify-between px-5 pt-5 pb-4
          border-b border-[rgba(255,255,255,0.06)]">
          <span className="text-[15px] font-medium text-[#f0f0f0]">
            {isEdit ? "Edit Task" : "New Task"}
          </span>
        </div>

        {loadError && (
          <div className="mx-5 mt-4 rounded-md px-3 py-2 text-[13px] text-[#e5484d]
            bg-[rgba(229,72,77,0.1)] border border-[rgba(229,72,77,0.2)]">
            {loadError}
          </div>
        )}

        <form onSubmit={handleSubmit} noValidate>
          <div className="px-5 py-4 space-y-3">

            <div>
              <label className={LABEL}>
                <span className="flex items-center gap-1.5">
                  <Hash className="h-3 w-3" />
                  Title <span className="text-[#e5484d] normal-case tracking-normal font-normal">*</span>
                </span>
              </label>
              <input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="What needs to be done?"
                className={FIELD}
                autoFocus
              />
              {errors.title && <p className="mt-1 text-[12px] text-[#e5484d]">{errors.title}</p>}
            </div>

            <div>
              <label className={LABEL}>
                <span className="flex items-center gap-1.5">
                  <AlignLeft className="h-3 w-3" />
                  Description
                </span>
              </label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Optional details..."
                rows={3}
                className={`${FIELD} resize-none`}
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className={LABEL}>
                  <span className="flex items-center gap-1.5">
                    <FolderKanban className="h-3 w-3" />
                    Project <span className="text-[#e5484d] normal-case tracking-normal font-normal">*</span>
                  </span>
                </label>
                <Select value={projectId} onValueChange={setProjectId}>
                  <SelectTrigger className={SELECT_TRIGGER}>
                    <SelectValue placeholder="Select project" />
                  </SelectTrigger>
                  <SelectContent className={SELECT_CONTENT}>
                    {projects.map((p) => (
                      <SelectItem key={p.id} value={p.id} className={SELECT_ITEM}>
                        {p.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {errors.project_id && <p className="mt-1 text-[12px] text-[#e5484d]">{errors.project_id}</p>}
              </div>

              <div>
                <label className={LABEL}>
                  <span className="flex items-center gap-1.5">
                    <UserCircle2 className="h-3 w-3" />
                    Assignee
                  </span>
                </label>
                <Select
                  value={assigneeId}
                  onValueChange={setAssigneeId}
                  disabled={!isAdmin && !!defaultAssigneeId}
                >
                  <SelectTrigger className={SELECT_TRIGGER}>
                    <SelectValue placeholder="Unassigned" />
                  </SelectTrigger>
                  <SelectContent className={SELECT_CONTENT}>
                    {(isAdmin
                      ? teamMembers
                      : teamMembers.filter((m) => !defaultAssigneeId || m.id === defaultAssigneeId)
                    ).map((m) => (
                      <SelectItem key={m.id} value={m.id} className={SELECT_ITEM}>
                        {m.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className={LABEL}>
                  <span className="flex items-center gap-1.5">
                    <Flag className="h-3 w-3" />
                    Priority
                  </span>
                </label>
                <Select value={priority} onValueChange={(v) => setPriority(v as TaskPriority)}>
                  <SelectTrigger className={SELECT_TRIGGER}>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className={SELECT_CONTENT}>
                    {(["urgent", "high", "normal", "low"] as TaskPriority[]).map((p) => (
                      <SelectItem key={p} value={p} className={`${SELECT_ITEM} ${PRIORITY_COLORS[p]}`}>
                        {p.charAt(0).toUpperCase() + p.slice(1)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label className={LABEL}>Board</label>
                <Select value={status} onValueChange={(v) => setStatus(v as TaskStatus)}>
                  <SelectTrigger className={SELECT_TRIGGER}>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className={SELECT_CONTENT}>
                    {(taskStatuses.length > 0
                      ? taskStatuses.map((s) => ({ value: s.slug, label: s.label, color: s.color }))
                      : [
                          { value: "todo",        label: "To Do",        color: "#888" },
                          { value: "in_progress", label: "In Progress",  color: "#5e6ad2" },
                          { value: "done",        label: "Done",         color: "#26c97f" },
                        ]
                    ).map(({ value, label, color }) => (
                      <SelectItem key={value} value={value} className={SELECT_ITEM} style={{ color }}>
                        {label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {!isEdit && (
                <div>
                  <label className={LABEL}>
                    <span className="flex items-center gap-1.5">
                      <CalendarDays className="h-3 w-3" />
                      Due Date
                    </span>
                  </label>
                  <input
                    type="date"
                    value={dueDate}
                    onChange={(e) => setDueDate(e.target.value)}
                    className={FIELD}
                  />
                </div>
              )}
            </div>

            {isEdit && (
              <div>
                <label className={LABEL}>
                  <span className="flex items-center gap-1.5">
                    <CalendarDays className="h-3 w-3" />
                    Due Date
                  </span>
                </label>
                <input
                  type="date"
                  value={dueDate}
                  onChange={(e) => setDueDate(e.target.value)}
                  className={FIELD}
                />
              </div>
            )}
          </div>

          {submitError && (
            <div className="mx-5 mb-3 rounded-md px-3 py-2 text-[13px] text-[#e5484d]
              bg-[rgba(229,72,77,0.1)] border border-[rgba(229,72,77,0.2)]">
              {submitError}
            </div>
          )}

          <div className="flex items-center justify-end gap-2 px-5 py-4
            border-t border-[rgba(255,255,255,0.06)]">
            <button
              type="button"
              onClick={() => onOpenChange(false)}
              className="px-3 py-1.5 rounded-md text-[13px] font-medium text-[#8a8a8a]
                hover:bg-white/5 hover:text-[#f0f0f0] transition-colors duration-150"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="flex items-center gap-2 px-3 py-1.5 rounded-md text-[13px] font-medium
                bg-[#5e6ad2] hover:bg-[#6872e5] text-white
                active:scale-[0.98] transition-colors duration-150
                disabled:opacity-50"
            >
              {submitting && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
              {submitting ? "Saving..." : isEdit ? "Save changes" : "Create task"}
            </button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

export default TaskFormDialog;
