import { createSupabaseServerClient } from "@/lib/supabase-server";
import { getIsAdminByEmail, getTeamMemberByEmail } from "@/lib/db/team-members";
import DashboardShell from "./DashboardShell";

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  let isAdmin = false;
  let currentMemberId: string | undefined;
  try {
    const supabase = createSupabaseServerClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (user?.email) {
      const [adminResult, member] = await Promise.all([
        getIsAdminByEmail(user.email),
        getTeamMemberByEmail(user.email),
      ]);
      isAdmin = adminResult;
      currentMemberId = member?.id;
    }
  } catch {
    // Non-fatal — sidebar just won't show admin link
  }

  return <DashboardShell isAdmin={isAdmin} currentMemberId={currentMemberId}>{children}</DashboardShell>;
}
