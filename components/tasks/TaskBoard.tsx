"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import { DragDropContext, Droppable, Draggable, DropResult } from "@hello-pangea/dnd";
import { Plus } from "lucide-react";
import { TaskCard } from "./TaskCard";
import type { TaskWithAssignee } from "./TaskCard";
import { updateTaskStatusAction } from "@/app/dashboard/tasks/actions";
import type { TaskStatus } from "@/lib/types";
import { useTaskForm } from "@/app/dashboard/task-form-context";

interface Column {
  id: TaskStatus;
  label: string;
  headerColor: string;
  headerPill: string;
  dotColor: string;
  dotGlow: string;
  bgColor: string;
  borderColor: string;
  countColor: string;
}

const COLUMNS: Column[] = [
  {
    id: "todo",
    label: "To Do",
    headerColor: "text-secondary-app",
    headerPill: "bg-surface-subtle border border-surface",
    dotColor: "bg-slate-400",
    dotGlow: "shadow-[0_0_6px_rgba(148,163,184,0.7)]",
    bgColor: "bg-overlay-sm",
    borderColor: "border-surface",
    countColor: "text-muted-app",
  },
  {
    id: "in_progress",
    label: "In Progress",
    headerColor: "text-amber-300",
    headerPill: "bg-amber-500/[0.12] border border-amber-500/30 shadow-[0_0_24px_rgba(251,191,36,0.1)]",
    dotColor: "bg-amber-400",
    dotGlow: "shadow-[0_0_8px_rgba(251,191,36,0.9)]",
    bgColor: "bg-amber-500/[0.04]",
    borderColor: "border-amber-500/[0.12]",
    countColor: "text-amber-400/80",
  },
  {
    id: "done",
    label: "Done",
    headerColor: "text-emerald-300",
    headerPill: "bg-emerald-500/[0.12] border border-emerald-500/30 shadow-[0_0_24px_rgba(52,211,153,0.1)]",
    dotColor: "bg-emerald-400",
    dotGlow: "shadow-[0_0_8px_rgba(52,211,153,0.9)]",
    bgColor: "bg-emerald-500/[0.04]",
    borderColor: "border-emerald-500/[0.12]",
    countColor: "text-emerald-400/80",
  },
];

interface TaskBoardProps {
  initialTasks: TaskWithAssignee[];
  onTaskClick?: (task: TaskWithAssignee) => void;
  isAdmin?: boolean;
}

export function TaskBoard({ initialTasks, onTaskClick, isAdmin = false }: TaskBoardProps) {
  const router = useRouter();
  const [tasks, setTasks] = useState<TaskWithAssignee[]>(initialTasks);
  const { openTaskForm, currentMemberId } = useTaskForm();

  /** A task is draggable if the user is admin, or the task is assigned to them. */
  function canDrag(task: TaskWithAssignee): boolean {
    if (isAdmin) return true;
    if (!currentMemberId) return false;
    return task.assignee_id === currentMemberId;
  }

  // Track in-flight optimistic updates so revalidation doesn't overwrite them
  const pendingUpdatesRef = useRef<Map<string, TaskStatus>>(new Map());

  // Sync local state when server re-renders with fresh data,
  // but preserve any in-flight optimistic status changes
  useEffect(() => {
    setTasks((prev) => {
      if (pendingUpdatesRef.current.size === 0) {
        return initialTasks;
      }
      // Merge: use server data but keep optimistic statuses for pending tasks
      return initialTasks.map((task) => {
        const pendingStatus = pendingUpdatesRef.current.get(task.id);
        return pendingStatus ? { ...task, status: pendingStatus } : task;
      });
    });
  }, [initialTasks]);

  const tasksByStatus = COLUMNS.reduce<Record<TaskStatus, TaskWithAssignee[]>>(
    (acc, col) => {
      acc[col.id] = tasks.filter((t) => t.status === col.id);
      return acc;
    },
    { todo: [], in_progress: [], done: [] }
  );

  const onDragEnd = useCallback(async function onDragEnd(result: DropResult) {
    const { source, destination, draggableId } = result;
    if (!destination) return;
    if (source.droppableId === destination.droppableId && source.index === destination.index) return;

    // Safety guard: reject status updates for tasks the user doesn't own
    const draggedTask = tasks.find((t) => t.id === draggableId);
    if (draggedTask && !canDrag(draggedTask)) return;

    const newStatus = destination.droppableId as TaskStatus;

    // Mark this task as having a pending optimistic update
    pendingUpdatesRef.current.set(draggableId, newStatus);

    // Optimistic update
    setTasks((prev) =>
      prev.map((t) => (t.id === draggableId ? { ...t, status: newStatus } : t))
    );

    const updateResult = await updateTaskStatusAction(draggableId, newStatus);

    // Clear the pending flag — server data is now authoritative
    pendingUpdatesRef.current.delete(draggableId);

    if (updateResult?.error) {
      // Revert on failure
      setTasks((prev) =>
        prev.map((t) =>
          t.id === draggableId ? { ...t, status: source.droppableId as TaskStatus } : t
        )
      );
    } else {
      // Force client-side refresh to ensure server data is re-fetched in production
      router.refresh();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps -- canDrag and tasks are refs/state that shouldn't re-create the callback
  }, [router]);

  return (
    <DragDropContext onDragEnd={onDragEnd}>
      {/* overflow-x-auto so the board scrolls horizontally on narrow viewports
          instead of clipping columns. min-w drives the inner flex container. */}
      <div className="overflow-x-auto pb-1">
      <div className="flex flex-col lg:flex-row gap-5 pb-6 lg:min-w-[780px]">
        {COLUMNS.map((col) => {
          const colTasks = tasksByStatus[col.id];
          return (
            <div key={col.id} className="flex w-full lg:flex-1 lg:min-w-[240px] lg:max-w-[420px] flex-col">
              {/* Column header — full-width pill */}
              <div className={`mb-3 flex items-center justify-between rounded-xl px-4 py-2.5 ${col.headerPill}`}>
                <div className="flex items-center gap-2.5">
                  <span className={`h-2 w-2 rounded-full shrink-0 ${col.dotColor} ${col.dotGlow}`} />
                  <h3 className={`text-[13px] font-semibold tracking-[-0.01em] ${col.headerColor}`}>
                    {col.label}
                  </h3>
                </div>
                <span className={`text-[12px] font-bold ${col.countColor}`}>
                  {colTasks.length}
                </span>
              </div>

              {/* Drop zone */}
              <Droppable droppableId={col.id}>
                {(provided, snapshot) => (
                  <div
                    ref={provided.innerRef}
                    {...provided.droppableProps}
                    className={[
                      "flex flex-col gap-2.5 rounded-2xl p-3 min-h-[240px]",
                      "border",
                      snapshot.isDraggingOver
                        ? "border-violet-500/30 bg-violet-500/[0.07] shadow-[0_0_32px_rgba(139,92,246,0.12)]"
                        : `${col.bgColor} ${col.borderColor}`,
                      "transition-[background-color,border-color,box-shadow]",
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
                              <TaskCard
                                task={task}
                                onClick={onTaskClick}
                                isDragging={dragSnapshot.isDragging}
                                isLocked={locked}
                              />
                            </div>
                          )}
                        </Draggable>
                      );
                    })}
                    {provided.placeholder}

                    {colTasks.length === 0 && !snapshot.isDraggingOver && (
                      <div className="flex flex-1 items-center justify-center py-8">
                        <p className="text-xs text-faint-app select-none">Drop tasks here</p>
                      </div>
                    )}
                  </div>
                )}
              </Droppable>

              {/* Add task — only in To Do column */}
              {col.id === "todo" && (
                <button
                  onClick={() => openTaskForm()}
                  className="mt-2 flex items-center gap-1.5 rounded-lg px-2 py-1.5 text-xs text-faint-app hover:bg-surface-subtle hover:text-secondary-app transition-[background-color,color] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-400"
                >
                  <Plus className="h-3.5 w-3.5" />
                  Add task
                </button>
              )}
            </div>
          );
        })}
      </div>
      </div>
    </DragDropContext>
  );
}

export default TaskBoard;
