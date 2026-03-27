'use server';

import { revalidatePath } from 'next/cache';
import { createInvoice, updateInvoice } from '@/lib/db/invoices';
import { getCallerOrgId } from '@/lib/db/team-members';
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