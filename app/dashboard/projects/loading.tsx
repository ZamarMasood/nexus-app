export default function ProjectsLoading() {
  return (
    <div className="p-6 sm:p-8 lg:p-10 space-y-6 animate-pulse">
      <div className="flex items-center justify-between">
        <div className="h-8 w-32 rounded-lg bg-surface-inset" />
        <div className="h-9 w-36 rounded-xl bg-surface-inset" />
      </div>
      <div className="flex gap-2">
        {[0, 1, 2, 3].map((i) => <div key={i} className="h-8 w-24 rounded-lg bg-surface-subtle" />)}
      </div>
      {[0, 1, 2, 3].map((i) => (
        <div key={i} className="h-16 rounded-2xl bg-surface-subtle" />
      ))}
    </div>
  );
}
