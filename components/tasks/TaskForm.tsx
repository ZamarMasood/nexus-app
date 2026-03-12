"use client";

import { useState, useEffect } from "react";
import { createTask, updateTask } from "@/lib/db/tasks";
import { getProjects } from "@/lib/db/projects";
import { getTeamMembers } from "@/lib/db/team-members";
import type { Task, TaskPriority, TaskStatus, Project, TeamMember } from "@/lib/types";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";

interface TaskFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Pass a task to enable edit mode */
  task?: Task;
  /** Pre-select a project */
  defaultProjectId?: string;
  onSuccess?: () => void;
}

interface FormErrors {
  title?: string;
  project_id?: string;
}

export function TaskFormDialog({
  open,
  onOpenChange,
  task,
  defaultProjectId,
  onSuccess,
}: TaskFormDialogProps) {
  const isEdit = !!task;

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [projectId, setProjectId] = useState("");
  const [assigneeId, setAssigneeId] = useState("");
  const [status, setStatus] = useState<TaskStatus>("todo");
  const [priority, setPriority] = useState<TaskPriority>("normal");
  const [dueDate, setDueDate] = useState("");
  const [errors, setErrors] = useState<FormErrors>({});
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const [projects, setProjects] = useState<Project[]>([]);
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);
  const [loadError, setLoadError] = useState<string | null>(null);

  // Reset form and load options when dialog opens
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
      .then(([p, t]) => {
        setProjects(p);
        setTeamMembers(t);
      })
      .catch((err: unknown) => {
        setLoadError(err instanceof Error ? err.message : "Failed to load form data");
      });
  }, [open, task, defaultProjectId]);

  function validate(): boolean {
    const next: FormErrors = {};
    if (!title.trim()) next.title = "Title is required";
    if (!projectId) next.project_id = "Project is required";
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
        title: title.trim(),
        description: description.trim() || null,
        project_id: projectId,
        assignee_id: assigneeId || null,
        status,
        priority,
        due_date: dueDate || null,
      };

      if (isEdit && task) {
        await updateTask(task.id, payload);
      } else {
        await createTask(payload);
      }

      onOpenChange(false);
      onSuccess?.();
    } catch (err: unknown) {
      setSubmitError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setSubmitting(false);
    }
  }

  const fieldClass =
    "w-full rounded-lg border border-white/10 bg-[#1a1b23] px-3 py-2 text-sm text-slate-100 placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-violet-500/60 focus:border-violet-500/60 transition-[border-color,box-shadow]";

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-[#13141a] border-white/10 text-slate-100 sm:max-w-lg p-0 gap-0">
        <DialogHeader className="px-6 pt-6 pb-4 border-b border-white/8">
          <DialogTitle className="text-base font-semibold tracking-[-0.02em] text-white">
            {isEdit ? "Edit Task" : "New Task"}
          </DialogTitle>
        </DialogHeader>

        {loadError && (
          <div className="mx-6 mt-4 rounded-lg bg-rose-500/10 border border-rose-500/20 px-3 py-2 text-sm text-rose-300">
            {loadError}
          </div>
        )}

        <form onSubmit={handleSubmit} noValidate>
          <div className="px-6 py-5 space-y-4">
            {/* Title */}
            <div className="space-y-1.5">
              <Label className="text-xs font-medium text-slate-400 uppercase tracking-wide">
                Title <span className="text-rose-400 normal-case tracking-normal">*</span>
              </Label>
              <input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Task title"
                className={fieldClass}
                autoFocus
              />
              {errors.title && (
                <p className="text-xs text-rose-400">{errors.title}</p>
              )}
            </div>

            {/* Description */}
            <div className="space-y-1.5">
              <Label className="text-xs font-medium text-slate-400 uppercase tracking-wide">
                Description
              </Label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Optional details..."
                rows={3}
                className={`${fieldClass} resize-none`}
              />
            </div>

            {/* Project + Assignee */}
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-xs font-medium text-slate-400 uppercase tracking-wide">
                  Project <span className="text-rose-400 normal-case tracking-normal">*</span>
                </Label>
                <select
                  value={projectId}
                  onChange={(e) => setProjectId(e.target.value)}
                  className={fieldClass}
                >
                  <option value="">Select project</option>
                  {projects.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name}
                    </option>
                  ))}
                </select>
                {errors.project_id && (
                  <p className="text-xs text-rose-400">{errors.project_id}</p>
                )}
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-medium text-slate-400 uppercase tracking-wide">
                  Assignee
                </Label>
                <select
                  value={assigneeId}
                  onChange={(e) => setAssigneeId(e.target.value)}
                  className={fieldClass}
                >
                  <option value="">Unassigned</option>
                  {teamMembers.map((m) => (
                    <option key={m.id} value={m.id}>
                      {m.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Status + Priority */}
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-xs font-medium text-slate-400 uppercase tracking-wide">
                  Status
                </Label>
                <select
                  value={status}
                  onChange={(e) => setStatus(e.target.value as TaskStatus)}
                  className={fieldClass}
                >
                  <option value="todo">To Do</option>
                  <option value="in_progress">In Progress</option>
                  <option value="done">Done</option>
                </select>
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-medium text-slate-400 uppercase tracking-wide">
                  Priority
                </Label>
                <select
                  value={priority}
                  onChange={(e) => setPriority(e.target.value as TaskPriority)}
                  className={fieldClass}
                >
                  <option value="urgent">Urgent</option>
                  <option value="high">High</option>
                  <option value="normal">Normal</option>
                  <option value="low">Low</option>
                </select>
              </div>
            </div>

            {/* Due Date */}
            <div className="space-y-1.5">
              <Label className="text-xs font-medium text-slate-400 uppercase tracking-wide">
                Due Date
              </Label>
              <input
                type="date"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                className={fieldClass}
              />
            </div>
          </div>

          {submitError && (
            <div className="mx-6 mb-4 rounded-lg bg-rose-500/10 border border-rose-500/20 px-3 py-2 text-sm text-rose-300">
              {submitError}
            </div>
          )}

          <div className="px-6 pb-6 flex justify-end gap-2 border-t border-white/8 pt-4">
            <button
              type="button"
              onClick={() => onOpenChange(false)}
              className="rounded-lg px-4 py-2 text-sm font-medium text-slate-400 hover:text-slate-200 hover:bg-white/5 transition-[background-color,color] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-500"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="rounded-lg bg-violet-600 px-4 py-2 text-sm font-medium text-white shadow-[0_0_16px_rgba(139,92,246,0.35)] hover:bg-violet-500 active:scale-[0.97] transition-[background-color,transform,opacity] disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-400"
            >
              {submitting ? "Saving…" : isEdit ? "Save Changes" : "Create Task"}
            </button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

export default TaskFormDialog;
