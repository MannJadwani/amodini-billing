"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { useBilling } from "../../lib/store";
import { EmptyState, LinkButton, PageHeader, PaymentStatusBadge, SearchInput } from "../../components/ui";
import { Icon } from "../../components/Icon";
import { formatMoney, formatDate } from "../../lib/format";
import { BillStatus, BILL_STATUS_LABELS } from "../../lib/types";

const FILTERS: { key: BillStatus | "all"; label: string }[] = [
  { key: "all", label: "All" },
  { key: "draft", label: "Drafts" },
  { key: "unpaid", label: "Unpaid" },
  { key: "partial", label: "Partly Paid" },
  { key: "paid", label: "Paid" },
  { key: "cancelled", label: "Cancelled" },
];

export default function BillsPage() {
  const { state } = useBilling();
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<BillStatus | "all">("all");

  const bills = useMemo(() => {
    const q = query.trim().toLowerCase();
    return state.bills.filter((b) => {
      if (filter !== "all" && b.status !== filter) return false;
      if (!q) return true;
      return (
        b.invoiceNumber.toLowerCase().includes(q) ||
        b.customer.name.toLowerCase().includes(q) ||
        b.customer.phone.toLowerCase().includes(q)
      );
    });
  }, [state.bills, query, filter]);

  const cur = state.settings.currency;

  return (
    <div>
      <PageHeader
        title="Bills"
        subtitle="All your bills in one place."
        actions={
          <LinkButton href="/bills/new" variant="primary" size="lg" icon={<Icon name="plus" />}>
            New Bill
          </LinkButton>
        }
      />

      <div className="toolbar">
        <SearchInput
          className="search"
          placeholder="Search by customer or bill number…"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          aria-label="Search bills"
        />
      </div>
      <div className="chip-row" style={{ marginBottom: 22 }}>
        {FILTERS.map((f) => (
          <button
            key={f.key}
            className={`chip ${filter === f.key ? "is-active" : ""}`}
            onClick={() => setFilter(f.key)}
          >
            {f.label}
          </button>
        ))}
      </div>

      {bills.length === 0 ? (
        <EmptyState
          icon="receipt"
          title={state.bills.length === 0 ? "No bills yet" : "No bills match your search"}
          message={
            state.bills.length === 0
              ? "Create your first bill — it only takes a minute."
              : "Try a different search or filter."
          }
          action={
            <LinkButton href="/bills/new" variant="primary" icon={<Icon name="plus" />}>
              Create New Bill
            </LinkButton>
          }
        />
      ) : (
        <div className="table-wrap">
          <table className="simple">
            <thead>
              <tr>
                <th>Bill No.</th>
                <th>Customer</th>
                <th>Date</th>
                <th>Status</th>
                <th className="num">Total</th>
                <th className="num">Balance</th>
              </tr>
            </thead>
            <tbody>
              {bills.map((b) => (
                <tr key={b.id} className="clickable" onClick={() => (window.location.href = `/bills/${b.id}`)}>
                  <td>
                    <Link href={`/bills/${b.id}`} onClick={(e) => e.stopPropagation()}>
                      <strong>{b.invoiceNumber}</strong>
                    </Link>
                  </td>
                  <td>{b.customer.name || "Walk-in"}</td>
                  <td>{formatDate(b.finalizedAt ?? b.createdAt)}</td>
                  <td>
                    <PaymentStatusBadge status={b.status} />
                  </td>
                  <td className="num">{formatMoney(b.grandTotal, cur)}</td>
                  <td className="num">{formatMoney(b.balanceDue, cur)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <p className="muted" style={{ marginTop: 14 }}>
        Showing {bills.length} of {state.bills.length} bills · Status meanings:{" "}
        {Object.values(BILL_STATUS_LABELS).join(", ")}.
      </p>
    </div>
  );
}
