export default function InvoiceDetailLoading() {
  return (
    <div className="p-4 sm:p-6 lg:p-8 animate-pulse">
      {/* Mobile back button skeleton */}
      <div className="lg:hidden h-5 w-32 rounded bg-[rgba(255,255,255,0.06)] mb-4" />

      <div className="flex gap-6 items-start">
        {/* Sidebar card skeleton — hidden on mobile */}
        <div className="hidden lg:flex w-[300px] shrink-0 flex-col rounded-lg border border-[rgba(255,255,255,0.06)] bg-[#161616] overflow-hidden">
          <div className="px-4 pt-4 pb-3 border-b border-[rgba(255,255,255,0.06)] space-y-3">
            <div className="flex items-center gap-2">
              <div className="h-7 w-7 rounded-lg bg-[rgba(255,255,255,0.06)]" />
              <div className="h-5 w-24 rounded bg-[rgba(255,255,255,0.06)]" />
            </div>
            <div className="h-9 rounded-lg bg-[rgba(255,255,255,0.06)]" />
          </div>
          {[0, 1, 2, 3].map((i) => (
            <div key={i} className="px-4 py-3 border-b border-[rgba(255,255,255,0.06)] last:border-0 space-y-2">
              <div className="flex items-center justify-between">
                <div className="h-4 w-28 rounded bg-[rgba(255,255,255,0.06)]" />
                <div className="h-5 w-14 rounded-full bg-[rgba(255,255,255,0.06)]" />
              </div>
              <div className="flex items-center justify-between">
                <div className="h-3 w-20 rounded bg-[rgba(255,255,255,0.06)]" />
                <div className="h-3 w-16 rounded bg-[rgba(255,255,255,0.06)]" />
              </div>
            </div>
          ))}
        </div>

        {/* Detail skeleton */}
        <div className="flex-1 min-w-0 space-y-6">
          {/* Invoice header card */}
          <div className="rounded-lg border border-[rgba(255,255,255,0.06)] bg-[#161616] overflow-hidden">
            <div className="flex items-start justify-between border-b border-[rgba(255,255,255,0.06)] bg-[rgba(255,255,255,0.06)] px-4 sm:px-6 py-5">
              <div className="space-y-2">
                <div className="h-3 w-16 rounded bg-[rgba(255,255,255,0.06)]" />
                <div className="h-6 w-36 max-w-full rounded bg-[rgba(255,255,255,0.06)]" />
              </div>
              <div className="h-6 w-16 rounded-full bg-[rgba(255,255,255,0.06)]" />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 divide-y sm:divide-y-0 sm:divide-x divide-[rgba(255,255,255,0.06)]">
              {[0, 1, 2].map((i) => (
                <div key={i} className="px-4 sm:px-6 py-4 space-y-2">
                  <div className="h-3 w-14 rounded bg-[rgba(255,255,255,0.06)]" />
                  <div className="h-4 w-24 rounded bg-[rgba(255,255,255,0.06)]" />
                </div>
              ))}
            </div>
            <div className="flex flex-wrap gap-2 border-t border-[rgba(255,255,255,0.06)] px-4 sm:px-6 py-4">
              <div className="h-9 w-28 rounded-lg bg-[rgba(255,255,255,0.06)]" />
              <div className="h-9 w-28 rounded-lg bg-[rgba(255,255,255,0.06)]" />
            </div>
          </div>
          {/* PDF section */}
          <div className="rounded-lg border border-[rgba(255,255,255,0.06)] bg-[#161616] p-4 sm:p-6">
            <div className="flex flex-col items-center gap-4 py-8">
              <div className="h-14 w-14 rounded-full bg-[rgba(255,255,255,0.06)]" />
              <div className="h-4 w-40 max-w-full rounded bg-[rgba(255,255,255,0.06)]" />
              <div className="h-3 w-56 max-w-full rounded bg-[rgba(255,255,255,0.06)]" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
