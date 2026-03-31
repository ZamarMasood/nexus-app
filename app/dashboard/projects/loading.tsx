export default function ProjectsLoading() {
  return (
    <div className="p-4 sm:p-6 lg:p-10 space-y-6 animate-pulse">
      {/* Header row */}
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <div className="h-7 w-28 rounded-lg bg-[rgba(255,255,255,0.06)]" />
          <div className="h-4 w-36 rounded bg-[rgba(255,255,255,0.06)]" />
        </div>
        <div className="h-9 w-36 rounded-lg bg-[rgba(255,255,255,0.06)]" />
      </div>
      {/* Filter tabs */}
      <div className="flex gap-1.5">
        {[0, 1, 2, 3].map((i) => (
          <div key={i} className="h-8 w-24 rounded-lg bg-[rgba(255,255,255,0.06)]" />
        ))}
      </div>
      {/* Project rows */}
      <div className="space-y-3">
        {[0, 1, 2, 3].map((i) => (
          <div key={i} className="rounded-lg border border-[rgba(255,255,255,0.06)] bg-[#161616] p-5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4 flex-1 min-w-0">
                <div className="h-10 w-10 rounded-lg bg-[rgba(255,255,255,0.06)] shrink-0" />
                <div className="space-y-1.5 flex-1 min-w-0">
                  <div className="h-4 w-40 rounded bg-[rgba(255,255,255,0.06)]" />
                  <div className="h-3 w-24 rounded bg-[rgba(255,255,255,0.06)]" />
                </div>
              </div>
              <div className="flex items-center gap-3 shrink-0">
                <div className="h-5 w-16 rounded-full bg-[rgba(255,255,255,0.06)]" />
                <div className="h-4 w-20 rounded bg-[rgba(255,255,255,0.06)] hidden sm:block" />
                <div className="h-4 w-4 rounded bg-[rgba(255,255,255,0.06)]" />
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
