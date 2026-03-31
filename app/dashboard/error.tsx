"use client";

import { useEffect } from "react";

export default function DashboardError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("Dashboard error:", error);
  }, [error]);

  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center gap-4 px-6 text-center">
      <div className="flex h-14 w-14 items-center justify-center rounded-lg
        bg-[rgba(229,72,77,0.12)] border border-[rgba(229,72,77,0.2)]">
        <span className="text-2xl text-[#e5484d]">!</span>
      </div>
      <h2 className="text-[15px] font-medium text-[#f0f0f0]">Something went wrong</h2>
      <p className="max-w-sm text-[13px] text-[#555]">
        An unexpected error occurred. Please try again.
      </p>
      <button
        onClick={reset}
        className="mt-2 inline-flex items-center gap-1.5 px-4 py-2
          bg-[#5e6ad2] hover:bg-[#6872e5] active:scale-[0.98]
          text-white text-[13px] font-medium rounded-md
          transition-colors duration-150"
      >
        Try again
      </button>
    </div>
  );
}
