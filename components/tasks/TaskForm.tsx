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

const LABEL = "block text-[11px] font-medium text-[var(--text-faint)] uppercase tracking-[0.06em] mb-1.5";
const FIELD = `w-full px-3 py-2 rounded-lg bg-[var(--bg-input)] border border-[var(--border-default)]
  text-[var(--text-primary)] text-[13px] placeholder:text-[var(--text-faint)]
  focus:outline-none focus:border-[var(--accent-border)]
  focus:ring-1 focus:ring-[var(--accent-ring)]
  transition-all duration-150`;
const TEXTAREA_FIELD = `w-full px-3 py-2 rounded-lg bg-[var(--bg-input)] border border-[var(--border-default)]
  text-[var(--text-primary)] text-[13px] placeholder:text-[var(--text-faint)] resize-none
  focus:outline-none focus:border-[var(--accent-border)]
  focus:ring-1 focus:ring-[var(--accent-ring)]
  transition-all duration-150`;
const SELECT_TRIGGER = `w-full rounded-lg border border-[var(--border-default)] bg-[var(--bg-input)]
  h-[42px] text-[13px] text-[var(--text-primary)]
  focus:ring-1 focus:ring-[var(--accent-ring)] focus:border-[var(--accent-border)]
  data-[placeholder]:text-[var(--text-faint)]`;
const SELECT_CONTENT = "bg-[var(--bg-sidebar)] border-[var(--border-default)] text-[var(--text-primary)]";
const SELECT_ITEM = "text-[13px] text-[var(--text-muted)] focus:bg-[var(--tint-accent)] focus:text-[var(--accent)] cursor-pointer";

const PRIORITY_CONFIG: Record<string, { label: string; color: string; dot: string }> = {
  urgent: { label: "Urgent", color: "#e5484d", dot: "bg-[var(--priority-urgent)]" },
  high:   { label: "High",   color: "#e79d13", dot: "bg-[var(--priority-high)]" },
  normal: { label: "Normal", color: "#5e6ad2", dot: "bg-[var(--accent)]" },
  low:    { label: "Low",    color: "#888",    dot: "bg-[var(--text-muted)]" },
};

const STATUS_CONFIG: Record<string, { label: string; color: string; dot: string }> = {
  todo:        { label: "To Do",       color: "#888",    dot: "bg-[var(--text-muted)]" },
  in_progress: { label: "In Progress", color: "#5e6ad2", dot: "bg-[var(--accent)]" },
  done:        { label: "Done",        color: "#26c97f", dot: "bg-[var(--status-done)]" },
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
        bg-[var(--bg-sidebar)] border border-[var(--border-default)] rounded-xl
        shadow-[var(--shadow-modal)] p-0 gap-0 w-[calc(100vw-24px)] max-w-[560px]
        max-h-[92vh] sm:max-h-[90vh] flex flex-col overflow-hidden">

        <div className="flex items-center justify-between px-4 sm:px-6 pt-5 sm:pt-6 pb-4
          border-b border-[var(--border-subtle)] flex-shrink-0">
          <div>
            <h3 className="text-[15px] font-semibold text-[var(--text-primary)]">
              {isEdit ? "Edit Task" : "New Task"}
            </h3>
            <p className="text-[11px] text-[var(--text-faint)] mt-1">
              {isEdit ? "Update task details" : "Create a new task to track work"}
            </p>
          </div>
        </div>

        {loadError && (
          <div className="mx-6 mt-4 rounded-lg bg-[var(--tint-red)] border border-[var(--tint-red-border)] px-4 py-3 text-[13px] text-[var(--priority-urgent)] flex-shrink-0">
            {loadError}
          </div>
        )}

        <form onSubmit={handleSubmit} noValidate className="flex flex-col flex-1 min-h-0">
          <div className="px-4 sm:px-6 py-5 sm:mr-1 space-y-4 overflow-y-auto flex-1 min-h-0">

            <div>
              <label className={LABEL}>
                <span className="flex items-center gap-1.5">
                  <Hash className="h-3 w-3 text-[var(--accent)]" />
                  Title <span className="text-[var(--priority-urgent)] normal-case tracking-normal font-normal">*</span>
                </span>
              </label>
              <input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="What needs to be done?"
                className={FIELD}
                autoFocus
              />
              {errors.title && <p className="mt-1 text-[11px] text-[var(--priority-urgent)]">{errors.title}</p>}
            </div>

            <div>
              <label className={LABEL}>
                <span className="flex items-center gap-1.5">
                  <AlignLeft className="h-3 w-3 text-[var(--accent)]" />
                  Description
                </span>
              </label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Optional details..."
                rows={3}
                className={TEXTAREA_FIELD}
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className={LABEL}>
                  <span className="flex items-center gap-1.5">
                    <FolderKanban className="h-3 w-3 text-[var(--accent)]" />
                    Project <span className="text-[var(--priority-urgent)] normal-case tracking-normal font-normal">*</span>
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
                {errors.project_id && <p className="mt-1 text-[11px] text-[var(--priority-urgent)]">{errors.project_id}</p>}
              </div>

              <div>
                <label className={LABEL}>
                  <span className="flex items-center gap-1.5">
                    <UserCircle2 className="h-3 w-3 text-[var(--accent)]" />
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

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className={LABEL}>
                  <span className="flex items-center gap-1.5">
                    <Flag className="h-3 w-3 text-[var(--accent)]" />
                    Priority
                  </span>
                </label>
                <Select value={priority} onValueChange={(v) => setPriority(v as TaskPriority)}>
                  <SelectTrigger className={SELECT_TRIGGER}>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className={SELECT_CONTENT}>
                    {(["urgent", "high", "normal", "low"] as TaskPriority[]).map((p) => {
                      const config = PRIORITY_CONFIG[p];
                      return (
                        <SelectItem key={p} value={p} className={SELECT_ITEM}>
                          <div className="flex items-center gap-2">
                            <span className={`h-1.5 w-1.5 rounded-full ${config.dot}`} />
                            <span style={{ color: config.color }}>{config.label}</span>
                          </div>
                        </SelectItem>
                      );
                    })}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label className={LABEL}>
                  <span className="flex items-center gap-1.5">
                    <FolderKanban className="h-3 w-3 text-[var(--accent)]" />
                    Status
                  </span>
                </label>
                <Select value={status} onValueChange={(v) => setStatus(v as TaskStatus)}>
                  <SelectTrigger className={SELECT_TRIGGER}>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className={SELECT_CONTENT}>
                    {(taskStatuses.length > 0
                      ? taskStatuses.map((s) => ({ value: s.slug, label: s.label, color: s.color }))
                      : [
                          { value: "todo",        label: "To Do",       color: "#888" },
                          { value: "in_progress", label: "In Progress", color: "#5e6ad2" },
                          { value: "done",        label: "Done",        color: "#26c97f" },
                        ]
                    ).map(({ value, label, color }) => {
                      const dotColor = value === "todo" ? "bg-[var(--text-muted)]" : value === "in_progress" ? "bg-[var(--accent)]" : "bg-[var(--status-done)]";
                      return (
                        <SelectItem key={value} value={value} className={SELECT_ITEM}>
                          <div className="flex items-center gap-2">
                            <span className={`h-1.5 w-1.5 rounded-full ${dotColor}`} />
                            <span style={{ color }}>{label}</span>
                          </div>
                        </SelectItem>
                      );
                    })}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div>
              <label className={LABEL}>
                <span className="flex items-center gap-1.5">
                  <CalendarDays className="h-3 w-3 text-[var(--accent)]" />
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
          </div>

          {submitError && (
            <div className="mx-6 mb-4 rounded-lg bg-[var(--tint-red)] border border-[var(--tint-red-border)] px-4 py-3 text-[13px] text-[var(--priority-urgent)] flex-shrink-0">
              {submitError}
            </div>
          )}

          <div className="flex items-center justify-end gap-3 px-4 sm:px-6 py-4
            border-t border-[var(--border-subtle)] flex-shrink-0">
            <button
              type="button"
              onClick={() => onOpenChange(false)}
              className="px-4 py-2 rounded-lg text-[13px] font-medium text-[var(--text-muted)]
                hover:text-[var(--text-primary)] hover:bg-[var(--hover-default)] 
                transition-all duration-150"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="flex items-center gap-2 px-4 py-2 rounded-lg text-[13px] font-medium
                bg-[var(--accent)] hover:bg-[var(--accent-hover)] text-white
                active:scale-[0.98] transition-all duration-150
                disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {submitting && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
              {submitting ? "Saving..." : isEdit ? "Save Changes" : "Create Task"}
            </button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

export default TaskFormDialog;