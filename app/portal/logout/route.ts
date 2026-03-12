import { cookies } from "next/headers";
import { NextResponse } from "next/server";

export async function POST() {
  const cookieStore = cookies();
  cookieStore.delete("portal_client_id");
  return NextResponse.redirect(new URL("/portal/login", process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000"), { status: 303 });
}
