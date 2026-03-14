import { NextResponse } from 'next/server';
import { createSupabaseServerClient } from '@/lib/supabase-server';
import { getTeamMemberByEmail } from '@/lib/db/team-members';

export async function GET() {
  const supabase = createSupabaseServerClient();
  const { data: { session } } = await supabase.auth.getSession();

  if (!session?.user?.email) {
    return NextResponse.json({ name: null });
  }

  const member = await getTeamMemberByEmail(session.user.email);
  return NextResponse.json({ name: member?.name ?? null });
}
