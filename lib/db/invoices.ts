'use server';
import { supabaseAdmin } from '../supabase-admin';
import { createSupabaseServerClient } from '../supabase-server';
import type { Invoice, InvoiceInsert, InvoiceUpdate } from '../types';

// Lightweight type for sidebar/list views — excludes pdf_url
export type InvoiceListItem = Pick<Invoice, 'id' | 'invoice_number' | 'client_id' | 'amount' | 'status' | 'due_date'>;

export async function getInvoices(clientId?: string): Promise<Invoice[]> {
  const supabase = createSupabaseServerClient();
  let query = supabase.from('invoices').select('*').order('created_at', { ascending: false });

  if (clientId) {
    query = query.eq('client_id', clientId);
  }

  const { data, error } = await query;

  if (error) throw new Error(`Failed to fetch invoices: ${error.message}`);
  return data;
}

/** Fetch only the columns needed for list/sidebar display (no pdf_url). */
export async function getInvoicesForList(clientId?: string): Promise<InvoiceListItem[]> {
  const supabase = createSupabaseServerClient();
  let query = supabase
    .from('invoices')
    .select('id, invoice_number, client_id, amount, status, due_date')
    .order('created_at', { ascending: false });

  if (clientId) {
    query = query.eq('client_id', clientId);
  }

  const { data, error } = await query;

  if (error) throw new Error(`Failed to fetch invoices: ${error.message}`);
  return data;
}

export async function getInvoiceById(id: string): Promise<Invoice> {
  const supabase = createSupabaseServerClient();
  const { data, error } = await supabase
    .from('invoices')
    .select('*')
    .eq('id', id)
    .single();

  if (error) throw new Error(`Failed to fetch invoice ${id}: ${error.message}`);
  return data;
}

export async function createInvoice(invoice: InvoiceInsert): Promise<Invoice> {
  const { data, error } = await supabaseAdmin
    .from('invoices')
    .insert(invoice)
    .select()
    .single();

  if (error) throw new Error(`Failed to create invoice: ${error.message}`);
  return data;
}

export async function updateInvoice(id: string, updates: InvoiceUpdate): Promise<Invoice> {
  const { data, error } = await supabaseAdmin
    .from('invoices')
    .update(updates)
    .eq('id', id)
    .select()
    .single();

  if (error) throw new Error(`Failed to update invoice ${id}: ${error.message}`);
  return data;
}

// ── Member-scoped queries ──────────────────────────────────────────────────────

/** Resolves client IDs reachable by a member via their assigned projects. */
async function getMemberClientIds(memberId: string): Promise<string[]> {
  const supabase = createSupabaseServerClient();

  const { data: memberRows } = await (supabaseAdmin as any)
    .from('project_members')
    .select('project_id')
    .eq('member_id', memberId);

  const projectIds: string[] = (memberRows ?? []).map((r: { project_id: string }) => r.project_id);
  if (projectIds.length === 0) return [];

  const { data: projects } = await supabase
    .from('projects')
    .select('client_id')
    .in('id', projectIds)
    .not('client_id', 'is', null);

  const ids = (projects ?? []).map((p) => p.client_id).filter(Boolean) as string[];
  return ids.filter((id, index) => ids.indexOf(id) === index);
}

/** Fetch all invoices for clients whose projects are assigned to this member. */
export async function getInvoicesByMember(memberId: string): Promise<Invoice[]> {
  const clientIds = await getMemberClientIds(memberId);
  if (clientIds.length === 0) return [];

  const supabase = createSupabaseServerClient();
  const { data, error } = await supabase
    .from('invoices')
    .select('*')
    .in('client_id', clientIds)
    .order('created_at', { ascending: false });

  if (error) throw new Error(`Failed to fetch invoices for member: ${error.message}`);
  return data;
}

/** Lightweight invoice list for a member (no pdf_url). */
export async function getInvoicesForListByMember(memberId: string): Promise<InvoiceListItem[]> {
  const clientIds = await getMemberClientIds(memberId);
  if (clientIds.length === 0) return [];

  const supabase = createSupabaseServerClient();
  const { data, error } = await supabase
    .from('invoices')
    .select('id, invoice_number, client_id, amount, status, due_date')
    .in('client_id', clientIds)
    .order('created_at', { ascending: false });

  if (error) throw new Error(`Failed to fetch invoice list for member: ${error.message}`);
  return data;
}
