import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { getClientById } from '@/lib/db/clients';
import PortalSettingsClient from './PortalSettingsClient';

export default async function PortalSettingsPage() {
  const cookieStore = cookies();
  const clientId = cookieStore.get('portal_client_id')?.value;
  if (!clientId) redirect('/portal/login');

  const client = await getClientById(clientId).catch(() => null);
  if (!client) redirect('/portal/login');

  return (
    <PortalSettingsClient
      initialName={client.name}
      email={client.email ?? ''}
    />
  );
}
