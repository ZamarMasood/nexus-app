export default function TasksLoading() {
  return (
    <div className="p-6 sm:p-8 lg:p-10 space-y-6 animate-pulse">
      <div className="flex items-center justify-between">
        <div className="h-8 w-24 rounded-lg bg-surface-inset" />
        <div className="flex gap-2">
          <div className="h-9 w-32 rounded-lg bg-surface-inset" />
          <div className="h-9 w-28 rounded-lg bg-surface-inset" />
        </div>
      </div>
      <div className="flex flex-col lg:flex-row lg:justify-center gap-5">
        {[0, 1, 2].map((col) => (
          <div key={col} className="flex w-full lg:w-[380px] flex-col gap-3">
            <div className="h-10 rounded-xl bg-surface-subtle" />
            <div className="rounded-2xl bg-surface-subtle p-3 min-h-[240px] space-y-2.5">
              {Array.from({ length: col === 1 ? 3 : 2 }).map((_, i) => (
                <div key={i} className="h-28 rounded-xl bg-overlay-sm" />
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
