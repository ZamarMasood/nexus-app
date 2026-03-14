export default function ClientDetailLoading() {
  return (
    <div className="p-4 sm:p-6 lg:p-8 animate-pulse">
      {/* Mobile back button skeleton */}
      <div className="lg:hidden h-5 w-28 rounded bg-overlay-xs mb-4" />

      <div className="flex gap-6 items-start">
        {/* Sidebar card skeleton — hidden on mobile */}
        <div className="hidden lg:flex w-[300px] shrink-0 flex-col rounded-xl border border-surface bg-surface-card overflow-hidden">
          <div className="px-4 pt-4 pb-3 border-b border-surface/60 space-y-3">
            <div className="flex items-center gap-2">
              <div className="h-7 w-7 rounded-lg bg-overlay-xs" />
              <div className="h-5 w-20 rounded bg-overlay-xs" />
            </div>
            <div className="h-9 rounded-lg bg-surface-subtle" />
          </div>
          {[0, 1, 2].map((i) => (
            <div key={i} className="px-4 py-3 border-b border-surface/40 last:border-0 space-y-2">
              <div className="flex items-center justify-between">
                <div className="h-4 w-28 rounded bg-overlay-xs" />
                <div className="h-5 w-14 rounded-full bg-overlay-xs" />
              </div>
              <div className="flex items-center justify-between">
                <div className="h-3 w-36 max-w-full rounded bg-overlay-xs" />
                <div className="h-3 w-16 rounded bg-overlay-xs" />
              </div>
            </div>
          ))}
        </div>

        {/* Detail skeleton */}
        <div className="flex-1 min-w-0 space-y-6">
          {/* Client info card */}
          <div className="rounded-xl border border-surface bg-surface-card overflow-hidden">
            <div className="px-4 sm:px-6 pt-5 sm:pt-6 pb-5 flex items-start justify-between">
              <div className="space-y-2 min-w-0">
                <div className="flex items-center gap-3">
                  <div className="h-7 w-40 max-w-full rounded bg-overlay-xs" />
                  <div className="h-5 w-16 rounded-full bg-overlay-xs" />
                </div>
                <div className="h-4 w-48 max-w-full rounded bg-overlay-xs" />
              </div>
              <div className="h-8 w-16 rounded-lg bg-overlay-xs shrink-0" />
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-x-4 gap-y-3 border-t border-surface px-4 sm:px-6 py-4 sm:py-5">
              {[0, 1, 2].map((i) => (
                <div key={i} className="space-y-2">
                  <div className="h-3 w-20 rounded bg-overlay-xs" />
                  <div className="h-4 w-24 rounded bg-overlay-xs" />
                </div>
              ))}
            </div>
          </div>
          {/* Tabs card */}
          <div className="rounded-xl border border-surface bg-surface-card overflow-hidden">
            <div className="flex gap-4 border-b border-surface px-4 pt-3 pb-0">
              <div className="h-8 w-24 rounded bg-overlay-xs" />
              <div className="h-8 w-24 rounded bg-overlay-xs" />
            </div>
            <div className="p-4 space-y-3">
              {[0, 1, 2].map((i) => (
                <div key={i} className="h-12 rounded-lg bg-overlay-xs" />
              ))}
            </div>
          </div>
          {/* Portal access */}
          <div className="rounded-xl border border-surface bg-surface-card px-4 sm:px-6 py-5">
            <div className="h-4 w-28 rounded bg-overlay-xs mb-4" />
            <div className="h-10 rounded-lg bg-overlay-xs" />
          </div>
        </div>
      </div>
    </div>
  );
}
