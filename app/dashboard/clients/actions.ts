'use server';

import { randomBytes } from 'crypto';
import bcrypt from 'bcryptjs';
import { revalidatePath } from 'next/cache';
import { createSupabaseServerClient } from '@/lib/supabase-server';
import { getCallerOrgId, getIsAdminByEmail } from '@/lib/db/team-members';
import type { Client, ClientInsert, ClientUpdate } from '@/lib/types';

const BCRYPT_ROUNDS = 10;

/** Strict email format validation */
function validateEmail(email: string): boolean {
  // RFC 5322 simplified — covers real-world addresses
  const re = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)+$/;
  return re.test(email);
}

/** Validate required client fields */
function validateClientPayload(payload: { name?: string | null; email?: string | null }) {
  if (!payload.name || payload.name.trim().length === 0) {
    throw new Error('Client name is required.');
  }
  if (!payload.email || payload.email.trim().length === 0) {
    throw new Error('Client email is required.');
  }
  if (!validateEmail(payload.email.trim())) {
    throw new Error('Please enter a valid email address (e.g. name@company.com).');
  }
}

/**
 * Create a client with bcrypt-hashed portal_password.
 */
export async function createClientAction(payload: ClientInsert): Promise<Client> {
  validateClientPayload(payload);

  const supabase = createSupabaseServerClient();
  const org_id = await getCallerOrgId();

  const data: ClientInsert = { ...payload, email: payload.email!.trim().toLowerCase(), org_id };
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
  // Validate email if it's being updated
  if (updates.email !== undefined) {
    if (!updates.email || !validateEmail(updates.email.trim())) {
      throw new Error('Please enter a valid email address (e.g. name@company.com).');
    }
  }
  if (updates.name !== undefined && (!updates.name || updates.name.trim().length === 0)) {
    throw new Error('Client name is required.');
  }

  const supabase = createSupabaseServerClient();
  const org_id = await getCallerOrgId();

  const data: ClientUpdate = {
    ...updates,
    ...(updates.email ? { email: updates.email.trim().toLowerCase() } : {}),
  };

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
    .eq('org_id', org_id)
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

  // Only admins can reset client passwords
  const { data: { user } } = await supabase.auth.getUser();
  if (!user?.email) throw new Error('Not authenticated');
  const isAdmin = await getIsAdminByEmail(user.email);
  if (!isAdmin) throw new Error('Only admins can reset client passwords.');

  // 8-char alphanumeric — easy to share verbally
  const plainPassword = randomBytes(4).toString('hex').toUpperCase();

  const hashed = await bcrypt.hash(plainPassword, BCRYPT_ROUNDS);

  const org_id = await getCallerOrgId();
  const { data: result, error } = await supabase
    .from('clients')
    .update({ portal_password: hashed })
    .eq('id', clientId)
    .eq('org_id', org_id)
    .select()
    .single();

  if (error) throw new Error(`Failed to reset portal password: ${error.message}`);
  revalidatePath('/dashboard', 'layout');
  return { client: result, plainPassword };
}
