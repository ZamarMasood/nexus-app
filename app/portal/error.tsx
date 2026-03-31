"use client";

import { useEffect } from "react";
import { AlertCircle } from "lucide-react";

export default function PortalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("Portal error:", error);
  }, [error]);

  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center gap-4 px-6 text-center">
      <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-[rgba(229,72,77,0.12)] border border-[rgba(229,72,77,0.2)]">
        <AlertCircle className="h-5 w-5 text-[#e5484d]" />
      </div>
      <h2 className="text-[15px] font-medium text-[#e8e8e8]">Something went wrong</h2>
      <p className="max-w-sm text-[13px] text-[#555]">
        We encountered an unexpected error. Please try again or contact your project manager if the
        problem persists.
      </p>
      <button
        onClick={reset}
        className="mt-2 rounded-lg bg-[#5e6ad2] px-4 py-1.5 text-[13px] font-medium text-white
          hover:bg-[#6872e5] transition-colors duration-150
          focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[rgba(94,106,210,0.35)]"
      >
        Try again
      </button>
    </div>
  );
}
