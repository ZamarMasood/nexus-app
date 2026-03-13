import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { Download, Receipt, TrendingUp, Clock, AlertTriangle } from "lucide-react";
import { getPortalInvoices } from "@/lib/db/portal";
import type { Invoice, InvoiceStatus } from "@/lib/types";

const STATUS_CONFIG: Record<InvoiceStatus, { label: string; bg: string; text: string; dot: string; ring: string }> = {
  pending: { label: "Pending", bg: "bg-amber-500/10",   text: "text-amber-400",   dot: "bg-amber-400",   ring: "ring-amber-500/20"   },
  paid:    { label: "Paid",    bg: "bg-emerald-500/10", text: "text-emerald-400", dot: "bg-emerald-400", ring: "ring-emerald-500/20" },
  overdue: { label: "Overdue", bg: "bg-rose-500/10",    text: "text-rose-400",    dot: "bg-rose-400",    ring: "ring-rose-500/20"    },
};

function formatCurrency(amount: number | null): string {
  if (amount == null) return "—";
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(amount);
}

function formatDate(dateStr: string | null): string {
  if (!dateStr) return "—";
  return new Date(dateStr).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

function InvoiceRow({ invoice, delay }: { invoice: Invoice; delay: number }) {
  const status    = (invoice.status as InvoiceStatus) ?? "pending";
  const cfg       = STATUS_CONFIG[status] ?? STATUS_CONFIG.pending;
  const isOverdue = status === "overdue";

  return (
    <div
      className={[
        "group flex items-center gap-4 rounded-2xl border bg-surface-card px-5 py-4",
        "transition-[background-color,box-shadow] duration-150",
        "hover:bg-surface-subtle hover:shadow-[0_4px_20px_rgba(0,0,0,0.08)]",
        isOverdue ? "border-rose-500/20" : "border-surface",
        "animate-in",
      ].join(" ")}
      style={{ animationDelay: `${delay}ms` }}
    >
      {/* Icon */}
      <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${isOverdue ? "bg-rose-500/10" : "bg-violet-500/10"}`}>
        <Receipt className={`h-5 w-5 ${isOverdue ? "text-rose-400" : "text-violet-400"}`} />
      </div>

      {/* Invoice info */}
      <div className="flex-1 min-w-0">
        <p className="text-[14px] font-semibold text-bright truncate">
          {invoice.invoice_number ?? `Invoice #${invoice.id.slice(0, 8)}`}
        </p>
        <p className="mt-0.5 text-[12px] text-faint-app">
          Due {formatDate(invoice.due_date)}
        </p>
      </div>

      {/* Amount */}
      <div className="text-right shrink-0 hidden sm:block">
        <p className="text-[16px] font-bold tracking-[-0.02em] text-bright tabular-nums">
          {formatCurrency(invoice.amount)}
        </p>
      </div>

      {/* Status */}
      <div className="shrink-0">
        <span className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-[11px] font-semibold ring-1 ${cfg.bg} ${cfg.text} ${cfg.ring}`}>
          <span className={`h-1.5 w-1.5 rounded-full ${cfg.dot}`} />
          {cfg.label}
        </span>
      </div>

      {/* Download */}
      {invoice.pdf_url ? (
        <a
          href={invoice.pdf_url}
          download
          target="_blank"
          rel="noopener noreferrer"
          className={[
            "shrink-0 inline-flex items-center gap-1.5 rounded-lg px-3 py-2",
            "text-[12px] font-semibold text-violet-400 bg-violet-500/10",
            "hover:bg-violet-600 hover:text-white",
            "transition-[background-color,color] duration-150",
            "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-500/40",
            "active:scale-[0.98]",
          ].join(" ")}
        >
          <Download className="h-3.5 w-3.5" />
          PDF
        </a>
      ) : (
        <div className="w-[60px] shrink-0" />
      )}
    </div>
  );
}

function SummaryCard({
  label, value, sub, icon: Icon,
  accent, iconBg, iconColor, valueColor, delay,
}: {
  label: string; value: string; sub?: string;
  icon: React.ElementType; accent: string;
  iconBg: string; iconColor: string; valueColor?: string; delay: number;
}) {
  return (
    <div
      className="relative overflow-hidden rounded-2xl border border-surface bg-surface-card px-5 py-4 animate-in"
      style={{ animationDelay: `${delay}ms` }}
    >
      <div className={`absolute inset-x-0 top-0 h-px bg-gradient-to-r ${accent}`} />
      <div className={`absolute inset-x-0 top-0 h-16 bg-gradient-to-b ${accent} opacity-40`} />
      <div className="relative">
        <div className={`mb-3 flex h-9 w-9 items-center justify-center rounded-xl ${iconBg}`}>
          <Icon className={`h-4 w-4 ${iconColor}`} />
        </div>
        <p className={`text-[22px] font-bold tracking-[-0.03em] leading-none ${valueColor ?? "text-bright"}`}>
          {value}
        </p>
        <p className="mt-2 text-[11px] font-medium text-dim-app">{label}</p>
        {sub && <p className="mt-0.5 text-[11px] text-dim-app">{sub}</p>}
      </div>
    </div>
  );
}

export default async function PortalInvoicesPage() {
  const cookieStore = cookies();
  const clientId    = cookieStore.get("portal_client_id")?.value;
  if (!clientId) redirect("/portal/login");

  const invoices = await getPortalInvoices(clientId);

  const totalOwed    = invoices.filter((i) => i.status !== "paid").reduce((s, i) => s + (i.amount ?? 0), 0);
  const totalPaid    = invoices.filter((i) => i.status === "paid").reduce((s, i) => s + (i.amount ?? 0), 0);
  const overdueCount = invoices.filter((i) => i.status === "overdue").length;

  return (
    <div className="p-6 sm:p-8 lg:p-10">

      {/* Header */}
      <div className="mb-8 animate-in" style={{ animationDelay: "0ms" }}>
        <p className="text-[11px] font-semibold uppercase tracking-widest text-dim-app mb-1">Billing</p>
        <h1 className="text-[28px] font-bold tracking-[-0.04em] text-bright leading-tight">Invoices</h1>
        <p className="mt-1 text-sm text-faint-app">View and download your invoices below.</p>
      </div>

      {/* Summary cards */}
      {invoices.length > 0 && (
        <div className="mb-8 grid grid-cols-2 gap-4 sm:grid-cols-3">
          <SummaryCard
            label="Total Invoices" value={String(invoices.length)}
            icon={Receipt} accent="from-violet-500/20 to-violet-600/5"
            iconBg="bg-violet-500/10" iconColor="text-violet-400"
            sub={`${overdueCount > 0 ? `${overdueCount} overdue` : "All current"}`}
            delay={80}
          />
          <SummaryCard
            label="Amount Collected" value={formatCurrency(totalPaid)}
            icon={TrendingUp} accent="from-emerald-500/20 to-emerald-600/5"
            iconBg="bg-emerald-500/10" iconColor="text-emerald-400"
            valueColor="text-emerald-400" delay={140}
          />
          <SummaryCard
            label="Outstanding" value={formatCurrency(totalOwed)}
            icon={totalOwed > 0 ? Clock : TrendingUp}
            accent={totalOwed > 0 ? "from-amber-500/20 to-amber-600/5" : "from-emerald-500/20 to-emerald-600/5"}
            iconBg={totalOwed > 0 ? "bg-amber-500/10" : "bg-emerald-500/10"}
            iconColor={totalOwed > 0 ? "text-amber-400" : "text-emerald-400"}
            valueColor={totalOwed > 0 ? "text-amber-400" : undefined}
            delay={200}
          />
        </div>
      )}

      {/* Invoice list */}
      {invoices.length === 0 ? (
        <div
          className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-surface bg-surface-card py-24 animate-in"
          style={{ animationDelay: "80ms" }}
        >
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-surface-inset border border-surface mb-4">
            <Receipt className="h-6 w-6 text-dim-app" />
          </div>
          <p className="mt-1 text-sm font-semibold text-muted-app">No invoices yet</p>
          <p className="mt-1 text-xs text-dim-app">Your invoices will appear here once issued.</p>
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {overdueCount > 0 && (
            <div
              className="flex items-center gap-2.5 rounded-xl bg-rose-500/8 border border-rose-500/20 px-4 py-3 text-sm text-rose-400 animate-in"
              style={{ animationDelay: "260ms" }}
            >
              <AlertTriangle className="h-4 w-4 shrink-0" />
              {overdueCount === 1 ? "You have 1 overdue invoice." : `You have ${overdueCount} overdue invoices.`}
            </div>
          )}
          {invoices.map((invoice, i) => (
            <InvoiceRow key={invoice.id} invoice={invoice} delay={300 + i * 40} />
          ))}
        </div>
      )}
    </div>
  );
}
