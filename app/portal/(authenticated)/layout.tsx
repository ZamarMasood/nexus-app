import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { getClientByIdForPortal } from "@/lib/db/clients";
import PortalSidebar from "@/components/portal/PortalSidebar";

export default async function PortalAuthenticatedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const cookieStore = cookies();
  const clientId = cookieStore.get("portal_client_id")?.value;

  if (!clientId) {
    redirect("/portal/login");
  }

  let clientName = "Client";
  try {
    const client = await getClientByIdForPortal(clientId);
    clientName = client.name;
  } catch {
    // If client lookup fails, still allow access — name is cosmetic only
  }

  return (
    <div className="flex h-screen overflow-hidden flex-col bg-surface-page lg:flex-row">
      <PortalSidebar clientName={clientName} />
      <main className="flex-1 overflow-y-auto">{children}</main>
    </div>
  );
}
