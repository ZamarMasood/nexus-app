'use server';

import { revalidatePath } from 'next/cache';
import { createInvoice } from '@/lib/db/invoices';
import { getCallerOrgId } from '@/lib/db/team-members';
import type { Invoice, InvoiceInsert } from '@/lib/types';

export async function createInvoiceAction(
  payload: Omit<InvoiceInsert, 'org_id'>
): Promise<Invoice> {
  const org_id = await getCallerOrgId();
  const invoice = await createInvoice({ ...payload, org_id });
  revalidatePath('/dashboard', 'layout');
  return invoice;
}