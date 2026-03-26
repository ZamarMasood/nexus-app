import { createSupabaseServerClient } from "@/lib/supabase-server";
import { getIsAdminByEmail, getTeamMemberByEmail } from "@/lib/db/team-members";
import { supabaseAdmin } from "@/lib/supabase-admin";
import DashboardShell from "./DashboardShell";

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  let isAdmin = false;
  let currentMemberId: string | undefined;
  let orgName: string | undefined;
  let memberName: string | undefined;
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
      memberName = member?.name;
      if (member?.org_id) {
        const { data: org } = await supabaseAdmin
          .from('organisations')
          .select('name')
          .eq('id', member.org_id)
          .maybeSingle();
        orgName = (org as { name: string } | null)?.name ?? undefined;
      }
    }
  } catch {
    // Non-fatal — sidebar just won't show admin link
  }

  return <DashboardShell isAdmin={isAdmin} currentMemberId={currentMemberId} orgName={orgName} memberName={memberName}>{children}</DashboardShell>;
}
