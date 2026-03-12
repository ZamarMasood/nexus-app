"use client";

import { useState } from "react";
import { DragDropContext, Droppable, Draggable, DropResult } from "@hello-pangea/dnd";
import { Plus } from "lucide-react";
import { TaskCard } from "./TaskCard";
import type { TaskWithAssignee } from "./TaskCard";
import { updateTask } from "@/lib/db/tasks";
import type { TaskStatus } from "@/lib/types";

interface Column {
  id: TaskStatus;
  label: string;
  headerColor: string;
  dotColor: string;
  bgColor: string;
  countBadge: string;
}

const COLUMNS: Column[] = [
  {
    id: "todo",
    label: "To Do",
    headerColor: "text-slate-700",
    dotColor: "bg-slate-400",
    bgColor: "bg-slate-100/70",
    countBadge: "bg-slate-200 text-slate-600",
  },
  {
    id: "in_progress",
    label: "In Progress",
    headerColor: "text-amber-900",
    dotColor: "bg-amber-400",
    bgColor: "bg-amber-50",
    countBadge: "bg-amber-100 text-amber-700",
  },
  {
    id: "done",
    label: "Done",
    headerColor: "text-emerald-900",
    dotColor: "bg-emerald-500",
    bgColor: "bg-emerald-50",
    countBadge: "bg-emerald-100 text-emerald-700",
  },
];

interface TaskBoardProps {
  initialTasks: TaskWithAssignee[];
  onTaskClick?: (task: TaskWithAssignee) => void;
}

export function TaskBoard({ initialTasks, onTaskClick }: TaskBoardProps) {
  const [tasks, setTasks] = useState<TaskWithAssignee[]>(initialTasks);

  const tasksByStatus = COLUMNS.reduce<Record<TaskStatus, TaskWithAssignee[]>>(
    (acc, col) => {
      acc[col.id] = tasks.filter((t) => t.status === col.id);
      return acc;
    },
    { todo: [], in_progress: [], done: [] }
  );

  async function onDragEnd(result: DropResult) {
    const { source, destination, draggableId } = result;
    if (!destination) return;
    if (source.droppableId === destination.droppableId && source.index === destination.index) return;

    const newStatus = destination.droppableId as TaskStatus;

    // Optimistic update
    setTasks((prev) =>
      prev.map((t) => (t.id === draggableId ? { ...t, status: newStatus } : t))
    );

    try {
      await updateTask(draggableId, { status: newStatus });
    } catch {
      // Revert on failure
      setTasks((prev) =>
        prev.map((t) =>
          t.id === draggableId ? { ...t, status: source.droppableId as TaskStatus } : t
        )
      );
    }
  }

  return (
    <DragDropContext onDragEnd={onDragEnd}>
      <div className="flex gap-5 overflow-x-auto pb-6">
        {COLUMNS.map((col) => {
          const colTasks = tasksByStatus[col.id];
          return (
            <div key={col.id} className="flex w-[300px] shrink-0 flex-col">
              {/* Column header */}
              <div className="mb-3 flex items-center justify-between px-1">
                <div className="flex items-center gap-2">
                  <span className={`h-2 w-2 rounded-full ${col.dotColor}`} />
                  <h3 className={`text-sm font-semibold tracking-[-0.01em] ${col.headerColor}`}>
                    {col.label}
                  </h3>
                </div>
                <span
                  className={`inline-flex h-5 min-w-[20px] items-center justify-center rounded-full px-1.5 text-[11px] font-semibold ${col.countBadge}`}
                >
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
                      "border border-transparent",
                      col.bgColor,
                      snapshot.isDraggingOver
                        ? "border-violet-200 bg-violet-50/40 shadow-[inset_0_0_0_2px_rgba(139,92,246,0.12)]"
                        : "",
                      "transition-[background-color,border-color,box-shadow]",
                    ].join(" ")}
                  >
                    {colTasks.map((task, index) => (
                      <Draggable key={task.id} draggableId={task.id} index={index}>
                        {(dragProvided, dragSnapshot) => (
                          <div
                            ref={dragProvided.innerRef}
                            {...dragProvided.draggableProps}
                            {...dragProvided.dragHandleProps}
                          >
                            <TaskCard
                              task={task}
                              onClick={onTaskClick}
                              isDragging={dragSnapshot.isDragging}
                            />
                          </div>
                        )}
                      </Draggable>
                    ))}
                    {provided.placeholder}

                    {colTasks.length === 0 && !snapshot.isDraggingOver && (
                      <div className="flex flex-1 items-center justify-center py-8">
                        <p className="text-xs text-slate-400 select-none">Drop tasks here</p>
                      </div>
                    )}
                  </div>
                )}
              </Droppable>

              {/* Add task hint */}
              <button className="mt-2 flex items-center gap-1.5 rounded-lg px-2 py-1.5 text-xs text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition-[background-color,color] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-400">
                <Plus className="h-3.5 w-3.5" />
                Add task
              </button>
            </div>
          );
        })}
      </div>
    </DragDropContext>
  );
}

export default TaskBoard;
