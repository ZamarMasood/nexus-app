"use client";

import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { useRouter } from "next/navigation";
import { TaskFormDialog } from "@/components/tasks/TaskForm";

interface TaskFormContextValue {
  openTaskForm: (defaultProjectId?: string) => void;
}

const TaskFormContext = createContext<TaskFormContextValue>({
  openTaskForm: () => {},
});

export function useTaskForm() {
  return useContext(TaskFormContext);
}

export function TaskFormProvider({
  children,
}: {
  children: ReactNode;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [defaultProjectId, setDefaultProjectId] = useState<string | undefined>();

  function openTaskForm(projectId?: string) {
    setDefaultProjectId(projectId);
    setOpen(true);
  }

  // Global "C" keyboard shortcut — skip when focus is in an input/textarea/select
  useEffect(() => {
    function handleKey(e: KeyboardEvent) {
      if (e.key !== "c" && e.key !== "C") return;
      if (e.metaKey || e.ctrlKey || e.altKey) return;
      const tag = (e.target as HTMLElement).tagName;
      if (["INPUT", "TEXTAREA", "SELECT"].includes(tag)) return;
      if ((e.target as HTMLElement).isContentEditable) return;
      e.preventDefault();
      openTaskForm();
    }

    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, []);

  return (
    <TaskFormContext.Provider value={{ openTaskForm }}>
      {children}
      <TaskFormDialog
        open={open}
        onOpenChange={setOpen}
        defaultProjectId={defaultProjectId}
        onSuccess={() => router.refresh()}
      />
    </TaskFormContext.Provider>
  );
}
