export default function ClientsLoading() {
  return (
    <div className="p-6 sm:p-8 lg:p-10 space-y-6 animate-pulse">
      {/* Header row */}
      <div className="flex items-start justify-between">
        <div className="space-y-1">
          <div className="h-7 w-24 rounded-lg bg-[rgba(255,255,255,0.06)]" />
          <div className="h-4 w-32 rounded bg-[rgba(255,255,255,0.06)]" />
        </div>
        <div className="h-9 w-32 rounded-lg bg-violet-600/20" />
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {[0, 1, 2].map((i) => (
          <div key={i} className="relative overflow-hidden rounded-lg border border-[rgba(255,255,255,0.06)] bg-[#161616] p-5 space-y-3">
            <div className="h-9 w-9 rounded-lg bg-[rgba(255,255,255,0.06)]" />
            <div className="h-7 w-24 rounded-md bg-[rgba(255,255,255,0.06)]" />
            <div className="h-3 w-20 rounded bg-[rgba(255,255,255,0.06)]" />
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
      <div className="rounded-lg border border-[rgba(255,255,255,0.06)] overflow-hidden bg-[#161616]">
        {/* Table header */}
        <div className="border-b border-[rgba(255,255,255,0.06)] bg-[rgba(255,255,255,0.06)] px-3 sm:px-5 py-3 flex gap-4">
          <div className="h-2.5 w-16 rounded bg-[rgba(255,255,255,0.06)]" />
          <div className="hidden sm:block h-2.5 w-16 rounded bg-[rgba(255,255,255,0.06)]" />
          <div className="h-2.5 w-14 rounded bg-[rgba(255,255,255,0.06)]" />
          <div className="hidden sm:block h-2.5 w-20 rounded bg-[rgba(255,255,255,0.06)]" />
          <div className="hidden sm:block h-2.5 w-24 rounded bg-[rgba(255,255,255,0.06)]" />
        </div>
        {/* Table rows */}
        {[0, 1, 2, 3, 4, 5].map((i) => (
          <div key={i} className="flex items-center gap-4 px-3 sm:px-5 py-3.5 border-b border-[rgba(255,255,255,0.06)] last:border-0">
            {/* Avatar + Name */}
            <div className="flex items-center gap-3 min-w-[140px]">
              <div className="h-8 w-8 shrink-0 rounded-full bg-[rgba(255,255,255,0.06)]" />
              <div className="h-4 w-24 rounded bg-[rgba(255,255,255,0.06)]" />
            </div>
            {/* Email */}
            <div className="hidden sm:block h-4 w-36 rounded bg-[rgba(255,255,255,0.06)] flex-1" />
            {/* Status badge */}
            <div className="h-5 w-16 rounded-full bg-[rgba(255,255,255,0.06)]" />
            {/* Monthly rate */}
            <div className="hidden sm:block h-4 w-20 rounded bg-[rgba(255,255,255,0.06)]" />
            {/* Active projects */}
            <div className="hidden sm:block h-4 w-16 rounded bg-[rgba(255,255,255,0.06)]" />
            {/* Chevron */}
            <div className="h-4 w-4 rounded bg-[rgba(255,255,255,0.06)] ml-auto" />
          </div>
        ))}
      </div>
    </div>
  );
}
