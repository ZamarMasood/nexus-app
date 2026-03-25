"use client";

import { useState, useEffect } from "react";
import { useFormState, useFormStatus } from "react-dom";
import { useRouter } from "next/navigation";
import {
  Plus,
  Pencil,
  Trash2,
  UserCog,
  Loader2,
  X,
  CheckCircle,
  AlertCircle,
  ShieldCheck,
  User,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import type { Project, TeamMemberWithProjects } from "@/lib/types";
import {
  addTeamMemberAction,
  editTeamMemberAction,
  deleteTeamMemberAction,
  type AddMemberState,
  type EditMemberState,
  type DeleteMemberState,
} from "./actions";

// ── Avatar helpers ────────────────────────────────────────────────────────────

const AVATAR_PALETTES = [
  "bg-violet-500/15 text-violet-300 ring-violet-500/25",
  "bg-sky-500/15    text-sky-300    ring-sky-500/25",
  "bg-emerald-500/15 text-emerald-300 ring-emerald-500/25",
  "bg-amber-500/15  text-amber-300  ring-amber-500/25",
  "bg-rose-500/15   text-rose-300   ring-rose-500/25",
  "bg-indigo-500/15 text-indigo-300 ring-indigo-500/25",
];

function getAvatarColor(name: string) {
  let h = 0;
  for (let i = 0; i < name.length; i++) h = name.charCodeAt(i) + ((h << 5) - h);
  return AVATAR_PALETTES[Math.abs(h) % AVATAR_PALETTES.length];
}

function initials(name: string) {
  return name.split(" ").map((w) => w[0]).slice(0, 2).join("").toUpperCase();
}

// ── Toast ─────────────────────────────────────────────────────────────────────

interface Toast {
  id: number;
  message: string;
  type: "success" | "error";
}

function ToastContainer({ toasts, onDismiss }: { toasts: Toast[]; onDismiss: (id: number) => void }) {
  return (
    <div className="fixed top-4 right-4 z-[100] flex flex-col gap-2 pointer-events-none">
      {toasts.map((t) => (
        <div
          key={t.id}
          className={[
            "flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium shadow-lg pointer-events-auto",
            "animate-in slide-in-from-right-4 duration-200",
            t.type === "success"
              ? "bg-emerald-500 text-white"
              : "bg-rose-500 text-white",
          ].join(" ")}
        >
          {t.type === "success" ? <CheckCircle className="h-4 w-4 shrink-0" /> : <AlertCircle className="h-4 w-4 shrink-0" />}
          <span>{t.message}</span>
          <button
            onClick={() => onDismiss(t.id)}
            className="ml-2 opacity-70 hover:opacity-100 transition-opacity"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        </div>
      ))}
    </div>
  );
}

function useToast() {
  const [toasts, setToasts] = useState<Toast[]>([]);
  let counter = 0;

  function push(message: string, type: Toast["type"] = "success") {
    const id = ++counter + Date.now();
    setToasts((prev) => [...prev, { id, message, type }]);
    setTimeout(() => setToasts((prev) => prev.filter((t) => t.id !== id)), 3500);
  }

  function dismiss(id: number) {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }

  return { toasts, push, dismiss };
}

// ── Submit button (reads pending state from form context) ─────────────────────

function SubmitButton({ label, pendingLabel, className }: { label: string; pendingLabel: string; className: string }) {
  const { pending } = useFormStatus();
  return (
    <button type="submit" disabled={pending} className={className}>
      {pending && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
      {pending ? pendingLabel : label}
    </button>
  );
}

// ── Input / field class ───────────────────────────────────────────────────────

const fieldCls =
  "w-full rounded-lg bg-surface-inset border border-surface px-3 py-2.5 text-[13px] text-primary-app placeholder:text-dim-app outline-none focus:border-violet-500/50 focus:ring-1 focus:ring-violet-500/30 transition-[border-color,box-shadow] duration-150";

const labelCls = "block text-[11px] font-semibold uppercase tracking-widest text-faint-app mb-1";

// ── Project multi-select checklist ────────────────────────────────────────────

function ProjectChecklist({
  projects,
  selected,
  onChange,
}: {
  projects: Project[];
  selected: string[];
  onChange: (ids: string[]) => void;
}) {
  if (projects.length === 0) {
    return (
      <p className="text-[12px] text-dim-app italic">
        No projects available. Create projects first.
      </p>
    );
  }

  function toggle(id: string) {
    onChange(
      selected.includes(id) ? selected.filter((s) => s !== id) : [...selected, id]
    );
  }

  return (
    <div className="rounded-xl border border-surface overflow-hidden bg-surface-inset max-h-28 overflow-y-auto mt-2 mb-2">
      <table className="w-full">
        <thead>
          <tr className="border-b border-surface bg-surface-inset">
            <th className="px-5 py-3 text-left text-[10px] font-semibold uppercase tracking-widest text-dim-app w-8">
              <span className="sr-only">Select</span>
            </th>
            <th className="px-5 py-3 text-left text-[10px] font-semibold uppercase tracking-widest text-dim-app">
              Project Name
            </th>
          </tr>
        </thead>
        <tbody>
          {projects.map((p) => {
            const checked = selected.includes(p.id);
            return (
              <tr
                key={p.id}
                onClick={() => toggle(p.id)}
                className={[
                  "border-b border-surface last:border-0 cursor-pointer transition-[background-color] duration-100",
                  checked ? "bg-violet-500/8 hover:bg-violet-500/12" : "hover:bg-overlay-sm",
                ].join(" ")}
              >
                <td className="px-5 py-4">
                  <div
                    className={[
                      "flex h-4 w-4 shrink-0 items-center justify-center rounded border transition-colors duration-150",
                      checked
                        ? "border-violet-500 bg-violet-500"
                        : "border-surface bg-surface-inset",
                    ].join(" ")}
                  >
                    {checked && <span className="block h-2 w-2 rounded-sm bg-white" />}
                  </div>
                  <input
                    type="checkbox"
                    name="project_ids"
                    value={p.id}
                    checked={checked}
                    onChange={() => toggle(p.id)}
                    className="sr-only"
                  />
                </td>
                <td className="px-5 py-4 text-[13px] font-medium text-secondary-app">
                  {p.name}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

// ── Project pills ─────────────────────────────────────────────────────────────

function ProjectPills({ member }: { member: TeamMemberWithProjects }) {
  const allProjects = member.project_members
    .map((pm) => pm.projects)
    .filter((p): p is { id: string; name: string } => p !== null);

  if (allProjects.length === 0) {
    return <span className="text-xs text-dim-app">—</span>;
  }

  const visible = allProjects.slice(0, 3);
  const extra   = allProjects.length - 3;

  return (
    <div className="flex flex-wrap gap-1">
      {visible.map((p) => (
        <span
          key={p.id}
          className="inline-block rounded-full bg-surface-subtle border border-surface px-2 py-0.5 text-[11px] font-medium text-secondary-app"
        >
          {p.name}
        </span>
      ))}
      {extra > 0 && (
        <span className="inline-block rounded-full bg-violet-500/10 border border-violet-500/20 px-2 py-0.5 text-[11px] font-medium text-violet-400">
          +{extra} more
        </span>
      )}
    </div>
  );
}

// ── Role badge ────────────────────────────────────────────────────────────────

function RoleBadge({ userRole }: { userRole: string | null }) {
  const isAdmin = userRole === "admin";
  return (
    <span
      className={[
        "inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-[11px] font-semibold",
        isAdmin
          ? "bg-violet-500/15 text-violet-300 ring-1 ring-violet-500/25"
          : "bg-surface-subtle text-muted-app ring-1 ring-surface",
      ].join(" ")}
    >
      {isAdmin ? <ShieldCheck className="h-3 w-3" /> : <User className="h-3 w-3" />}
      {isAdmin ? "Admin" : "Member"}
    </span>
  );
}

// ── Skeleton row ──────────────────────────────────────────────────────────────

function SkeletonRow() {
  return (
    <tr className="border-b border-surface animate-pulse">
      <td className="px-5 py-4">
        <div className="flex items-center gap-3">
          <div className="h-9 w-9 rounded-full bg-surface-subtle" />
          <div className="h-3.5 w-28 rounded bg-surface-subtle" />
        </div>
      </td>
      <td className="hidden sm:table-cell px-5 py-4"><div className="h-3 w-36 rounded bg-surface-subtle" /></td>
      <td className="px-5 py-4"><div className="h-5 w-16 rounded-full bg-surface-subtle" /></td>
      <td className="hidden lg:table-cell px-5 py-4"><div className="h-5 w-32 rounded bg-surface-subtle" /></td>
      <td className="px-5 py-4"><div className="h-7 w-16 rounded bg-surface-subtle" /></td>
    </tr>
  );
}

// ── Add Member Modal ──────────────────────────────────────────────────────────

const ADD_INITIAL: AddMemberState = { error: null, success: null };

function AddMemberModal({
  open,
  projects,
  onClose,
  onSuccess,
}: {
  open: boolean;
  projects: Project[];
  onClose: () => void;
  onSuccess: (msg: string) => void;
}) {
  const [state, formAction] = useFormState(addTeamMemberAction, ADD_INITIAL);
  const [selectedProjects, setSelectedProjects] = useState<string[]>([]);

  useEffect(() => {
    if (state.success) {
      onSuccess(state.success);
    }
  }, [state.success]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (!open) setSelectedProjects([]);
  }, [open]);

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-lg bg-surface-card border-surface text-primary-app">
        <DialogHeader>
          <DialogTitle className="text-lg font-semibold tracking-[-0.02em] text-bright flex items-center gap-2">
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-violet-500/10">
              <UserCog className="h-3.5 w-3.5 text-violet-400" />
            </div>
            Add Team Member
          </DialogTitle>
        </DialogHeader>

        <form action={formAction} className="mt-4 space-y-4">
          <div className="space-y-1">
            <label htmlFor="add-name" className={labelCls}>Full Name <span className="text-rose-400">*</span></label>
            <input id="add-name" name="name" type="text" required placeholder="Jane Smith" className={fieldCls} />
          </div>

          <div className="space-y-1">
            <label htmlFor="add-email" className={labelCls}>Email <span className="text-rose-400">*</span></label>
            <input id="add-email" name="email" type="email" required placeholder="jane@company.com" className={fieldCls} />
          </div>

          <div className="space-y-1">
            <label htmlFor="add-password" className={labelCls}>Password <span className="text-rose-400">*</span></label>
            <input id="add-password" name="password" type="password" required minLength={8} placeholder="Min. 8 characters" className={fieldCls} />
          </div>

          <input type="hidden" name="user_role" value="member" />

          <div className="space-y-1.5">
            <label className={labelCls}>Assign Projects</label>
            <ProjectChecklist
              projects={projects}
              selected={selectedProjects}
              onChange={setSelectedProjects}
            />
          </div>

          {state.error && (
            <div className="flex items-center gap-2 rounded-lg bg-rose-500/10 border border-rose-500/20 px-4 py-3 text-sm text-rose-400">
              <AlertCircle className="h-4 w-4 shrink-0" />
              {state.error}
            </div>
          )}

          <div className="flex justify-end gap-2 pt-1">
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg px-4 py-2.5 text-[13px] font-medium text-secondary-app bg-surface-subtle hover:bg-surface-inset border border-surface transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-500/40"
            >
              Cancel
            </button>
            <SubmitButton
              label="Add Member"
              pendingLabel="Adding…"
              className="flex items-center gap-2 rounded-lg bg-violet-600 hover:bg-violet-500 px-5 py-2.5 text-[13px] font-semibold text-white shadow-[0_4px_16px_rgba(139,92,246,0.3)] hover:shadow-[0_4px_20px_rgba(139,92,246,0.45)] transition-[background-color,box-shadow] duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-500/60 active:scale-[0.98] disabled:opacity-60 disabled:cursor-not-allowed"
            />
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

// ── Edit Member Modal ─────────────────────────────────────────────────────────

const EDIT_INITIAL: EditMemberState = { error: null, success: null };

function EditMemberModal({
  open,
  member,
  projects,
  onClose,
  onSuccess,
}: {
  open: boolean;
  member: TeamMemberWithProjects | null;
  projects: Project[];
  onClose: () => void;
  onSuccess: (msg: string) => void;
}) {
  const [state, formAction] = useFormState(editTeamMemberAction, EDIT_INITIAL);

  const currentProjectIds = member?.project_members
    .map((pm) => pm.projects?.id)
    .filter((id): id is string => !!id) ?? [];

  const [selectedProjects, setSelectedProjects] = useState<string[]>(currentProjectIds);

  useEffect(() => {
    setSelectedProjects(currentProjectIds);
  }, [member?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (state.success) onSuccess(state.success);
  }, [state.success]); // eslint-disable-line react-hooks/exhaustive-deps

  if (!member) return null;

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-lg bg-surface-card border-surface text-primary-app">
        <DialogHeader>
          <DialogTitle className="text-lg font-semibold tracking-[-0.02em] text-bright flex items-center gap-2">
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-violet-500/10">
              <Pencil className="h-3.5 w-3.5 text-violet-400" />
            </div>
            Edit Member
          </DialogTitle>
        </DialogHeader>

        <form action={formAction} className="mt-4 space-y-4">
          <input type="hidden" name="id" value={member.id} />

          <div className="space-y-1">
            <label htmlFor="edit-name" className={labelCls}>Full Name <span className="text-rose-400">*</span></label>
            <input id="edit-name" name="name" type="text" required defaultValue={member.name} className={fieldCls} />
          </div>

          {/* Email — read-only */}
          <div className="space-y-1">
            <label className={labelCls}>Email</label>
            <input
              type="email"
              value={member.email}
              readOnly
              className="w-full rounded-lg bg-surface-subtle border border-surface px-3 py-2.5 text-[13px] text-faint-app cursor-not-allowed select-none"
            />
            <p className="text-[11px] text-dim-app">Email cannot be changed here.</p>
          </div>

          <input type="hidden" name="user_role" value={member.user_role ?? "member"} />

          <div className="space-y-1.5">
            <label className={labelCls}>Assign Projects</label>
            <ProjectChecklist
              projects={projects}
              selected={selectedProjects}
              onChange={setSelectedProjects}
            />
          </div>

          {state.error && (
            <div className="flex items-center gap-2 rounded-lg bg-rose-500/10 border border-rose-500/20 px-4 py-3 text-sm text-rose-400">
              <AlertCircle className="h-4 w-4 shrink-0" />
              {state.error}
            </div>
          )}

          <div className="flex justify-end gap-2 pt-1">
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg px-4 py-2.5 text-[13px] font-medium text-secondary-app bg-surface-subtle hover:bg-surface-inset border border-surface transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-500/40"
            >
              Cancel
            </button>
            <SubmitButton
              label="Save Changes"
              pendingLabel="Saving…"
              className="flex items-center gap-2 rounded-lg bg-violet-600 hover:bg-violet-500 px-5 py-2.5 text-[13px] font-semibold text-white shadow-[0_4px_16px_rgba(139,92,246,0.3)] hover:shadow-[0_4px_20px_rgba(139,92,246,0.45)] transition-[background-color,box-shadow] duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-500/60 active:scale-[0.98] disabled:opacity-60 disabled:cursor-not-allowed"
            />
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

// ── Delete Confirmation Modal ─────────────────────────────────────────────────

const DELETE_INITIAL: DeleteMemberState = { error: null, success: null };

function DeleteMemberModal({
  open,
  member,
  onClose,
  onSuccess,
}: {
  open: boolean;
  member: TeamMemberWithProjects | null;
  onClose: () => void;
  onSuccess: (msg: string) => void;
}) {
  const [state, formAction] = useFormState(deleteTeamMemberAction, DELETE_INITIAL);

  useEffect(() => {
    if (state.success) onSuccess(state.success);
  }, [state.success]); // eslint-disable-line react-hooks/exhaustive-deps

  if (!member) return null;

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-md bg-surface-card border-surface text-primary-app">
        <DialogHeader>
          <DialogTitle className="text-lg font-semibold tracking-[-0.02em] text-bright flex items-center gap-2">
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-rose-500/10">
              <Trash2 className="h-3.5 w-3.5 text-rose-400" />
            </div>
            Remove Member
          </DialogTitle>
        </DialogHeader>

        <form action={formAction} className="mt-4 space-y-4">
          <input type="hidden" name="id" value={member.id} />

          <p className="text-sm text-secondary-app">
            Are you sure you want to remove{" "}
            <span className="font-semibold text-bright">{member.name}</span> from the team?
            This action cannot be undone.
          </p>

          {state.error && (
            <div className="flex items-center gap-2 rounded-lg bg-rose-500/10 border border-rose-500/20 px-4 py-3 text-sm text-rose-400">
              <AlertCircle className="h-4 w-4 shrink-0" />
              {state.error}
            </div>
          )}

          <div className="flex justify-end gap-2 pt-1">
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg px-4 py-2.5 text-[13px] font-medium text-secondary-app bg-surface-subtle hover:bg-surface-inset border border-surface transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-500/40"
            >
              Cancel
            </button>
            <SubmitButton
              label="Confirm Delete"
              pendingLabel="Deleting…"
              className="flex items-center gap-2 rounded-lg bg-rose-600 hover:bg-rose-500 px-5 py-2.5 text-[13px] font-semibold text-white shadow-[0_4px_16px_rgba(239,68,68,0.25)] hover:shadow-[0_4px_20px_rgba(239,68,68,0.4)] transition-[background-color,box-shadow] duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose-500/60 active:scale-[0.98] disabled:opacity-60 disabled:cursor-not-allowed"
            />
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

// ── Main page component ───────────────────────────────────────────────────────

interface TeamMembersClientProps {
  initialMembers: TeamMemberWithProjects[];
  projects: Project[];
  currentUserId: string;
}

export default function TeamMembersClient({
  initialMembers,
  projects,
  currentUserId,
}: TeamMembersClientProps) {
  const router = useRouter();
  const { toasts, push, dismiss } = useToast();

  const [members, setMembers] = useState<TeamMemberWithProjects[]>(initialMembers);
  const [addOpen, setAddOpen]     = useState(false);
  const [addKey, setAddKey]       = useState(0);
  const [editMember, setEditMember] = useState<TeamMemberWithProjects | null>(null);
  const [editKey, setEditKey]     = useState(0);
  const [deleteMember, setDeleteMember] = useState<TeamMemberWithProjects | null>(null);

  useEffect(() => { setMembers(initialMembers); }, [initialMembers]);

  function handleSuccess(msg: string) {
    push(msg, "success");
    setAddOpen(false);
    setEditMember(null);
    setDeleteMember(null);
    router.refresh();
  }

  return (
    <>
      <ToastContainer toasts={toasts} onDismiss={dismiss} />

      <div className="p-6 sm:p-8 lg:p-10">

        {/* ── Header ─────────────────────────────────────────────────────── */}
        <div
          className="mb-8 flex flex-wrap items-start justify-between gap-3 animate-in"
          style={{ animationDelay: "0ms" }}
        >
          <div>
            <h1 className="text-2xl font-bold tracking-[-0.03em] text-bright leading-none">
              Team Members
            </h1>
            <p className="mt-1.5 text-sm text-faint-app">
              Manage your team and project assignments
            </p>
          </div>
          <Button
            onClick={() => { setAddOpen(true); setAddKey((k) => k + 1); }}
            className="gap-1.5 bg-violet-600 hover:bg-violet-500 text-white shadow-[0_4px_24px_rgba(139,92,246,0.35),0_1px_4px_rgba(0,0,0,0.4)] hover:shadow-[0_4px_28px_rgba(139,92,246,0.5)] transition-[background-color,box-shadow] focus-visible:ring-violet-500"
          >
            <Plus className="h-4 w-4" />
            Add Member
          </Button>
        </div>

        {/* ── Table ──────────────────────────────────────────────────────── */}
        <div
          className="rounded-xl border border-surface animate-in"
          style={{ animationDelay: "80ms" }}
        >
          <div className="overflow-hidden rounded-xl bg-surface-card">
            {members.length === 0 ? (
              <div className="flex flex-col items-center justify-center gap-3 py-20 text-center">
                <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-surface-subtle border border-surface">
                  <UserCog className="h-6 w-6 text-faint-app" />
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-app">No team members yet.</p>
                  <p className="text-xs text-dim-app mt-0.5">Add your first member to get started.</p>
                </div>
                <button
                  onClick={() => setAddOpen(true)}
                  className="mt-1 text-xs font-semibold text-violet-400 hover:text-violet-300 transition-colors"
                >
                  + Add Member
                </button>
              </div>
            ) : (
              <table className="w-full">
                <thead>
                  <tr className="border-b border-surface bg-overlay-xs">
                    <th className="px-5 py-3 text-left text-[10px] font-semibold uppercase tracking-widest text-dim-app">
                      Member
                    </th>
                    <th className="hidden sm:table-cell px-5 py-3 text-left text-[10px] font-semibold uppercase tracking-widest text-dim-app">
                      Email
                    </th>
                    <th className="px-5 py-3 text-left text-[10px] font-semibold uppercase tracking-widest text-dim-app">
                      Role
                    </th>
                    <th className="hidden lg:table-cell px-5 py-3 text-left text-[10px] font-semibold uppercase tracking-widest text-dim-app">
                      Assigned Projects
                    </th>
                    <th className="px-5 py-3 text-right text-[10px] font-semibold uppercase tracking-widest text-dim-app">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {members.map((member, i) => (
                    <tr
                      key={member.id}
                      className="border-b border-surface last:border-0 transition-[background-color] duration-100 hover:bg-overlay-sm animate-in"
                      style={{ animationDelay: `${120 + i * 40}ms` }}
                    >
                      {/* Avatar + Name */}
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-3">
                          <div
                            className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-[11px] font-bold ring-1 ${getAvatarColor(member.name)}`}
                          >
                            {initials(member.name)}
                          </div>
                          <div>
                            <span className="block text-[13px] font-semibold text-bright">
                              {member.name}
                            </span>
                            {member.id === currentUserId && (
                              <span className="block text-[10px] text-violet-400 font-medium">You</span>
                            )}
                          </div>
                        </div>
                      </td>

                      {/* Email */}
                      <td className="hidden sm:table-cell px-5 py-4 text-[13px] text-muted-app">
                        {member.email}
                      </td>

                      {/* Role badge */}
                      <td className="px-5 py-4">
                        <RoleBadge userRole={member.user_role} />
                      </td>

                      {/* Assigned projects */}
                      <td className="hidden lg:table-cell px-5 py-4">
                        <ProjectPills member={member} />
                      </td>

                      {/* Actions */}
                      <td className="px-5 py-4">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => { setEditMember(member); setEditKey((k) => k + 1); }}
                            className="flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-[12px] font-medium text-secondary-app bg-surface-subtle hover:bg-violet-500/10 hover:text-violet-400 border border-surface hover:border-violet-500/20 transition-[background-color,color,border-color] duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-500/40"
                          >
                            <Pencil className="h-3 w-3" />
                            <span className="hidden sm:inline">Edit</span>
                          </button>
                          <button
                            onClick={() => setDeleteMember(member)}
                            disabled={member.id === currentUserId}
                            title={member.id === currentUserId ? "You cannot remove your own account" : undefined}
                            className="flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-[12px] font-medium text-secondary-app bg-surface-subtle hover:bg-rose-500/10 hover:text-rose-400 border border-surface hover:border-rose-500/20 transition-[background-color,color,border-color] duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose-500/40 disabled:opacity-30 disabled:cursor-not-allowed disabled:hover:bg-surface-subtle disabled:hover:text-secondary-app disabled:hover:border-surface"
                          >
                            <Trash2 className="h-3 w-3" />
                            <span className="hidden sm:inline">Delete</span>
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      </div>

      {/* ── Modals ─────────────────────────────────────────────────────────── */}
      <AddMemberModal
        key={addKey}
        open={addOpen}
        projects={projects}
        onClose={() => setAddOpen(false)}
        onSuccess={handleSuccess}
      />

      <EditMemberModal
        key={editKey}
        open={!!editMember}
        member={editMember}
        projects={projects}
        onClose={() => setEditMember(null)}
        onSuccess={handleSuccess}
      />

      <DeleteMemberModal
        open={!!deleteMember}
        member={deleteMember}
        onClose={() => setDeleteMember(null)}
        onSuccess={handleSuccess}
      />
    </>
  );
}
