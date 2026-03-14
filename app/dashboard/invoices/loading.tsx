export default function InvoicesLoading() {
  return (
    <div className="p-6 sm:p-8 lg:p-10 space-y-4 animate-pulse">
      <div className="h-8 w-48 rounded-lg bg-surface-inset" />
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        {[0, 1, 2, 3].map((i) => <div key={i} className="h-28 rounded-2xl bg-surface-subtle" />)}
      </div>
      <div className="h-64 rounded-xl bg-surface-subtle" />
    </div>
  );
}
