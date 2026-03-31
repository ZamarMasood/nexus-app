export default function TasksLoading() {
  return (
    <div className="p-4 sm:p-6 lg:p-10 space-y-6 animate-pulse">
      {/* Header row */}
      <div className="flex items-center justify-between">
        <div className="h-7 w-20 rounded-lg bg-[rgba(255,255,255,0.06)]" />
        <div className="flex gap-2">
          <div className="h-9 w-32 rounded-lg bg-[rgba(255,255,255,0.06)]" />
          <div className="h-9 w-28 rounded-lg bg-[rgba(255,255,255,0.06)]" />
        </div>
      </div>
      {/* Kanban columns — desktop */}
      <div className="hidden lg:flex lg:justify-center gap-5">
        {[0, 1, 2].map((col) => (
          <div key={col} className="flex w-[380px] flex-col gap-3">
            <div className="h-10 rounded-lg bg-[rgba(255,255,255,0.06)]" />
            <div className="rounded-lg bg-[rgba(255,255,255,0.06)] p-3 min-h-[240px] space-y-2.5">
              {Array.from({ length: col === 1 ? 3 : 2 }).map((_, i) => (
                <div key={i} className="rounded-lg bg-[#161616] border border-[rgba(255,255,255,0.06)] p-4 space-y-2">
                  <div className="h-4 w-3/4 rounded bg-[rgba(255,255,255,0.06)]" />
                  <div className="flex items-center gap-2">
                    <div className="h-5 w-14 rounded-full bg-[rgba(255,255,255,0.06)]" />
                    <div className="h-5 w-18 rounded-full bg-[rgba(255,255,255,0.06)]" />
                  </div>
                  <div className="h-3 w-24 rounded bg-[rgba(255,255,255,0.06)]" />
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
      {/* Task list — mobile/tablet */}
      <div className="lg:hidden space-y-2.5">
        {[0, 1, 2, 3, 4].map((i) => (
          <div key={i} className="rounded-lg bg-[#161616] border border-[rgba(255,255,255,0.06)] p-4 space-y-2">
            <div className="h-4 w-3/4 rounded bg-[rgba(255,255,255,0.06)]" />
            <div className="flex items-center gap-2">
              <div className="h-5 w-14 rounded-full bg-[rgba(255,255,255,0.06)]" />
              <div className="h-5 w-18 rounded-full bg-[rgba(255,255,255,0.06)]" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
