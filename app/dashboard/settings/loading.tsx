export default function SettingsLoading() {
  return (
    <div className="p-4 sm:px-6 sm:py-10 animate-pulse">
      {/* Page header */}
      <div className="mb-8 space-y-1.5">
        <div className="h-7 w-44 rounded-lg bg-[rgba(255,255,255,0.06)]" />
        <div className="h-4 w-64 rounded bg-[rgba(255,255,255,0.06)]" />
      </div>

      <div className="flex flex-col lg:flex-row gap-5 items-stretch">
        {/* Profile section skeleton */}
        <div className="flex-1 rounded-lg border border-[rgba(255,255,255,0.06)] bg-[#161616] overflow-hidden">
          <div className="flex items-center gap-3 px-6 py-4 border-b border-[rgba(255,255,255,0.06)] bg-[rgba(255,255,255,0.06)]">
            <div className="h-8 w-8 rounded-lg bg-[rgba(255,255,255,0.06)]" />
            <div className="space-y-1">
              <div className="h-4 w-16 rounded bg-[rgba(255,255,255,0.06)]" />
              <div className="h-3 w-40 rounded bg-[rgba(255,255,255,0.06)]" />
            </div>
          </div>
          <div className="px-6 py-5 space-y-5">
            {/* Avatar + URL */}
            <div className="flex items-center gap-5">
              <div className="h-16 w-16 rounded-full bg-[rgba(255,255,255,0.06)] shrink-0" />
              <div className="flex-1 space-y-1.5">
                <div className="h-3 w-20 rounded bg-[rgba(255,255,255,0.06)]" />
                <div className="h-10 rounded-lg bg-[rgba(255,255,255,0.06)]" />
              </div>
            </div>
            {/* Name */}
            <div className="space-y-1.5">
              <div className="h-3 w-24 rounded bg-[rgba(255,255,255,0.06)]" />
              <div className="h-10 rounded-lg bg-[rgba(255,255,255,0.06)]" />
            </div>
            {/* Role */}
            <div className="space-y-1.5">
              <div className="h-3 w-12 rounded bg-[rgba(255,255,255,0.06)]" />
              <div className="h-10 rounded-lg bg-[rgba(255,255,255,0.06)]" />
            </div>
            {/* Email */}
            <div className="space-y-1.5">
              <div className="h-3 w-14 rounded bg-[rgba(255,255,255,0.06)]" />
              <div className="h-10 rounded-lg bg-[rgba(255,255,255,0.06)]" />
            </div>
            {/* Button */}
            <div className="flex justify-end pt-1">
              <div className="h-10 w-28 rounded-lg bg-[rgba(255,255,255,0.06)]" />
            </div>
          </div>
        </div>

        {/* Security section skeleton */}
        <div className="flex-1 rounded-lg border border-[rgba(255,255,255,0.06)] bg-[#161616] overflow-hidden">
          <div className="flex items-center gap-3 px-6 py-4 border-b border-[rgba(255,255,255,0.06)] bg-[rgba(255,255,255,0.06)]">
            <div className="h-8 w-8 rounded-lg bg-[rgba(255,255,255,0.06)]" />
            <div className="space-y-1">
              <div className="h-4 w-20 rounded bg-[rgba(255,255,255,0.06)]" />
              <div className="h-3 w-36 rounded bg-[rgba(255,255,255,0.06)]" />
            </div>
          </div>
          <div className="px-6 py-5 space-y-5">
            <div className="space-y-1.5">
              <div className="h-3 w-28 rounded bg-[rgba(255,255,255,0.06)]" />
              <div className="h-10 rounded-lg bg-[rgba(255,255,255,0.06)]" />
            </div>
            <div className="space-y-1.5">
              <div className="h-3 w-32 rounded bg-[rgba(255,255,255,0.06)]" />
              <div className="h-10 rounded-lg bg-[rgba(255,255,255,0.06)]" />
            </div>
            <div className="flex justify-end pt-1">
              <div className="h-10 w-36 rounded-lg bg-[rgba(255,255,255,0.06)]" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
