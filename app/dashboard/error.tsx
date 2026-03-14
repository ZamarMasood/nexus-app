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
      <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-rose-500/10 ring-1 ring-rose-500/20">
        <span className="text-2xl">!</span>
      </div>
      <h2 className="text-lg font-semibold text-bright">Something went wrong</h2>
      <p className="max-w-sm text-sm text-faint-app">
        An unexpected error occurred. Please try again.
      </p>
      <button
        onClick={reset}
        className="mt-2 rounded-lg bg-violet-600 px-4 py-2 text-sm font-semibold text-white shadow-[0_2px_8px_rgba(139,92,246,0.3)] transition-[background-color] hover:bg-violet-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-400"
      >
        Try again
      </button>
    </div>
  );
}
