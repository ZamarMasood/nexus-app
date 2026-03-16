import { supabase } from '../supabase';
import type { Client, ClientInsert, ClientUpdate } from '../types';

// Lightweight type for sidebar/list views — excludes portal_password
export type ClientListItem = Pick<Client, 'id' | 'name' | 'email' | 'status' | 'monthly_rate' | 'project_type' | 'start_date'>;

export async function getClients(): Promise<Client[]> {
  const { data, error } = await supabase
    .from('clients')
    .select('id, name, email, status, monthly_rate, project_type, start_date, created_at')
    .order('created_at', { ascending: false });

  if (error) throw new Error(`Failed to fetch clients: ${error.message}`);
  return data as Client[];
}

/** Fetch only the columns needed for list/sidebar display (no portal_password). */
export async function getClientsForList(): Promise<ClientListItem[]> {
  const { data, error } = await supabase
    .from('clients')
    .select('id, name, email, status, monthly_rate, project_type, start_date')
    .order('created_at', { ascending: false });

  if (error) throw new Error(`Failed to fetch clients: ${error.message}`);
  return data;
}

export async function getClientById(id: string): Promise<Client> {
  const { data, error } = await supabase
    .from('clients')
    .select('id, name, email, status, monthly_rate, project_type, start_date, created_at')
    .eq('id', id)
    .single();

  if (error) throw new Error(`Failed to fetch client ${id}: ${error.message}`);
  return data as Client;
}

export async function createClient(client: ClientInsert): Promise<Client> {
  const { data, error } = await supabase
    .from('clients')
    .insert(client)
    .select()
    .single();

  if (error) throw new Error(`Failed to create client: ${error.message}`);
  return data;
}

export async function updateClient(id: string, updates: ClientUpdate): Promise<Client> {
  const { data, error } = await supabase
    .from('clients')
    .update(updates)
    .eq('id', id)
    .select()
    .single();

  if (error) throw new Error(`Failed to update client ${id}: ${error.message}`);
  return data;
}
