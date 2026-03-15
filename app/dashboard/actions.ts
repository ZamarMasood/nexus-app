'use server';

import { revalidatePath } from 'next/cache';

/**
 * Revalidate all dashboard pages (including detail pages like /dashboard/invoices/[id])
 * after any data mutation so sidebars and lists reflect fresh data immediately.
 */
export async function revalidateDashboard() {
  // Using 'layout' revalidates the page AND all child routes sharing that layout
  revalidatePath('/dashboard', 'layout');
}
