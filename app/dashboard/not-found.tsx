'use client';

import Link from 'next/link';
import { useWorkspaceSlug } from '@/app/dashboard/workspace-context';

export default function DashboardNotFound() {
  const slug = useWorkspaceSlug();

  return (
    <div className="flex flex-1 items-center justify-center px-4 py-20">
      {/* Ambient glow */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 h-[320px] w-[320px] rounded-full bg-violet-600/[0.06] blur-[100px]" />
      </div>

      <div className="relative z-10 flex flex-col items-center text-center max-w-md">
        {/* Error code */}
        <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-violet-500/10 border border-violet-500/20 mb-6">
          <span className="text-2xl font-bold text-violet-400 font-display">404</span>
        </div>

        <h1 className="text-xl font-bold tracking-[-0.03em] text-bright">
          Not Found
        </h1>
        <p className="mt-2 text-sm leading-relaxed text-faint-app max-w-xs">
          This item does not exist or you do not have access.
        </p>

        {/* Action */}
        <Link
          href={`/${slug}`}
          className="mt-6 inline-flex items-center gap-2 rounded-lg bg-violet-600 hover:bg-violet-500 px-5 py-2.5 text-[13px] font-semibold text-white shadow-[0_4px_16px_rgba(139,92,246,0.3)] hover:shadow-[0_4px_20px_rgba(139,92,246,0.45)] transition-[background-color,box-shadow,transform] duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-500/60 active:scale-[0.98]"
        >
          Back to Dashboard
        </Link>
      </div>
    </div>
  );
}
