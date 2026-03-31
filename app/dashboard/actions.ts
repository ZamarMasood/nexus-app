'use server';

import { revalidatePath } from 'next/cache';
import { getProjectsForList, getProjectsForListByMember } from '@/lib/db/projects';
import { getClientsForList, getClientsForListByMember } from '@/lib/db/clients';
import { getInvoicesForList, getInvoicesForListByMember } from '@/lib/db/invoices';
import { getTasksWithAssignees, getTasksWithAssigneesByMember } from '@/lib/db/tasks';
import { getTeamMembers } from '@/lib/db/team-members';

/**
 * Revalidate all dashboard pages (including detail pages like /dashboard/invoices/[id])
 * after any data mutation so sidebars and lists reflect fresh data immediately.
 */
export async function revalidateDashboard() {
  // Using 'layout' revalidates the page AND all child routes sharing that layout
  revalidatePath('/dashboard', 'layout');
}

export interface SearchResult {
  id: string;
  type: 'project' | 'task' | 'client' | 'invoice' | 'member';
  title: string;
  subtitle?: string;
  status?: string;
}

/**
 * Fetch all searchable entities for the current user's org.
 * Returns lightweight items for client-side filtering.
 */
export async function fetchSearchData(
  isAdmin: boolean,
  memberId?: string,
): Promise<SearchResult[]> {
  const [projects, clients, invoices, tasks, members] = await Promise.all([
    isAdmin ? getProjectsForList() : memberId ? getProjectsForListByMember(memberId) : [],
    isAdmin ? getClientsForList() : memberId ? getClientsForListByMember(memberId) : [],
    isAdmin ? getInvoicesForList() : memberId ? getInvoicesForListByMember(memberId) : [],
    isAdmin ? getTasksWithAssignees() : memberId ? getTasksWithAssigneesByMember(memberId) : [],
    isAdmin ? getTeamMembers() : [],
  ]);

  const results: SearchResult[] = [];

  for (const p of projects) {
    results.push({ id: p.id, type: 'project', title: p.name, status: p.status ?? undefined });
  }
  for (const c of clients) {
    results.push({ id: c.id, type: 'client', title: c.name, subtitle: c.email ?? undefined, status: c.status ?? undefined });
  }
  for (const inv of invoices) {
    results.push({ id: inv.id, type: 'invoice', title: inv.invoice_number ?? 'Untitled Invoice', subtitle: inv.amount != null ? `$${inv.amount.toLocaleString()}` : undefined, status: inv.status ?? undefined });
  }
  for (const t of tasks) {
    results.push({ id: t.id, type: 'task', title: t.title, subtitle: t.assignee?.name ?? undefined, status: t.status ?? undefined });
  }
  for (const m of members) {
    results.push({ id: m.id, type: 'member', title: m.name, subtitle: m.role ?? m.email });
  }

  return results;
}
