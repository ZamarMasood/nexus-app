'use server';

import bcrypt from 'bcryptjs';
import { revalidatePath } from 'next/cache';
import { createSupabaseServerClient } from '@/lib/supabase-server';
import type { Client, ClientInsert, ClientUpdate } from '@/lib/types';

const BCRYPT_ROUNDS = 10;

/**
 * Create a client with bcrypt-hashed portal_password.
 */
export async function createClientAction(payload: ClientInsert): Promise<Client> {
  const supabase = createSupabaseServerClient();

  const data: ClientInsert = { ...payload };
  if (data.portal_password) {
    data.portal_password = await bcrypt.hash(data.portal_password, BCRYPT_ROUNDS);
  }

  const { data: result, error } = await supabase
    .from('clients')
    .insert(data)
    .select()
    .single();

  if (error) {
    if (error.code === '23505' && error.message.includes('clients_email_key')) {
      throw new Error('A client already exists with this email.');
    }
    throw new Error(`Failed to create client: ${error.message}`);
  }
  revalidatePath('/dashboard', 'layout');
  return result;
}

/**
 * Update a client. If portal_password is provided (non-empty), hash it.
 * If portal_password is null/undefined/empty, omit it so the existing hash is preserved.
 */
export async function updateClientAction(
  id: string,
  updates: ClientUpdate
): Promise<Client> {
  const supabase = createSupabaseServerClient();

  const data: ClientUpdate = { ...updates };

  if (data.portal_password) {
    data.portal_password = await bcrypt.hash(data.portal_password, BCRYPT_ROUNDS);
  } else {
    // Don't overwrite existing password with null/empty
    delete data.portal_password;
  }

  const { data: result, error } = await supabase
    .from('clients')
    .update(data)
    .eq('id', id)
    .select()
    .single();

  if (error) {
    if (error.code === '23505' && error.message.includes('clients_email_key')) {
      throw new Error('A client already exists with this email.');
    }
    throw new Error(`Failed to update client: ${error.message}`);
  }
  revalidatePath('/dashboard', 'layout');
  return result;
}

/**
 * Generate a random portal password, hash + store it, and return the plain-text
 * password so the admin can copy it and share it with the client.
 * Returns { client, plainPassword }.
 */
export async function resetPortalPasswordAction(
  clientId: string
): Promise<{ client: Client; plainPassword: string }> {
  const supabase = createSupabaseServerClient();

  // 8-char alphanumeric — easy to share verbally
  const plainPassword = Math.random().toString(36).slice(2, 6).toUpperCase() +
    Math.random().toString(36).slice(2, 6).toUpperCase();

  const hashed = await bcrypt.hash(plainPassword, BCRYPT_ROUNDS);

  const { data: result, error } = await supabase
    .from('clients')
    .update({ portal_password: hashed })
    .eq('id', clientId)
    .select()
    .single();

  if (error) throw new Error(`Failed to reset portal password: ${error.message}`);
  revalidatePath('/dashboard', 'layout');
  return { client: result, plainPassword };
}
