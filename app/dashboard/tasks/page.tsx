import { getTasksWithAssignees } from "@/lib/db/tasks";
import TasksClient from "./TasksClient";

export default async function TasksPage() {
  const tasks = await getTasksWithAssignees();

  return <TasksClient initialTasks={tasks} />;
}
