export default function TasksLoading() {
  return (
    <div className="p-4 sm:p-6 lg:p-10 space-y-6 animate-pulse">
      {/* Header row */}
      <div className="flex items-center justify-between">
        <div className="h-7 w-20 rounded-lg bg-surface-inset" />
        <div className="flex gap-2">
          <div className="h-9 w-32 rounded-lg bg-surface-inset" />
          <div className="h-9 w-28 rounded-lg bg-surface-inset" />
        </div>
      </div>
      {/* Kanban columns — desktop */}
      <div className="hidden lg:flex lg:justify-center gap-5">
        {[0, 1, 2].map((col) => (
          <div key={col} className="flex w-[380px] flex-col gap-3">
            <div className="h-10 rounded-xl bg-surface-subtle" />
            <div className="rounded-2xl bg-surface-subtle p-3 min-h-[240px] space-y-2.5">
              {Array.from({ length: col === 1 ? 3 : 2 }).map((_, i) => (
                <div key={i} className="rounded-xl bg-surface-card border border-surface p-4 space-y-2">
                  <div className="h-4 w-3/4 rounded bg-overlay-xs" />
                  <div className="flex items-center gap-2">
                    <div className="h-5 w-14 rounded-full bg-overlay-xs" />
                    <div className="h-5 w-18 rounded-full bg-overlay-xs" />
                  </div>
                  <div className="h-3 w-24 rounded bg-overlay-xs" />
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
      {/* Task list — mobile/tablet */}
      <div className="lg:hidden space-y-2.5">
        {[0, 1, 2, 3, 4].map((i) => (
          <div key={i} className="rounded-xl bg-surface-card border border-surface p-4 space-y-2">
            <div className="h-4 w-3/4 rounded bg-overlay-xs" />
            <div className="flex items-center gap-2">
              <div className="h-5 w-14 rounded-full bg-overlay-xs" />
              <div className="h-5 w-18 rounded-full bg-overlay-xs" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
