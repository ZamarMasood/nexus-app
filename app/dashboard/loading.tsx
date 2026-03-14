export default function DashboardLoading() {
  return (
    <div className="p-4 sm:p-6 lg:p-10 space-y-6 animate-pulse">
      {/* Greeting + date */}
      <div className="space-y-1">
        <div className="h-8 w-56 rounded-lg bg-surface-inset" />
        <div className="h-4 w-40 rounded bg-surface-inset" />
      </div>
      {/* Stat cards */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        {[0, 1, 2, 3].map((i) => (
          <div key={i} className="rounded-2xl border border-surface bg-surface-card p-5 space-y-3">
            <div className="h-9 w-9 rounded-xl bg-overlay-xs" />
            <div className="h-6 w-16 rounded bg-overlay-xs" />
            <div className="h-3 w-24 rounded bg-overlay-xs" />
          </div>
        ))}
      </div>
      {/* Chart / content area */}
      <div className="h-72 rounded-2xl border border-surface bg-surface-card" />
    </div>
  );
}
