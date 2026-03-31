'use client';

import Link from 'next/link';
import { useWorkspaceSlug } from '@/app/dashboard/workspace-context';

export default function DashboardNotFound() {
  const slug = useWorkspaceSlug();

  return (
    <div className="flex flex-1 items-center justify-center px-4 py-20">
      <div className="flex flex-col items-center text-center max-w-md">
        <svg width="48" height="48" viewBox="0 0 48 48" fill="none"
          className="text-[#333] opacity-80 mb-6">
          <rect x="8" y="8" width="32" height="32" rx="6"
            stroke="currentColor" strokeWidth="1.5" fill="none" />
          <rect x="14" y="14" width="20" height="20" rx="4"
            stroke="currentColor" strokeWidth="1.5" fill="none" opacity="0.7" />
          <rect x="20" y="20" width="8" height="8" rx="2"
            stroke="currentColor" strokeWidth="1.5" fill="none" opacity="0.4" />
        </svg>

        <h1 className="text-[15px] font-medium text-[#f0f0f0]">
          Not Found
        </h1>
        <p className="mt-2 text-[13px] text-[#555] max-w-xs">
          This item does not exist or you do not have access.
        </p>

        <Link
          href={`/${slug}`}
          className="mt-6 inline-flex items-center gap-1.5 px-4 py-2
            bg-[#5e6ad2] hover:bg-[#6872e5] active:scale-[0.98]
            text-white text-[13px] font-medium rounded-md
            transition-colors duration-150"
        >
          Back to Dashboard
        </Link>
      </div>
    </div>
  );
}
