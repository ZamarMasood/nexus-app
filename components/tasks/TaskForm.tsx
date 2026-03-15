"use client";

import { useState, useEffect } from "react";
import { Loader2, CalendarDays, AlignLeft, FolderKanban, UserCircle2, Flag, Hash } from "lucide-react";
import { createTask, updateTask } from "@/lib/db/tasks";
import { getProjects } from "@/lib/db/projects";
import { getTeamMembers } from "@/lib/db/team-members";
import { revalidateDashboard } from "@/app/dashboard/actions";
import type { Task, TaskPriority, TaskStatus, Project, TeamMember } from "@/lib/types";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface TaskFormDialogProps {
  open:             boolean;
  onOpenChange:     (open: boolean) => void;
  task?:            Task;
  defaultProjectId?: string;
  onSuccess?:       () => void;
}

interface FormErrors {
  title?:      string;
  project_id?: string;
}

const LABEL = "block text-[11px] font-semibold uppercase tracking-widest text-faint-app mb-1";
const FIELD = "w-full rounded-lg border border-surface bg-surface-inset px-3 py-2.5 text-[13px] text-primary-app placeholder:text-dim-app focus:outline-none focus:ring-1 focus:ring-violet-500/40 focus:border-violet-500/50 transition-[border-color,box-shadow] duration-150";
const SELECT_TRIGGER = "w-full rounded-lg border border-surface bg-surface-inset h-[42px] text-[13px] text-primary-app focus:ring-1 focus:ring-violet-500/40 focus:border-violet-500/50 data-[placeholder]:text-dim-app";
const SELECT_CONTENT = "bg-surface-card border-surface text-primary-app";
const SELECT_ITEM    = "text-[13px] text-primary-app focus:bg-violet-500/10 focus:text-violet-300 cursor-pointer";

const PRIORITY_COLORS: Record<string, string> = {
  urgent: "text-rose-400",
  high:   "text-orange-400",
  normal: "text-sky-400",
  low:    "text-faint-app",
};

const STATUS_COLORS: Record<string, string> = {
  todo:        "text-muted-app",
  in_progress: "text-amber-400",
  done:        "text-emerald-400",
};

export function TaskFormDialog({
  open,
  onOpenChange,
  task,
  defaultProjectId,
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
  const [loadError, setLoadError]     = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;

    setTitle(task?.title ?? "");
    setDescription(task?.description ?? "");
    setProjectId(task?.project_id ?? defaultProjectId ?? "");
    setAssigneeId(task?.assignee_id ?? "");
    setStatus((task?.status as TaskStatus) ?? "todo");
    setPriority((task?.priority as TaskPriority) ?? "normal");
    setDueDate(task?.due_date ?? "");
    setErrors({});
    setSubmitError(null);

    Promise.all([getProjects(), getTeamMembers()])
      .then(([p, t]) => { setProjects(p); setTeamMembers(t); })
      .catch((err: unknown) => {
        setLoadError(err instanceof Error ? err.message : "Failed to load form data");
      });
  }, [open, task, defaultProjectId]);

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
        await createTask(payload);
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
      <DialogContent className="bg-surface-card border-surface text-primary-app sm:max-w-lg p-0 gap-0">
        {/* Dialog header */}
        <DialogHeader className="px-6 pt-6 pb-4 border-b border-surface">
          <DialogTitle className="text-[15px] font-semibold tracking-[-0.02em] text-bright">
            {isEdit ? "Edit Task" : "New Task"}
          </DialogTitle>
        </DialogHeader>

        {loadError && (
          <div className="mx-6 mt-4 rounded-lg bg-rose-500/10 border border-rose-500/20 px-3 py-2 text-sm text-rose-400 flex items-center gap-2">
            {loadError}
          </div>
        )}

        <form onSubmit={handleSubmit} noValidate>
          <div className="px-6 py-5 space-y-4">

            {/* Title */}
            <div>
              <label className={LABEL}>
                <span className="flex items-center gap-1.5">
                  <Hash className="h-3 w-3" />
                  Title <span className="text-rose-400 normal-case tracking-normal font-normal">*</span>
                </span>
              </label>
              <input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="What needs to be done?"
                className={FIELD}
                autoFocus
              />
              {errors.title && <p className="mt-1 text-xs text-rose-400">{errors.title}</p>}
            </div>

            {/* Description */}
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

            {/* Project + Assignee */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className={LABEL}>
                  <span className="flex items-center gap-1.5">
                    <FolderKanban className="h-3 w-3" />
                    Project <span className="text-rose-400 normal-case tracking-normal font-normal">*</span>
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
                {errors.project_id && <p className="mt-1 text-xs text-rose-400">{errors.project_id}</p>}
              </div>

              <div>
                <label className={LABEL}>
                  <span className="flex items-center gap-1.5">
                    <UserCircle2 className="h-3 w-3" />
                    Assignee
                  </span>
                </label>
                <Select value={assigneeId} onValueChange={setAssigneeId}>
                  <SelectTrigger className={SELECT_TRIGGER}>
                    <SelectValue placeholder="Unassigned" />
                  </SelectTrigger>
                  <SelectContent className={SELECT_CONTENT}>
                    {teamMembers.map((m) => (
                      <SelectItem key={m.id} value={m.id} className={SELECT_ITEM}>
                        {m.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Priority + Status */}
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

              {isEdit && (
                <div>
                  <label className={LABEL}>Status</label>
                  <Select value={status} onValueChange={(v) => setStatus(v as TaskStatus)}>
                    <SelectTrigger className={SELECT_TRIGGER}>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className={SELECT_CONTENT}>
                      {([
                        { value: "todo",        label: "To Do"       },
                        { value: "in_progress", label: "In Progress" },
                        { value: "done",        label: "Done"        },
                      ] as { value: TaskStatus; label: string }[]).map(({ value, label }) => (
                        <SelectItem key={value} value={value} className={`${SELECT_ITEM} ${STATUS_COLORS[value]}`}>
                          {label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}

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

            {/* Due date (edit mode — show separately since status took the slot) */}
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
            <div className="mx-6 mb-4 rounded-lg bg-rose-500/10 border border-rose-500/20 px-3 py-2.5 text-sm text-rose-400">
              {submitError}
            </div>
          )}

          <div className="px-6 pb-6 flex justify-end gap-2 border-t border-surface pt-4">
            <button
              type="button"
              onClick={() => onOpenChange(false)}
              className="rounded-lg px-4 py-2 text-sm font-medium text-secondary-app hover:text-primary-app hover:bg-surface-subtle transition-[background-color,color] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-500"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="flex items-center gap-2 rounded-lg bg-violet-600 px-4 py-2 text-sm font-semibold text-white shadow-[0_4px_16px_rgba(139,92,246,0.3)] hover:bg-violet-500 hover:shadow-[0_4px_20px_rgba(139,92,246,0.4)] active:scale-[0.97] transition-[background-color,box-shadow,transform] disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-400"
            >
              {submitting && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
              {submitting ? "Saving…" : isEdit ? "Save Changes" : "Create Task"}
            </button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

export default TaskFormDialog;
