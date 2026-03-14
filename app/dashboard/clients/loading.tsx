export default function ClientsLoading() {
  return (
    <div className="p-4 sm:p-6 lg:p-10 space-y-6 animate-pulse">
      {/* Header row */}
      <div className="flex items-start justify-between">
        <div className="space-y-1">
          <div className="h-7 w-24 rounded-lg bg-surface-inset" />
          <div className="h-4 w-32 rounded bg-surface-inset" />
        </div>
        <div className="h-9 w-32 rounded-lg bg-surface-inset" />
      </div>
      {/* Summary cards */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
        {[0, 1, 2].map((i) => (
          <div key={i} className="rounded-2xl border border-surface bg-surface-card p-5 space-y-3">
            <div className="h-9 w-9 rounded-xl bg-overlay-xs" />
            <div className="h-6 w-12 rounded bg-overlay-xs" />
            <div className="h-3 w-20 rounded bg-overlay-xs" />
          </div>
        ))}
      </div>
      {/* Filter tabs */}
      <div className="flex gap-1.5">
        {[0, 1, 2, 3].map((i) => (
          <div key={i} className="h-8 w-20 rounded-lg bg-surface-subtle" />
        ))}
      </div>
      {/* Client cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {[0, 1, 2, 3, 4, 5].map((i) => (
          <div key={i} className="rounded-xl border border-surface bg-surface-card p-5 space-y-3">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-full bg-overlay-xs" />
              <div className="flex-1 space-y-1.5">
                <div className="h-4 w-28 rounded bg-overlay-xs" />
                <div className="h-3 w-36 rounded bg-overlay-xs" />
              </div>
              <div className="h-5 w-14 rounded-full bg-overlay-xs" />
            </div>
            <div className="flex justify-between pt-2 border-t border-surface">
              <div className="h-3 w-20 rounded bg-overlay-xs" />
              <div className="h-3 w-16 rounded bg-overlay-xs" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
