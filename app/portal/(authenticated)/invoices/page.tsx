import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { Download, Receipt } from "lucide-react";
import { getPortalInvoices } from "@/lib/db/portal";
import type { Invoice, InvoiceStatus } from "@/lib/types";

const STATUS_CONFIG: Record<
  InvoiceStatus,
  { label: string; className: string; dot: string }
> = {
  pending: {
    label: "Pending",
    className: "bg-amber-50 text-amber-700 ring-1 ring-amber-200",
    dot: "bg-amber-400",
  },
  paid: {
    label: "Paid",
    className: "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200",
    dot: "bg-emerald-500",
  },
  overdue: {
    label: "Overdue",
    className: "bg-rose-50 text-rose-600 ring-1 ring-rose-200",
    dot: "bg-rose-500",
  },
};

function formatCurrency(amount: number | null): string {
  if (amount == null) return "—";
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(amount);
}

function formatDate(dateStr: string | null): string {
  if (!dateStr) return "—";
  return new Date(dateStr).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function InvoiceRow({ invoice }: { invoice: Invoice }) {
  const status = (invoice.status as InvoiceStatus) ?? "pending";
  const cfg = STATUS_CONFIG[status] ?? STATUS_CONFIG.pending;
  const isOverdue = status === "overdue";

  return (
    <div
      className={[
        "flex items-center gap-4 rounded-2xl border bg-white px-5 py-4",
        "shadow-[0_2px_8px_rgba(0,184,160,0.05),0_1px_3px_rgba(15,23,42,0.04)]",
        isOverdue ? "border-rose-200" : "border-[#d4ede9]",
      ].join(" ")}
    >
      {/* Icon */}
      <div
        className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${
          isOverdue ? "bg-rose-50" : "bg-[#e6f7f5]"
        }`}
      >
        <Receipt
          className={`h-5 w-5 ${isOverdue ? "text-rose-500" : "text-[#00b8a0]"}`}
        />
      </div>

      {/* Invoice number + date */}
      <div className="flex-1 min-w-0">
        <p className="text-[14px] font-semibold text-[#0d3330] truncate">
          {invoice.invoice_number ?? `Invoice #${invoice.id.slice(0, 8)}`}
        </p>
        <p className="mt-0.5 text-[12px] text-[#7ab5af]">
          Due {formatDate(invoice.due_date)}
        </p>
      </div>

      {/* Amount */}
      <div className="text-right shrink-0">
        <p className="text-[16px] font-bold tracking-[-0.02em] text-[#0d3330]">
          {formatCurrency(invoice.amount)}
        </p>
      </div>

      {/* Status badge */}
      <div className="shrink-0">
        <span
          className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-[12px] font-semibold ${cfg.className}`}
        >
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
            "shrink-0 inline-flex items-center gap-1.5 rounded-xl px-4 py-2",
            "text-[12px] font-semibold text-[#00866b] bg-[#e6f7f5]",
            "hover:bg-[#00b8a0] hover:text-white",
            "transition-[background-color,color]",
            "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#00b8a0]",
            "active:scale-[0.98]",
          ].join(" ")}
        >
          <Download className="h-3.5 w-3.5" />
          PDF
        </a>
      ) : (
        <div className="w-[72px] shrink-0" />
      )}
    </div>
  );
}

export default async function PortalInvoicesPage() {
  const cookieStore = cookies();
  const clientId = cookieStore.get("portal_client_id")?.value;
  if (!clientId) redirect("/portal/login");

  const invoices = await getPortalInvoices(clientId);

  const totalOwed = invoices
    .filter((i) => i.status !== "paid")
    .reduce((sum, i) => sum + (i.amount ?? 0), 0);
  const totalPaid = invoices
    .filter((i) => i.status === "paid")
    .reduce((sum, i) => sum + (i.amount ?? 0), 0);

  return (
    <div className="px-8 py-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-[28px] font-bold tracking-[-0.03em] text-[#0d3330]">
          Invoices
        </h1>
        <p className="mt-1 text-[15px] leading-relaxed text-[#5f8a86]">
          View and download your invoices below.
        </p>
      </div>

      {/* Summary cards */}
      {invoices.length > 0 && (
        <div className="mb-8 grid grid-cols-2 gap-4 sm:grid-cols-3">
          <SummaryCard
            label="Total invoices"
            value={invoices.length.toString()}
            accent="teal"
          />
          <SummaryCard
            label="Amount paid"
            value={formatCurrency(totalPaid)}
            accent="emerald"
          />
          <SummaryCard
            label="Outstanding"
            value={formatCurrency(totalOwed)}
            accent={totalOwed > 0 ? "amber" : "emerald"}
          />
        </div>
      )}

      {/* Invoice list */}
      {invoices.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-[#b8e0da] bg-white py-20">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#e6f7f5]">
            <Receipt className="h-6 w-6 text-[#00b8a0]" />
          </div>
          <p className="mt-4 text-base font-semibold text-[#0d3330]">
            No invoices yet
          </p>
          <p className="mt-1 text-sm text-[#7ab5af]">
            Your invoices will appear here once issued.
          </p>
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {invoices.map((invoice) => (
            <InvoiceRow key={invoice.id} invoice={invoice} />
          ))}
        </div>
      )}
    </div>
  );
}

interface SummaryCardProps {
  label: string;
  value: string;
  accent: "teal" | "emerald" | "amber";
}

const ACCENT_MAP = {
  teal: {
    bg: "bg-[#e6f7f5]",
    text: "text-[#00866b]",
    label: "text-[#7ab5af]",
  },
  emerald: {
    bg: "bg-emerald-50",
    text: "text-emerald-700",
    label: "text-emerald-400",
  },
  amber: {
    bg: "bg-amber-50",
    text: "text-amber-700",
    label: "text-amber-400",
  },
};

function SummaryCard({ label, value, accent }: SummaryCardProps) {
  const a = ACCENT_MAP[accent];
  return (
    <div
      className={`rounded-2xl border border-[#d4ede9] bg-white px-5 py-4 shadow-[0_2px_8px_rgba(0,184,160,0.05)]`}
    >
      <p className={`text-[11px] font-semibold uppercase tracking-widest ${a.label}`}>
        {label}
      </p>
      <p className={`mt-1.5 text-[20px] font-bold tracking-[-0.02em] ${a.text}`}>
        {value}
      </p>
    </div>
  );
}
