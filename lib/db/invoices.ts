import { supabase } from '../supabase';
import type { Invoice, InvoiceInsert, InvoiceUpdate } from '../types';

export async function getInvoices(clientId?: string): Promise<Invoice[]> {
  let query = supabase.from('invoices').select('*').order('created_at', { ascending: false });

  if (clientId) {
    query = query.eq('client_id', clientId);
  }

  const { data, error } = await query;

  if (error) throw new Error(`Failed to fetch invoices: ${error.message}`);
  return data;
}

export async function getInvoiceById(id: string): Promise<Invoice> {
  const { data, error } = await supabase
    .from('invoices')
    .select('*')
    .eq('id', id)
    .single();

  if (error) throw new Error(`Failed to fetch invoice ${id}: ${error.message}`);
  return data;
}

export async function createInvoice(invoice: InvoiceInsert): Promise<Invoice> {
  const { data, error } = await supabase
    .from('invoices')
    .insert(invoice)
    .select()
    .single();

  if (error) throw new Error(`Failed to create invoice: ${error.message}`);
  return data;
}

export async function updateInvoice(id: string, updates: InvoiceUpdate): Promise<Invoice> {
  const { data, error } = await supabase
    .from('invoices')
    .update(updates)
    .eq('id', id)
    .select()
    .single();

  if (error) throw new Error(`Failed to update invoice ${id}: ${error.message}`);
  return data;
}
