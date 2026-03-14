import { getTasksWithAssignees } from "@/lib/db/tasks";
import TasksClient from "./TasksClient";

export const dynamic = "force-dynamic";

export default async function TasksPage() {
  const tasks = await getTasksWithAssignees();

  return <TasksClient initialTasks={tasks} />;
}
