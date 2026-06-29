"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { useBilling } from "../../lib/store";
import { EmptyState, LinkButton, PageHeader } from "../../components/ui";
import { formatMoney, formatDate } from "../../lib/format";
import { PaymentMode, PAYMENT_MODE_LABELS } from "../../lib/types";

const MODE_FILTERS: { key: PaymentMode | "all"; label: string }[] = [
  { key: "all", label: "All" },
  { key: "cash", label: "Cash" },
  { key: "upi", label: "UPI" },
  { key: "card", label: "Card" },
  { key: "bank", label: "Bank" },
  { key: "other", label: "Other" },
];

export default function PaymentsPage() {
  const { state } = useBilling();
  const [query, setQuery] = useState("");
  const [mode, setMode] = useState<PaymentMode | "all">("all");
  const cur = state.settings.currency;

  const payments = useMemo(() => {
    const q = query.trim().toLowerCase();
    return state.payments.filter((p) => {
      if (mode !== "all" && p.mode !== mode) return false;
      if (!q) return true;
      return (
        p.customerName.toLowerCase().includes(q) || p.invoiceNumber.toLowerCase().includes(q)
      );
    });
  }, [state.payments, query, mode]);

  const total = payments.reduce((s, p) => s + p.amount, 0);

  return (
    <div>
      <PageHeader title="Payments" subtitle="All the money you have received." />

      <div className="stat-grid" style={{ marginBottom: 22 }}>
        <div className="stat-card">
          <div className="stat-label">Shown total</div>
          <div className="stat-value" style={{ color: "var(--success)" }}>
            {formatMoney(total, cur)}
          </div>
          <div className="stat-sub">{payments.length} payment(s)</div>
        </div>
      </div>

      <div className="toolbar">
        <input
          className="input search"
          placeholder="🔍 Search by customer or bill number…"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          aria-label="Search payments"
        />
      </div>
      <div className="chip-row" style={{ marginBottom: 22 }}>
        {MODE_FILTERS.map((f) => (
          <button key={f.key} className={`chip ${mode === f.key ? "is-active" : ""}`} onClick={() => setMode(f.key)}>
            {f.label}
          </button>
        ))}
      </div>

      {payments.length === 0 ? (
        <EmptyState
          emoji="💰"
          title={state.payments.length === 0 ? "No payments yet" : "No matches"}
          message={
            state.payments.length === 0
              ? "When you record a payment on a bill, it will show here."
              : "Try a different search or filter."
          }
          action={
            <LinkButton href="/bills" variant="primary" icon="🧾">
              Go to bills
            </LinkButton>
          }
        />
      ) : (
        <div className="table-wrap">
          <table className="simple">
            <thead>
              <tr>
                <th>Date</th>
                <th>Customer</th>
                <th>Bill</th>
                <th>Mode</th>
                <th className="num">Amount</th>
              </tr>
            </thead>
            <tbody>
              {payments.map((p) => (
                <tr key={p.id}>
                  <td>{formatDate(p.paidAt)}</td>
                  <td>{p.customerName}</td>
                  <td>
                    <Link href={`/bills/${p.billId}`}>{p.invoiceNumber}</Link>
                  </td>
                  <td>{PAYMENT_MODE_LABELS[p.mode]}</td>
                  <td className="num">
                    <strong>{formatMoney(p.amount, cur)}</strong>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
