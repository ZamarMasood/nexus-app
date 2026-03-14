export default function ClientsLoading() {
  return (
    <div className="p-6 sm:p-8 lg:p-10 space-y-4 animate-pulse">
      <div className="h-8 w-48 rounded-lg bg-surface-inset" />
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {[0, 1, 2].map((i) => <div key={i} className="h-24 rounded-2xl bg-surface-subtle" />)}
      </div>
      <div className="h-64 rounded-xl bg-surface-subtle" />
    </div>
  );
}
