export default function TeamMembersLoading() {
  return (
    <div className="p-6 sm:p-8 lg:p-10 space-y-8 animate-pulse">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div className="space-y-1.5">
          <div className="h-7 w-40 rounded-lg bg-[rgba(255,255,255,0.06)]" />
          <div className="h-4 w-56 rounded bg-[rgba(255,255,255,0.06)]" />
        </div>
        <div className="h-9 w-32 rounded-lg bg-violet-600/20" />
      </div>

      {/* Table */}
      <div className="rounded-lg border border-[rgba(255,255,255,0.06)] overflow-hidden bg-[#161616]">
        {/* Table header */}
        <div className="border-b border-[rgba(255,255,255,0.06)] bg-[rgba(255,255,255,0.06)] px-5 py-3 flex items-center gap-4">
          <div className="h-2.5 w-16 rounded bg-[rgba(255,255,255,0.06)] min-w-[160px]" />
          <div className="hidden sm:block h-2.5 w-24 rounded bg-[rgba(255,255,255,0.06)] flex-1" />
          <div className="h-2.5 w-10 rounded bg-[rgba(255,255,255,0.06)]" />
          <div className="hidden lg:block h-2.5 w-32 rounded bg-[rgba(255,255,255,0.06)]" />
          <div className="h-2.5 w-14 rounded bg-[rgba(255,255,255,0.06)] ml-auto" />
        </div>

        {/* Table rows */}
        {[0, 1, 2, 3, 4].map((i) => (
          <div
            key={i}
            className="flex items-center gap-4 px-5 py-4 border-b border-[rgba(255,255,255,0.06)] last:border-0"
          >
            {/* Avatar + Name */}
            <div className="flex items-center gap-3 min-w-[160px]">
              <div className="h-9 w-9 shrink-0 rounded-full bg-[rgba(255,255,255,0.06)]" />
              <div className="h-3.5 w-28 rounded bg-[rgba(255,255,255,0.06)]" />
            </div>
            {/* Email */}
            <div className="hidden sm:block h-3 w-40 rounded bg-[rgba(255,255,255,0.06)] flex-1" />
            {/* Role badge */}
            <div className="h-5 w-16 rounded-full bg-[rgba(255,255,255,0.06)]" />
            {/* Assigned projects */}
            <div className="hidden lg:flex items-center gap-1.5">
              <div className="h-5 w-20 rounded-full bg-[rgba(255,255,255,0.06)]" />
              <div className="h-5 w-16 rounded-full bg-[rgba(255,255,255,0.06)]" />
            </div>
            {/* Actions */}
            <div className="flex items-center gap-1.5 ml-auto">
              <div className="h-7 w-14 rounded-lg bg-[rgba(255,255,255,0.06)]" />
              <div className="h-7 w-16 rounded-lg bg-[rgba(255,255,255,0.06)]" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
