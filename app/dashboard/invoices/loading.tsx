export default function InvoicesLoading() {
  return (
    <div className="p-4 sm:p-6 lg:p-10 space-y-6 animate-pulse">
      {/* Header row */}
      <div className="flex items-start justify-between">
        <div className="space-y-1">
          <div className="h-7 w-28 rounded-lg bg-[rgba(255,255,255,0.06)]" />
          <div className="h-4 w-36 rounded bg-[rgba(255,255,255,0.06)]" />
        </div>
        <div className="h-9 w-36 rounded-lg bg-[rgba(255,255,255,0.06)]" />
      </div>
      {/* Summary cards */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        {[0, 1, 2, 3].map((i) => (
          <div key={i} className="rounded-lg border border-[rgba(255,255,255,0.06)] bg-[#161616] p-5 space-y-3">
            <div className="h-9 w-9 rounded-lg bg-[rgba(255,255,255,0.06)]" />
            <div className="h-6 w-20 rounded bg-[rgba(255,255,255,0.06)]" />
            <div className="h-3 w-24 rounded bg-[rgba(255,255,255,0.06)]" />
          </div>
        ))}
      </div>
      {/* Filter tabs */}
      <div className="flex gap-1.5">
        {[0, 1, 2, 3].map((i) => (
          <div key={i} className="h-8 w-20 rounded-lg bg-[rgba(255,255,255,0.06)]" />
        ))}
      </div>
      {/* Table */}
      <div className="rounded-lg border border-[rgba(255,255,255,0.06)] bg-[#161616] overflow-hidden">
        <div className="border-b border-[rgba(255,255,255,0.06)] bg-[rgba(255,255,255,0.06)] px-5 py-3">
          <div className="flex gap-8">
            {[0, 1, 2, 3, 4].map((i) => (
              <div key={i} className="h-3 w-16 rounded bg-[rgba(255,255,255,0.06)]" />
            ))}
          </div>
        </div>
        {[0, 1, 2, 3, 4].map((i) => (
          <div key={i} className="flex items-center gap-8 border-b border-[rgba(255,255,255,0.06)] px-5 py-3.5 last:border-0">
            <div className="h-4 w-20 rounded bg-[rgba(255,255,255,0.06)]" />
            <div className="h-4 w-28 rounded bg-[rgba(255,255,255,0.06)] hidden sm:block" />
            <div className="h-4 w-16 rounded bg-[rgba(255,255,255,0.06)]" />
            <div className="h-5 w-16 rounded-full bg-[rgba(255,255,255,0.06)]" />
            <div className="h-4 w-24 rounded bg-[rgba(255,255,255,0.06)] hidden sm:block" />
          </div>
        ))}
      </div>
    </div>
  );
}
