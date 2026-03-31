"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import {
  Plus,
  Copy,
  MessageSquare,
  Layers,
  Search,
  X,
  Trash2,
} from "lucide-react";
import { DragDropContext, Droppable, Draggable, DropResult } from "@hello-pangea/dnd";
import type { TaskWithAssignee } from "@/components/tasks/TaskCard";
import { useTaskForm } from "@/app/dashboard/task-form-context";
import { useWorkspaceSlug } from "@/app/dashboard/workspace-context";
import { useSidebarCollapsed } from "@/app/dashboard/DashboardShell";
import { updateTaskStatusAction, createCustomStatusAction, deleteCustomStatusAction } from "@/app/dashboard/tasks/actions";
import type { TaskStatusRow } from "@/lib/db/task-statuses";
import type { TaskStatus } from "@/lib/types";

/* ── Column status icons ───────────────────────────────────────────────── */

function StatusDot({ color, className }: { color: string; className?: string }) {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" className={className}>
      <circle cx="8" cy="8" r="6.5" stroke={color} strokeWidth="1.2" />
      <circle cx="8" cy="8" r="3" fill={color} opacity="0.5" />
    </svg>
  );
}

/* ── Task card — Orchestra style ───────────────────────────────────────── */

function OrchestraCard({
  task,
  onClick,
  isDragging,
}: {
  task: TaskWithAssignee;
  onClick: () => void;
  isDragging?: boolean;
}) {
  const isHighPriority = task.priority === "urgent" || task.priority === "high";

  return (
    <div
      onClick={onClick}
      className={[
        "group relative rounded-[10px] cursor-pointer select-none",
        "bg-[#161616] border border-[rgba(255,255,255,0.07)]",
        "hover:border-[rgba(255,255,255,0.13)]",
        "transition-colors duration-150",
        isDragging
          ? "shadow-[0_16px_48px_rgba(0,0,0,0.8)] scale-[1.015] rotate-[0.5deg]"
          : "",
      ].join(" ")}
    >
      {isHighPriority && (
        <div
          className="absolute top-[6px] left-[6px] w-[6px] h-[6px] rounded-full z-10"
          style={{
            background: task.priority === "urgent" ? "#e5484d" : "#e79d13",
          }}
        />
      )}

      <div className="px-4 pt-4 pb-3">
        <p className="text-[13.5px] text-[#d4d4d4] leading-[1.4]">
          {task.title}
        </p>

        <div className="flex items-center justify-end gap-2 mt-3">
          <button
            onClick={(e) => { e.stopPropagation(); navigator.clipboard.writeText(task.title); }}
            className="opacity-0 group-hover:opacity-100 p-0.5 text-[#333]
              hover:text-[#666] transition-opacity duration-150"
            title="Copy"
          >
            <Copy size={13} />
          </button>
          <span className="flex items-center gap-1 text-[11px] text-[#333]">
            <MessageSquare size={12} />
            <span>0</span>
          </span>
        </div>
      </div>
    </div>
  );
}

/* ── Add Board Dialog ───────────────────────────────────────────────────── */

const PRESET_COLORS = [
  '#e5484d', '#e79d13', '#5e6ad2', '#26c97f',
  '#888888', '#cf69ca', '#3b82f6', '#f97316',
];

function AddBoardDialog({
  open,
  onClose,
  onCreated,
}: {
  open: boolean;
  onClose: () => void;
  onCreated: () => void;
}) {
  const [label, setLabel] = useState('');
  const [color, setColor] = useState('#5e6ad2');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (open) { setLabel(''); setColor('#5e6ad2'); setError(null); }
  }, [open]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!label.trim()) { setError('Name is required'); return; }
    setSubmitting(true);
    setError(null);
    const result = await createCustomStatusAction(label, color);
    setSubmitting(false);
    if (result.error) { setError(result.error); return; }
    onCreated();
    onClose();
  }

  if (!open) return null;

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-[2px] flex items-center justify-center z-50">
      <div className="bg-[#161616] border border-[rgba(255,255,255,0.07)] rounded-lg
        w-full max-w-[400px] shadow-[0_24px_64px_rgba(0,0,0,0.7)]">
        <div className="flex items-center justify-between px-6 pt-5 pb-4
          border-b border-[rgba(255,255,255,0.06)]">
          <div>
            <h3 className="text-[15px] font-medium text-[#e8e8e8]">Add Board Column</h3>
            <p className="text-[11px] text-[#555] mt-1">Create a custom task status</p>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-md text-[#555] hover:text-[#e8e8e8]
            hover:bg-white/5 transition-colors duration-150">
            <X size={16} />
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="px-6 py-4 space-y-4">
            <div>
              <label className="block text-[11px] font-medium text-[#666] uppercase tracking-[0.06em] mb-1.5">
                Name <span className="text-[#e5484d]">*</span>
              </label>
              <input
                value={label}
                onChange={(e) => setLabel(e.target.value)}
                placeholder="e.g. In Testing, Review, QA..."
                autoFocus
                className="w-full px-3 py-2 rounded-md bg-[#1a1a1a] border border-[rgba(255,255,255,0.07)]
                  text-[#e8e8e8] text-[13px] placeholder:text-[#444]
                  focus:outline-none focus:border-[rgba(255,255,255,0.13)]
                  focus:ring-1 focus:ring-[rgba(94,106,210,0.35)]
                  transition-colors duration-150"
              />
            </div>

            <div>
              <label className="block text-[11px] font-medium text-[#666] uppercase tracking-[0.06em] mb-1.5">
                Color
              </label>
              <div className="flex items-center gap-2">
                {PRESET_COLORS.map((c) => (
                  <button
                    key={c}
                    type="button"
                    onClick={() => setColor(c)}
                    className={`w-7 h-7 rounded-md transition-transform duration-150
                      ${color === c ? 'scale-110 ring-2 ring-white/20' : 'hover:scale-105'}`}
                    style={{ background: c }}
                  />
                ))}
              </div>
            </div>

            {/* Preview */}
            <div className="flex items-center gap-2 px-3 py-2 rounded-md bg-[#0d0d0d] border border-[rgba(255,255,255,0.06)]">
              <StatusDot color={color} />
              <span className="text-[13px] text-[#999]">
                {label.trim() || 'Preview'}
              </span>
            </div>
          </div>

          {error && (
            <div className="mx-6 mb-3 rounded-md px-3 py-2 text-[12px] text-[#e5484d]
              bg-[rgba(229,72,77,0.1)] border border-[rgba(229,72,77,0.2)]">
              {error}
            </div>
          )}

          <div className="flex items-center justify-end gap-2 px-6 py-4
            border-t border-[rgba(255,255,255,0.06)]">
            <button type="button" onClick={onClose}
              className="px-3 py-1.5 rounded-md text-[12px] font-medium text-[#888]
                hover:bg-white/5 hover:text-[#e8e8e8] transition-colors duration-150">
              Cancel
            </button>
            <button type="submit" disabled={submitting}
              className="px-3 py-1.5 rounded-md text-[12px] font-medium
                bg-[#5e6ad2] hover:bg-[#6872e5] text-white
                active:scale-[0.98] transition-colors duration-150
                disabled:opacity-50 flex items-center gap-1.5">
              {submitting ? 'Creating...' : 'Add Column'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

/* ── Main component ──────────────────────────────────────────────────── */

interface TasksClientProps {
  initialTasks: TaskWithAssignee[];
  statuses: TaskStatusRow[];
  isAdmin: boolean;
  currentMemberId?: string;
  projectMap?: Record<string, string>;
}

export default function TasksClient({
  initialTasks,
  statuses,
  isAdmin,
  currentMemberId,
  projectMap = {},
}: TasksClientProps) {
  const router = useRouter();
  const slug = useWorkspaceSlug();
  const sidebarCollapsed = useSidebarCollapsed();
  const { openTaskForm } = useTaskForm();
  const [tasks, setTasks] = useState<TaskWithAssignee[]>(initialTasks);
  const [activeTab, setActiveTab] = useState("all");
  const [addBoardOpen, setAddBoardOpen] = useState(false);
  const [deletingStatusId, setDeletingStatusId] = useState<string | null>(null);

  useEffect(() => { setTasks(initialTasks); }, [initialTasks]);

  // Build columns from DB statuses
  const columns = statuses.map((s) => ({
    id: s.slug,
    label: s.label,
    color: s.color,
    statusId: s.id,
    isDefault: s.is_default,
  }));

  const visibleTasks = activeTab === "me" && currentMemberId
    ? tasks.filter((t) => t.assignee_id === currentMemberId)
    : tasks;

  const tasksByStatus: Record<string, TaskWithAssignee[]> = {};
  for (const col of columns) {
    tasksByStatus[col.id] = visibleTasks.filter((t) => t.status === col.id);
  }

  const totalTasks = visibleTasks.length;

  function handleTaskClick(task: TaskWithAssignee) {
    router.push(`/${slug}/tasks/${task.id}`);
  }

  /* ── Drag & drop ───────────────────────────────────────────────────── */

  const pendingUpdatesRef = useRef<Map<string, TaskStatus>>(new Map());

  useEffect(() => {
    setTasks((prev) => {
      if (pendingUpdatesRef.current.size === 0) return initialTasks;
      return initialTasks.map((task) => {
        const pendingStatus = pendingUpdatesRef.current.get(task.id);
        return pendingStatus ? { ...task, status: pendingStatus } : task;
      });
    });
  }, [initialTasks]);

  function canDrag(task: TaskWithAssignee): boolean {
    if (isAdmin) return true;
    if (!currentMemberId) return false;
    return task.assignee_id === currentMemberId;
  }

  const onDragEnd = useCallback(async function onDragEnd(result: DropResult) {
    const { source, destination, draggableId } = result;
    if (!destination) return;
    if (source.droppableId === destination.droppableId && source.index === destination.index) return;

    const draggedTask = tasks.find((t) => t.id === draggableId);
    if (draggedTask && !canDrag(draggedTask)) return;

    const newStatus = destination.droppableId as TaskStatus;
    pendingUpdatesRef.current.set(draggableId, newStatus);

    setTasks((prev) =>
      prev.map((t) => (t.id === draggableId ? { ...t, status: newStatus } : t))
    );

    const updateResult = await updateTaskStatusAction(draggableId, newStatus);
    pendingUpdatesRef.current.delete(draggableId);

    if (updateResult?.error) {
      setTasks((prev) =>
        prev.map((t) =>
          t.id === draggableId ? { ...t, status: source.droppableId as TaskStatus } : t
        )
      );
    } else {
      router.refresh();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [router, tasks]);

  /* ── Delete custom status ─────────────────────────────────────────── */

  async function handleDeleteStatus(statusId: string) {
    setDeletingStatusId(statusId);
    const result = await deleteCustomStatusAction(statusId);
    setDeletingStatusId(null);
    if (!result.error) {
      router.refresh();
    }
  }

  /* ── Tabs ──────────────────────────────────────────────────────────── */

  const tabs = [
    { label: "All tasks", value: "all" },
    ...(currentMemberId ? [{ label: "For me", value: "me" }] : []),
  ];

  return (
    <div className="flex flex-col h-full bg-[#0d0d0d]">

      {/* ═══ Top Toolbar ═══════════════════════════════════════════════════ */}
      <div className="flex items-center justify-between px-6 h-[60px] border-b border-[rgba(255,255,255,0.06)] shrink-0">
        <div className="flex items-center gap-3">
          <Layers size={16} className="text-[#555]" />
          <div>
            <h1 className="text-[15px] font-medium text-[#e8e8e8]">Tasks</h1>
            <p className="text-[11px] text-[#555] mt-0.5">{totalTasks} total tasks</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {isAdmin && (
            <button
              onClick={() => setAddBoardOpen(true)}
              className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium
                text-[#888] hover:text-[#e8e8e8] border border-[rgba(255,255,255,0.08)]
                hover:bg-white/5 transition-colors duration-150"
            >
              <Plus size={14} />
              Add Board
            </button>
          )}
          <button
            onClick={() => openTaskForm()}
            className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium
              bg-[#5e6ad2] hover:bg-[#6872e5] text-white transition-colors duration-150"
          >
            <Plus size={14} />
            New Task
          </button>
        </div>
      </div>

      {/* ═══ Tab Bar ════════════════════════════════════════════════════════ */}
      <div className="flex items-center gap-1 px-6 h-[48px] border-b border-[rgba(255,255,255,0.06)] shrink-0">
        {tabs.map((tab) => (
          <button
            key={tab.value}
            onClick={() => setActiveTab(tab.value)}
            className={[
              "px-3 py-1.5 rounded-lg text-[13px] font-medium transition-colors duration-150",
              activeTab === tab.value
                ? "bg-[#5e6ad2] text-white"
                : "text-[#888] hover:text-[#e8e8e8] hover:bg-white/5",
            ].join(" ")}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* ═══ Kanban board ════════════════════════════════════════════════════ */}
      <div className="flex-1 overflow-x-auto overflow-y-hidden">
        <DragDropContext onDragEnd={onDragEnd}>
          {/* Visible columns: 3 with sidebar open, 4 when collapsed.
              Extra columns scroll horizontally. */}
          <div className="flex h-full min-w-full"
            style={{
              width: columns.length > (sidebarCollapsed ? 4 : 3)
                ? `${columns.length * (sidebarCollapsed ? 25 : 33.333)}%`
                : '100%',
            }}>
            {columns.map((col, colIdx) => {
              const colTasks = tasksByStatus[col.id] ?? [];

              return (
                <div
                  key={col.id}
                  className={[
                    "flex flex-col flex-1 min-w-[280px] h-full",
                    colIdx < columns.length - 1
                      ? "border-r border-[rgba(255,255,255,0.06)]"
                      : "",
                  ].join(" ")}
                >
                  {/* ── Column header ───────────────────────────────── */}
                  <div className="flex items-center justify-between px-4 h-[42px] shrink-0">
                    <div className="flex items-center gap-2">
                      <StatusDot color={col.color} />
                      <span className="text-[13px] text-[#999]">
                        {col.label}
                      </span>
                      {colTasks.length > 0 && (
                        <span className="flex items-center justify-center min-w-[20px] h-[18px]
                          px-1.5 rounded-full text-[10px] font-medium tabular-nums
                          bg-[rgba(229,72,77,0.15)] text-[#e5484d]">
                          {colTasks.length}/{totalTasks}
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-1">
                      {/* Delete button for custom (non-default) statuses */}
                      {isAdmin && !col.isDefault && (
                        <button
                          onClick={() => handleDeleteStatus(col.statusId)}
                          disabled={deletingStatusId === col.statusId}
                          title={`Remove "${col.label}" column`}
                          className="p-0.5 rounded text-[#333] hover:text-[#e5484d]
                            hover:bg-[rgba(229,72,77,0.1)] transition-colors duration-150
                            disabled:opacity-50"
                        >
                          <Trash2 size={12} />
                        </button>
                      )}
                      <button
                        onClick={() => openTaskForm(undefined, col.id)}
                        className="p-0.5 rounded text-[#444] hover:text-[#888]
                          hover:bg-white/5 transition-colors duration-150"
                      >
                        <Plus size={14} />
                      </button>
                    </div>
                  </div>

                  {/* ── Drop zone / card list ───────────────────────── */}
                  <Droppable droppableId={col.id}>
                    {(provided, snapshot) => (
                      <div
                        ref={provided.innerRef}
                        {...provided.droppableProps}
                        className={[
                          "flex-1 overflow-y-auto scrollbar-orchestra",
                          "px-7 pt-2 pb-4",
                          "flex flex-col gap-3",
                          snapshot.isDraggingOver
                            ? "bg-[rgba(255,255,255,0.015)]"
                            : "",
                          "transition-colors duration-150",
                        ].join(" ")}
                      >
                        {colTasks.map((task, index) => {
                          const locked = !canDrag(task);
                          return (
                            <Draggable
                              key={task.id}
                              draggableId={task.id}
                              index={index}
                              isDragDisabled={locked}
                            >
                              {(dragProvided, dragSnapshot) => (
                                <div
                                  ref={dragProvided.innerRef}
                                  {...dragProvided.draggableProps}
                                  {...(locked ? {} : dragProvided.dragHandleProps)}
                                >
                                  <OrchestraCard
                                    task={task}
                                    onClick={() => handleTaskClick(task)}
                                    isDragging={dragSnapshot.isDragging}
                                  />
                                </div>
                              )}
                            </Draggable>
                          );
                        })}
                        {provided.placeholder}

                        {/* Empty state */}
                        {colTasks.length === 0 && !snapshot.isDraggingOver && (
                          <div className="px-1 pt-2">
                            <p className="text-[13px] text-[#888] mb-1">
                              {col.label}
                            </p>
                            <p className="text-[12px] text-[#444] leading-[1.6]">
                              Drag tasks here or create a new one.
                            </p>
                          </div>
                        )}

                      </div>
                    )}
                  </Droppable>
                </div>
              );
            })}
          </div>
        </DragDropContext>
      </div>

      {/* Add Board Dialog */}
      <AddBoardDialog
        open={addBoardOpen}
        onClose={() => setAddBoardOpen(false)}
        onCreated={() => router.refresh()}
      />
    </div>
  );
}
