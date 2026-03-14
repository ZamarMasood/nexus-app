import { getRecentTasksWithAssignees, getTaskStats } from "@/lib/db/tasks";
import { getProjects } from "@/lib/db/projects";
import { createSupabaseServerClient } from "@/lib/supabase-server";
import { getTeamMemberByEmail } from "@/lib/db/team-members";
import DashboardClient from "./DashboardClient";

function greeting() {
  const h = new Date().getHours();
  if (h < 12) return "Good morning";
  if (h < 17) return "Good afternoon";
  return "Good evening";
}

export default async function DashboardPage() {
  // Fetch lightweight stats + only 10 recent tasks (with joins) in parallel
  const [recentTasks, taskStats, projects, userName] = await Promise.all([
    getRecentTasksWithAssignees(10),
    getTaskStats(),
    getProjects(),
    (async () => {
      try {
        const supabase = createSupabaseServerClient();
        // Use getSession() (reads JWT locally) instead of getUser() (network call).
        // Middleware already validated the session; we just need the email here.
        const { data: { session } } = await supabase.auth.getSession();
        const email = session?.user?.email;
        if (!email) return null;
        const member = await getTeamMemberByEmail(email);
        return member?.name ?? null;
      } catch {
        return null;
      }
    })(),
  ]);

  const now = new Date();
  const dateLabel = now.toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" });
  const greetingText = greeting();

  return (
    <DashboardClient
      recentTasks={recentTasks}
      taskStats={taskStats}
      projects={projects}
      userName={userName}
      dateLabel={dateLabel}
      greetingText={greetingText}
    />
  );
}
