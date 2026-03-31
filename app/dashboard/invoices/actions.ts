'use server';

import { revalidatePath } from 'next/cache';
import { createInvoice, updateInvoice, getInvoicesPaginated, getInvoicesByMemberPaginated, getInvoicesForSidebar, type InvoiceListItem } from '@/lib/db/invoices';
import { getCallerOrgId, getTeamMemberByEmail } from '@/lib/db/team-members';
import { getClientsForList, getClientsForListByMember, type ClientListItem } from '@/lib/db/clients';
import { createSupabaseServerClient } from '@/lib/supabase-server';
import type { Invoice, InvoiceInsert, InvoiceUpdate } from '@/lib/types';

export async function createInvoiceAction(
  payload: Omit<InvoiceInsert, 'org_id'>
): Promise<Invoice> {
  const org_id = await getCallerOrgId();
  const invoice = await createInvoice({ ...payload, org_id });
  revalidatePath('/dashboard', 'layout');
  return invoice;
}

export async function updateInvoiceAction(
  id: string,
  payload: Omit<InvoiceUpdate, 'org_id' | 'id'>
): Promise<Invoice> {
  await getCallerOrgId(); // ensure caller belongs to an org
  const invoice = await updateInvoice(id, payload);
  revalidatePath('/dashboard', 'layout');
  return invoice;
}

export async function fetchInvoicesPageAction(page: number, pageSize: number) {
  const supabase = createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  const member = user?.email ? await getTeamMemberByEmail(user.email) : null;
  const isAdmin = member?.user_role === 'admin';
  const memberId = member?.id ?? '';

  if (!member?.org_id) return { invoices: [] as Invoice[], total: 0, clients: [] as ClientListItem[] };

  const [result, clients] = await Promise.all([
    isAdmin
      ? getInvoicesPaginated(page, pageSize, member.org_id)
      : getInvoicesByMemberPaginated(memberId, page, pageSize),
    isAdmin
      ? getClientsForList()
      : getClientsForListByMember(memberId),
  ]);

  return { invoices: result.data, total: result.total, clients };
}

/** Server action for sidebar search in invoice detail page. */
export async function searchInvoicesForSidebarAction(search: string, page: number = 0): Promise<InvoiceListItem[]> {
  return getInvoicesForSidebar(5, search || undefined, page);
}