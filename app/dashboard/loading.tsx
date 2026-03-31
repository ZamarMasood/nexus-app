export default function DashboardLoading() {
  return (
    <div className="flex-1 flex flex-col">
      {/* Page header skeleton */}
      <div className="flex items-center justify-between px-6 h-14
        border-b border-[rgba(255,255,255,0.06)] shrink-0">
        <div className="h-4 w-32 rounded bg-[rgba(255,255,255,0.06)] animate-pulse" />
        <div className="h-7 w-24 rounded-md bg-[rgba(255,255,255,0.06)] animate-pulse" />
      </div>

      <div className="p-6 space-y-6 animate-pulse">
        {/* Stat cards */}
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
          {[0, 1, 2, 3].map((i) => (
            <div key={i} className="rounded-lg border border-[rgba(255,255,255,0.06)] bg-[#161616] p-4 space-y-3">
              <div className="h-6 w-12 rounded bg-[rgba(255,255,255,0.06)]" />
              <div className="h-3 w-20 rounded bg-[rgba(255,255,255,0.06)]" />
            </div>
          ))}
        </div>

        {/* Content area */}
        <div className="h-72 rounded-lg border border-[rgba(255,255,255,0.06)] bg-[#161616]" />
      </div>
    </div>
  );
}
