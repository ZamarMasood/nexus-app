export default function ClientsLoading() {
  return (
    <div className="p-6 sm:p-8 lg:p-10 space-y-6 animate-pulse">
      {/* Header row */}
      <div className="flex items-start justify-between">
        <div className="space-y-1">
          <div className="h-7 w-24 rounded-lg bg-surface-inset" />
          <div className="h-4 w-32 rounded bg-surface-inset" />
        </div>
        <div className="h-9 w-32 rounded-lg bg-violet-600/20" />
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {[0, 1, 2].map((i) => (
          <div key={i} className="relative overflow-hidden rounded-2xl border border-surface bg-surface-card p-5 space-y-3">
            <div className="h-9 w-9 rounded-xl bg-overlay-xs" />
            <div className="h-7 w-24 rounded-md bg-overlay-xs" />
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

      {/* Table */}
      <div className="rounded-xl border border-surface overflow-hidden bg-surface-card">
        {/* Table header */}
        <div className="border-b border-surface bg-overlay-xs px-3 sm:px-5 py-3 flex gap-4">
          <div className="h-2.5 w-16 rounded bg-overlay-xs" />
          <div className="hidden sm:block h-2.5 w-16 rounded bg-overlay-xs" />
          <div className="h-2.5 w-14 rounded bg-overlay-xs" />
          <div className="hidden sm:block h-2.5 w-20 rounded bg-overlay-xs" />
          <div className="hidden sm:block h-2.5 w-24 rounded bg-overlay-xs" />
        </div>
        {/* Table rows */}
        {[0, 1, 2, 3, 4, 5].map((i) => (
          <div key={i} className="flex items-center gap-4 px-3 sm:px-5 py-3.5 border-b border-surface last:border-0">
            {/* Avatar + Name */}
            <div className="flex items-center gap-3 min-w-[140px]">
              <div className="h-8 w-8 shrink-0 rounded-full bg-overlay-xs" />
              <div className="h-4 w-24 rounded bg-overlay-xs" />
            </div>
            {/* Email */}
            <div className="hidden sm:block h-4 w-36 rounded bg-overlay-xs flex-1" />
            {/* Status badge */}
            <div className="h-5 w-16 rounded-full bg-overlay-xs" />
            {/* Monthly rate */}
            <div className="hidden sm:block h-4 w-20 rounded bg-overlay-xs" />
            {/* Active projects */}
            <div className="hidden sm:block h-4 w-16 rounded bg-overlay-xs" />
            {/* Chevron */}
            <div className="h-4 w-4 rounded bg-overlay-xs ml-auto" />
          </div>
        ))}
      </div>
    </div>
  );
}
