import { createSupabaseServerClient } from "@/lib/supabase-server";
import { getIsAdminByEmail, getTeamMemberByEmail, getTeamMembers } from "@/lib/db/team-members";
import { getProjects } from "@/lib/db/projects";
import { getTaskStatuses, type TaskStatusRow } from "@/lib/db/task-statuses";
import { getTags, type TagRow } from "@/lib/db/tags";
import { supabaseAdmin } from "@/lib/supabase-admin";
import DashboardShell from "./DashboardShell";
import { WorkspaceSlugProvider } from "./workspace-context";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import type { Project, TeamMember } from "@/lib/types";

export const dynamic = "force-dynamic";

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  let isAdmin = false;
  let currentMemberId: string | undefined;
  let orgName: string | undefined;
  let orgSlug: string = '';
  let memberName: string | undefined;
  let memberAvatarUrl: string | undefined;
  let formProjects: Project[] = [];
  let formTeamMembers: TeamMember[] = [];
  let formTaskStatuses: TaskStatusRow[] = [];
  let formTags: TagRow[] = [];

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
      memberAvatarUrl = member?.avatar_url ?? undefined;
      if (member?.org_id) {
        const [orgResult, projectsResult, membersResult, statusesResult, tagsResult] = await Promise.all([
          supabaseAdmin
            .from('organisations')
            .select('name, slug')
            .eq('id', member.org_id)
            .maybeSingle(),
          getProjects().catch(() => [] as Project[]),
          getTeamMembers().catch(() => [] as TeamMember[]),
          getTaskStatuses(member.org_id).catch(() => [] as TaskStatusRow[]),
          getTags(member.org_id).catch(() => [] as TagRow[]),
        ]);
        const org = orgResult.data as { name: string; slug: string } | null;
        orgName = org?.name ?? undefined;
        orgSlug = org?.slug ?? '';
        formProjects = projectsResult;
        formTeamMembers = membersResult;
        formTaskStatuses = statusesResult;
        formTags = tagsResult;
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

  // If neither header slug nor DB org slug resolved, the user has no
  // associated organisation. Rendering the shell would produce links like
  // `//tasks` that break the app, so redirect them to set up an org first.
  const resolvedSlug = wsSlug || orgSlug;
  if (!resolvedSlug) {
    redirect('/setup-org');
  }

  return (
    <WorkspaceSlugProvider slug={resolvedSlug}>
      <DashboardShell
        isAdmin={isAdmin}
        currentMemberId={currentMemberId}
        orgName={orgName}
        memberName={memberName}
        memberAvatarUrl={memberAvatarUrl}
        slug={resolvedSlug}
        formProjects={formProjects}
        formTeamMembers={formTeamMembers}
        formTaskStatuses={formTaskStatuses}
        formTags={formTags}
      >
        {children}
      </DashboardShell>
    </WorkspaceSlugProvider>
  );
}
