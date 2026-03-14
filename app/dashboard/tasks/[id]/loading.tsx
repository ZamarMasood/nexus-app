export default function TaskDetailLoading() {
  return (
    <div className="p-4 sm:p-6 lg:p-8 animate-pulse">
      {/* Back button skeleton */}
      <div className="h-5 w-28 rounded bg-overlay-xs mb-6" />

      {/* Task header card */}
      <div className="rounded-2xl border border-surface bg-surface-card overflow-hidden">
        <div className="px-4 sm:px-6 py-5 space-y-4 border-b border-surface">
          <div className="flex items-start justify-between gap-4">
            <div className="space-y-2 flex-1 min-w-0">
              <div className="h-7 w-3/4 max-w-xs rounded bg-overlay-xs" />
              <div className="flex gap-2">
                <div className="h-5 w-20 rounded-full bg-overlay-xs" />
                <div className="h-5 w-16 rounded-full bg-overlay-xs" />
              </div>
            </div>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
            {[0, 1, 2].map((i) => (
              <div key={i} className="space-y-2">
                <div className="h-3 w-16 rounded bg-overlay-xs" />
                <div className="h-4 w-24 rounded bg-overlay-xs" />
              </div>
            ))}
          </div>
        </div>

        {/* Description skeleton */}
        <div className="px-4 sm:px-6 py-5 space-y-2 border-b border-surface">
          <div className="h-3 w-20 rounded bg-overlay-xs" />
          <div className="h-4 w-full rounded bg-overlay-xs" />
          <div className="h-4 w-3/4 rounded bg-overlay-xs" />
        </div>
      </div>

      {/* Comments + Files section */}
      <div className="mt-6 space-y-4">
        <div className="flex gap-3">
          <div className="h-8 w-28 rounded-lg bg-overlay-xs" />
          <div className="h-8 w-20 rounded-lg bg-overlay-xs" />
        </div>
        <div className="rounded-xl border border-surface bg-surface-card divide-y divide-surface">
          {[0, 1, 2].map((i) => (
            <div key={i} className="px-4 sm:px-5 py-4 space-y-2">
              <div className="flex items-center gap-2">
                <div className="h-6 w-6 rounded-full bg-overlay-xs" />
                <div className="h-3 w-24 rounded bg-overlay-xs" />
              </div>
              <div className="h-4 w-5/6 rounded bg-overlay-xs ml-8" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
