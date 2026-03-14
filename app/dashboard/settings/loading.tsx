export default function SettingsLoading() {
  return (
    <div className="p-4 sm:px-6 sm:py-10 animate-pulse">
      {/* Page header */}
      <div className="mb-8 space-y-1.5">
        <div className="h-7 w-44 rounded-lg bg-surface-inset" />
        <div className="h-4 w-64 rounded bg-surface-inset" />
      </div>

      <div className="flex flex-col lg:flex-row gap-5 items-stretch">
        {/* Profile section skeleton */}
        <div className="flex-1 rounded-2xl border border-surface bg-surface-card overflow-hidden">
          <div className="flex items-center gap-3 px-6 py-4 border-b border-surface bg-overlay-xs">
            <div className="h-8 w-8 rounded-lg bg-overlay-xs" />
            <div className="space-y-1">
              <div className="h-4 w-16 rounded bg-overlay-xs" />
              <div className="h-3 w-40 rounded bg-overlay-xs" />
            </div>
          </div>
          <div className="px-6 py-5 space-y-5">
            {/* Avatar + URL */}
            <div className="flex items-center gap-5">
              <div className="h-16 w-16 rounded-full bg-overlay-xs shrink-0" />
              <div className="flex-1 space-y-1.5">
                <div className="h-3 w-20 rounded bg-overlay-xs" />
                <div className="h-10 rounded-lg bg-overlay-xs" />
              </div>
            </div>
            {/* Name */}
            <div className="space-y-1.5">
              <div className="h-3 w-24 rounded bg-overlay-xs" />
              <div className="h-10 rounded-lg bg-overlay-xs" />
            </div>
            {/* Role */}
            <div className="space-y-1.5">
              <div className="h-3 w-12 rounded bg-overlay-xs" />
              <div className="h-10 rounded-lg bg-overlay-xs" />
            </div>
            {/* Email */}
            <div className="space-y-1.5">
              <div className="h-3 w-14 rounded bg-overlay-xs" />
              <div className="h-10 rounded-lg bg-overlay-xs" />
            </div>
            {/* Button */}
            <div className="flex justify-end pt-1">
              <div className="h-10 w-28 rounded-lg bg-overlay-xs" />
            </div>
          </div>
        </div>

        {/* Security section skeleton */}
        <div className="flex-1 rounded-2xl border border-surface bg-surface-card overflow-hidden">
          <div className="flex items-center gap-3 px-6 py-4 border-b border-surface bg-overlay-xs">
            <div className="h-8 w-8 rounded-lg bg-overlay-xs" />
            <div className="space-y-1">
              <div className="h-4 w-20 rounded bg-overlay-xs" />
              <div className="h-3 w-36 rounded bg-overlay-xs" />
            </div>
          </div>
          <div className="px-6 py-5 space-y-5">
            <div className="space-y-1.5">
              <div className="h-3 w-28 rounded bg-overlay-xs" />
              <div className="h-10 rounded-lg bg-overlay-xs" />
            </div>
            <div className="space-y-1.5">
              <div className="h-3 w-32 rounded bg-overlay-xs" />
              <div className="h-10 rounded-lg bg-overlay-xs" />
            </div>
            <div className="flex justify-end pt-1">
              <div className="h-10 w-36 rounded-lg bg-overlay-xs" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
