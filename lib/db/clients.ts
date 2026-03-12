import { supabase } from '../supabase';
import type { Client, ClientInsert, ClientUpdate } from '../types';

export async function getClients(): Promise<Client[]> {
  const { data, error } = await supabase
    .from('clients')
    .select('*')
    .order('name', { ascending: true });

  if (error) throw new Error(`Failed to fetch clients: ${error.message}`);
  return data;
}

export async function getClientById(id: string): Promise<Client> {
  const { data, error } = await supabase
    .from('clients')
    .select('*')
    .eq('id', id)
    .single();

  if (error) throw new Error(`Failed to fetch client ${id}: ${error.message}`);
  return data;
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
