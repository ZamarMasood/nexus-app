import { getTasksWithAssignees } from "@/lib/db/tasks";
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
  const [tasks, projects, userName] = await Promise.all([
    getTasksWithAssignees(),
    getProjects(),
    (async () => {
      try {
        const supabase = createSupabaseServerClient();
        const { data: { user } } = await supabase.auth.getUser();
        if (!user?.email) return null;
        const member = await getTeamMemberByEmail(user.email);
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
      tasks={tasks}
      projects={projects}
      userName={userName}
      dateLabel={dateLabel}
      greetingText={greetingText}
    />
  );
}
