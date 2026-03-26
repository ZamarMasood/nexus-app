import type { Metadata } from "next";
import {
  getRecentTasksWithAssignees,
  getRecentTasksWithAssigneesByMember,
  getTaskStats,
  getTaskStatsByMember,
} from "@/lib/db/tasks";
import { getProjects, getProjectsByMember } from "@/lib/db/projects";
import { createSupabaseServerClient } from "@/lib/supabase-server";
import { getTeamMemberByEmail } from "@/lib/db/team-members";
import DashboardClient from "./DashboardClient";

export const metadata: Metadata = { title: "Dashboard" };
export const dynamic = "force-dynamic";

function greeting() {
  const h = new Date().getHours();
  if (h < 12) return "Good morning";
  if (h < 17) return "Good afternoon";
  if (h < 21) return "Good evening";
  return "Good night";
}

export default async function DashboardPage() {
  const supabase = createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  const member = user?.email ? await getTeamMemberByEmail(user.email) : null;
  const isAdmin = member?.user_role === 'admin';
  const memberId = member?.id ?? '';

  const [recentTasks, taskStats, projects] = await Promise.all([
    isAdmin
      ? getRecentTasksWithAssignees(10)
      : getRecentTasksWithAssigneesByMember(memberId, 10),
    isAdmin
      ? getTaskStats()
      : getTaskStatsByMember(memberId),
    isAdmin
      ? getProjects()
      : getProjectsByMember(memberId),
  ]);

  const now = new Date();
  const dateLabel = now.toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" });
  const greetingText = greeting();

  return (
    <DashboardClient
      recentTasks={recentTasks}
      taskStats={taskStats}
      projects={projects}
      userName={member?.name ?? null}
      dateLabel={dateLabel}
      greetingText={greetingText}
    />
  );
}
