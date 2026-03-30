import { createSupabaseServerClient } from "@/lib/supabase-server";
import { getIsAdminByEmail, getTeamMemberByEmail } from "@/lib/db/team-members";
import { supabaseAdmin } from "@/lib/supabase-admin";
import DashboardShell from "./DashboardShell";
import { WorkspaceSlugProvider } from "./workspace-context";
import { headers } from "next/headers";
import { redirect } from "next/navigation";

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  let isAdmin = false;
  let currentMemberId: string | undefined;
  let orgName: string | undefined;
  let orgSlug: string = '';
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
          .select('name, slug')
          .eq('id', member.org_id)
          .maybeSingle();
        orgName = (org as { name: string; slug: string } | null)?.name ?? undefined;
        orgSlug = (org as { name: string; slug: string } | null)?.slug ?? '';
      }
    }
  } catch {
    // Non-fatal — sidebar just won't show admin link
  }

  // If accessed directly at /dashboard/*, redirect to /{slug}/*
  // Rewritten requests from /{slug}/* have the x-workspace-slug header
  const headersList = headers();
  const wsSlug = headersList.get('x-workspace-slug');

  if (!wsSlug && orgSlug) {
    // Direct /dashboard visit — redirect to slug-based URL
    // Use x-next-url or referer; fallback to rebuilding from x-invoke-path
    const xUrl = headersList.get('x-next-url') || headersList.get('x-invoke-path') || '/dashboard';
    const rest = xUrl.replace(/^\/dashboard/, '');
    redirect(`/${orgSlug}${rest}`);
  }

  return (
    <WorkspaceSlugProvider slug={wsSlug || orgSlug}>
      <DashboardShell
        isAdmin={isAdmin}
        currentMemberId={currentMemberId}
        orgName={orgName}
        memberName={memberName}
        slug={wsSlug || orgSlug}
      >
        {children}
      </DashboardShell>
    </WorkspaceSlugProvider>
  );
}
