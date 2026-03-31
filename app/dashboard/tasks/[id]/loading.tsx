export default function TaskDetailLoading() {
  return (
    <div className="p-4 sm:p-6 lg:p-8 animate-pulse">
      {/* Mobile back button */}
      <div className="lg:hidden h-5 w-28 rounded bg-[rgba(255,255,255,0.06)] mb-4" />

      <div className="flex gap-6 items-start">
        {/* ── Left sidebar ──────────────────────────────────── */}
        <aside className="hidden lg:flex w-[300px] shrink-0 flex-col rounded-lg border border-[rgba(255,255,255,0.06)] bg-[#161616] overflow-hidden sticky top-6 h-[calc(100vh-112px)]">
          {/* Sidebar header */}
          <div className="px-4 pt-4 pb-3 border-b border-[rgba(255,255,255,0.06)] space-y-3">
            <div className="flex items-center gap-2">
              <div className="h-7 w-7 rounded-lg bg-[rgba(255,255,255,0.06)]" />
              <div className="h-5 w-32 rounded bg-[rgba(255,255,255,0.06)]" />
            </div>
            <div className="h-9 w-full rounded-lg bg-[rgba(255,255,255,0.06)]" />
          </div>
          {/* Sidebar task items */}
          <div className="flex-1 overflow-hidden">
            {[0, 1, 2, 3, 4].map((i) => (
              <div key={i} className="px-4 py-3 border-b border-[rgba(255,255,255,0.06)] space-y-2">
                <div className="h-4 w-4/5 rounded bg-[rgba(255,255,255,0.06)]" />
                <div className="flex gap-1.5">
                  <div className="h-5 w-20 rounded-full bg-[rgba(255,255,255,0.06)]" />
                  <div className="h-5 w-14 rounded-full bg-[rgba(255,255,255,0.06)]" />
                  <div className="h-4 w-16 rounded bg-[rgba(255,255,255,0.06)]" />
                </div>
              </div>
            ))}
          </div>
        </aside>

        {/* ── Right panel — Task detail ─────────────────────── */}
        <div className="flex-1 min-w-0 space-y-6">
          {/* Task info card */}
          <div className="rounded-lg border border-[rgba(255,255,255,0.06)] bg-[#161616] overflow-hidden">
            <div className="px-4 sm:px-6 pt-5 sm:pt-6 pb-5">
              {/* Status + Priority badges */}
              <div className="flex gap-2 mb-5">
                <div className="h-6 w-24 rounded-full bg-[rgba(255,255,255,0.06)]" />
                <div className="h-6 w-18 rounded-full bg-[rgba(255,255,255,0.06)]" />
              </div>
              {/* Title */}
              <div className="h-7 w-72 max-w-full rounded-md bg-[rgba(255,255,255,0.06)] mb-6" />
              {/* Meta grid */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-x-6 gap-y-4 border-t border-[rgba(255,255,255,0.06)] pt-5">
                {[0, 1, 2, 3].map((i) => (
                  <div key={i} className="space-y-2">
                    <div className="h-2.5 w-14 rounded bg-white/[0.04]" />
                    <div className="h-4 w-24 rounded-md bg-[rgba(255,255,255,0.06)]" />
                  </div>
                ))}
              </div>
              {/* Description */}
              <div className="mt-6 border-t border-[rgba(255,255,255,0.06)] pt-5">
                <div className="h-2.5 w-20 rounded bg-white/[0.04] mb-3" />
                <div className="space-y-2.5">
                  <div className="h-3.5 w-full rounded-md bg-[rgba(255,255,255,0.06)]" />
                  <div className="h-3.5 w-4/5 rounded-md bg-[rgba(255,255,255,0.06)]" />
                  <div className="h-3.5 w-3/5 rounded-md bg-[rgba(255,255,255,0.06)]" />
                </div>
              </div>
            </div>
          </div>

          {/* Attachments card */}
          <div className="rounded-lg border border-[rgba(255,255,255,0.06)] bg-[#161616] p-4 sm:p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <div className="h-4 w-4 rounded bg-[rgba(255,255,255,0.06)]" />
                <div className="h-4 w-24 rounded-md bg-[rgba(255,255,255,0.06)]" />
              </div>
              <div className="h-7 w-24 rounded-lg bg-[rgba(255,255,255,0.06)]" />
            </div>
            <div className="h-24 rounded-lg border border-dashed border-[rgba(255,255,255,0.06)] bg-[rgba(255,255,255,0.06)]" />
          </div>

          {/* Comments card */}
          <div className="rounded-lg border border-[rgba(255,255,255,0.06)] bg-[#161616] p-4 sm:p-6">
            <div className="flex items-center gap-2 mb-5">
              <div className="h-4 w-4 rounded bg-[rgba(255,255,255,0.06)]" />
              <div className="h-4 w-20 rounded-md bg-[rgba(255,255,255,0.06)]" />
            </div>
            <div className="space-y-3">
              {[0, 1].map((i) => (
                <div key={i} className="flex gap-3">
                  <div className="h-8 w-8 shrink-0 rounded-full bg-[rgba(255,255,255,0.06)]" />
                  <div className="flex-1 rounded-lg bg-white/[0.04] h-20" />
                </div>
              ))}
            </div>
            {/* Comment input skeleton */}
            <div className="mt-5 flex gap-3">
              <div className="h-8 w-8 shrink-0 rounded-full bg-[rgba(255,255,255,0.06)]" />
              <div className="flex-1 h-24 rounded-lg border border-[rgba(255,255,255,0.06)] bg-[rgba(255,255,255,0.06)]" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
