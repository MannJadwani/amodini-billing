"use client";

import Link from "next/link";
import { useBilling } from "../lib/store";
import { LinkButton, PaymentStatusBadge } from "../components/ui";
import { formatMoney, formatDate } from "../lib/format";

const TILES = [
  { href: "/bills/new", icon: "➕", title: "New Bill", hint: "Create a bill in under a minute", primary: true },
  { href: "/bills", icon: "🧾", title: "Bills", hint: "See and search all bills" },
  { href: "/customers", icon: "👥", title: "Customers", hint: "Manage your customers" },
  { href: "/products", icon: "📦", title: "Products", hint: "Items & services you sell" },
  { href: "/payments", icon: "💰", title: "Payments", hint: "Track money received" },
  { href: "/settings", icon: "⚙️", title: "Settings", hint: "Your business details" },
];

export default function Dashboard() {
  const { state, stats } = useBilling();
  const recent = state.bills.slice(0, 6);
  const cur = state.settings.currency;

  return (
    <div className="stack" style={{ gap: 28 }}>
      <div className="spread">
        <div>
          <h1>Namaste 🙏</h1>
          <p className="subtitle muted">
            {state.settings.businessName || "Simple Billing"} — here is your business today.
          </p>
        </div>
        <LinkButton href="/bills/new" variant="primary" size="lg" icon="➕">
          Create New Bill
        </LinkButton>
      </div>

      {/* Stats */}
      <div className="stat-grid">
        <div className="stat-card">
          <div className="stat-label">Today&apos;s Sales</div>
          <div className="stat-value">{formatMoney(stats.todaySales, cur)}</div>
          <div className="stat-sub">{stats.todayBillCount} bill(s) today</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Money to Collect</div>
          <div className="stat-value" style={{ color: stats.outstanding > 0 ? "var(--danger)" : undefined }}>
            {formatMoney(stats.outstanding, cur)}
          </div>
          <div className="stat-sub">{stats.unpaidCount} pending bill(s)</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">This Month</div>
          <div className="stat-value">{formatMoney(stats.monthSales, cur)}</div>
          <div className="stat-sub">{stats.billCount} bills in total</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Total Received</div>
          <div className="stat-value" style={{ color: "var(--success)" }}>
            {formatMoney(stats.totalCollected, cur)}
          </div>
          <div className="stat-sub">All payments recorded</div>
        </div>
      </div>

      {/* Big action tiles */}
      <div>
        <h2 className="section-title">Quick actions</h2>
        <div className="tile-grid">
          {TILES.map((t) => (
            <Link key={t.href} href={t.href} className={`tile ${t.primary ? "tile-primary" : ""}`}>
              <span className="tile-ico" aria-hidden>
                {t.icon}
              </span>
              <strong>{t.title}</strong>
              <span>{t.hint}</span>
            </Link>
          ))}
        </div>
      </div>

      {/* Recent bills */}
      <div>
        <div className="spread" style={{ marginBottom: 12 }}>
          <h2 className="section-title" style={{ margin: 0 }}>
            Recent bills
          </h2>
          <Link href="/bills" className="btn btn-ghost">
            See all →
          </Link>
        </div>
        {recent.length === 0 ? (
          <div className="empty-state">
            <div className="emo">🧾</div>
            <h3>No bills yet</h3>
            <p>Tap “Create New Bill” to make your first one.</p>
            <LinkButton href="/bills/new" variant="primary" icon="➕">
              Create New Bill
            </LinkButton>
          </div>
        ) : (
          <div className="row-list">
            {recent.map((b) => (
              <Link key={b.id} href={`/bills/${b.id}`} className="row-card">
                <div className="row-main">
                  <strong>{b.customer.name || "Walk-in customer"}</strong>
                  <small>
                    {b.invoiceNumber} · {formatDate(b.finalizedAt ?? b.createdAt)}
                  </small>
                </div>
                <div className="row-end">
                  <strong>{formatMoney(b.grandTotal, cur)}</strong>
                  <PaymentStatusBadge status={b.status} />
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
