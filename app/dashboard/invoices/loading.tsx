export default function InvoicesLoading() {
  return (
    <div className="p-4 sm:p-6 lg:p-10 space-y-6 animate-pulse">
      {/* Header row */}
      <div className="flex items-start justify-between">
        <div className="space-y-1">
          <div className="h-7 w-28 rounded-lg bg-surface-inset" />
          <div className="h-4 w-36 rounded bg-surface-inset" />
        </div>
        <div className="h-9 w-36 rounded-lg bg-surface-inset" />
      </div>
      {/* Summary cards */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        {[0, 1, 2, 3].map((i) => (
          <div key={i} className="rounded-2xl border border-surface bg-surface-card p-5 space-y-3">
            <div className="h-9 w-9 rounded-xl bg-overlay-xs" />
            <div className="h-6 w-20 rounded bg-overlay-xs" />
            <div className="h-3 w-24 rounded bg-overlay-xs" />
          </div>
        ))}
      </div>
      {/* Filter tabs */}
      <div className="flex gap-1.5">
        {[0, 1, 2, 3].map((i) => (
          <div key={i} className="h-8 w-20 rounded-lg bg-surface-subtle" />
        ))}
      </div>
      {/* Table */}
      <div className="rounded-xl border border-surface bg-surface-card overflow-hidden">
        <div className="border-b border-surface bg-overlay-xs px-5 py-3">
          <div className="flex gap-8">
            {[0, 1, 2, 3, 4].map((i) => (
              <div key={i} className="h-3 w-16 rounded bg-overlay-xs" />
            ))}
          </div>
        </div>
        {[0, 1, 2, 3, 4].map((i) => (
          <div key={i} className="flex items-center gap-8 border-b border-surface px-5 py-3.5 last:border-0">
            <div className="h-4 w-20 rounded bg-overlay-xs" />
            <div className="h-4 w-28 rounded bg-overlay-xs hidden sm:block" />
            <div className="h-4 w-16 rounded bg-overlay-xs" />
            <div className="h-5 w-16 rounded-full bg-overlay-xs" />
            <div className="h-4 w-24 rounded bg-overlay-xs hidden sm:block" />
          </div>
        ))}
      </div>
    </div>
  );
}
