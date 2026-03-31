import Link from 'next/link';

export default function NotFound() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-[#0d0d0d] px-4">
      {/* Ambient glow */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute left-1/2 top-1/3 -translate-x-1/2 -translate-y-1/2 h-[420px] w-[420px] rounded-full bg-[#5e6ad2]/[0.07] blur-[120px]" />
      </div>

      <div className="relative z-10 flex flex-col items-center text-center max-w-md">
        {/* Brand */}
        <div className="mb-8 flex items-center gap-2.5">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-to-br from-violet-500 to-violet-700 shadow-md">
            <span className="text-sm font-medium text-white tracking-tight">N</span>
          </div>
          <span className="text-lg font-medium tracking-[-0.03em] text-[#f0f0f0] font-display">
            Nexus
          </span>
        </div>

        {/* Error code */}
        <h1 className="text-[72px] font-medium leading-none tracking-[-0.04em] text-[#f0f0f0] font-display">
          404
        </h1>
        <p className="mt-2 text-base font-medium text-[#f0f0f0]">
          Page not found
        </p>
        <p className="mt-3 text-sm leading-relaxed text-[#555] max-w-xs">
          The page you are looking for does not exist or has been moved.
        </p>

        {/* Actions */}
        <div className="mt-8 flex flex-col sm:flex-row items-center gap-3">
          <Link
            href="/dashboard"
            /* middleware will redirect /dashboard → /{slug} for authenticated users */
            className="inline-flex items-center gap-2 rounded-lg bg-[#5e6ad2] hover:bg-[#6872e5] px-5 py-2.5 text-[13px] font-medium text-white transition-[background-color,box-shadow,transform] duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[rgba(94,106,210,0.35)] active:scale-[0.98]"
          >
            Go to Dashboard
          </Link>
          <Link
            href="/login"
            className="inline-flex items-center gap-2 rounded-lg border border-[rgba(255,255,255,0.06)] bg-[#161616] hover:bg-[#1a1a1a] px-5 py-2.5 text-[13px] font-medium text-[#f0f0f0] transition-[background-color,border-color,transform] duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[rgba(94,106,210,0.35)] active:scale-[0.98]"
          >
            Go to Login
          </Link>
        </div>
      </div>
    </div>
  );
}
