"use client";

import { forwardRef } from "react";
import { Bill, BusinessSettings, BILL_STATUS_LABELS } from "../lib/types";
import { formatMoney, formatDate } from "../lib/format";

// A self-contained, print/PDF-friendly invoice. Uses inline styles so it
// renders identically whether shown on screen, printed, or captured to PDF
// by html2pdf.js (which rasterises the element independent of app CSS).

const C = {
  ink: "#15233b",
  soft: "#44546b",
  faint: "#6b7a92",
  line: "#d6deec",
  brand: "#1d4ed8",
  muted: "#f1f5fb",
};

export const PdfInvoiceTemplate = forwardRef<
  HTMLDivElement,
  { bill: Bill; settings: BusinessSettings }
>(function PdfInvoiceTemplate({ bill, settings }, ref) {
  const cur = settings.currency;
  const statusLabel = BILL_STATUS_LABELS[bill.status];

  return (
    <div
      ref={ref}
      style={{
        width: "780px",
        margin: "0 auto",
        background: "#fff",
        color: C.ink,
        fontFamily: "'Segoe UI', Helvetica, Arial, sans-serif",
        fontSize: "14px",
        lineHeight: 1.5,
        padding: "40px",
        boxSizing: "border-box",
      }}
    >
      {/* Header */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "flex-start",
          borderBottom: `3px solid ${C.brand}`,
          paddingBottom: "20px",
        }}
      >
        <div style={{ display: "flex", gap: "16px", alignItems: "center" }}>
          {settings.logo ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={settings.logo}
              alt=""
              style={{ width: "64px", height: "64px", objectFit: "contain", borderRadius: "10px" }}
            />
          ) : null}
          <div>
            <div style={{ fontSize: "24px", fontWeight: 800 }}>
              {settings.businessName || "Simple Billing"}
            </div>
            {settings.address ? (
              <div style={{ color: C.soft, whiteSpace: "pre-line", maxWidth: "320px" }}>
                {settings.address}
              </div>
            ) : null}
            <div style={{ color: C.soft }}>
              {settings.phone ? `Tel: ${settings.phone}` : ""}
              {settings.phone && settings.email ? "  ·  " : ""}
              {settings.email ? settings.email : ""}
            </div>
            {settings.gstin ? (
              <div style={{ color: C.soft }}>GSTIN: {settings.gstin}</div>
            ) : null}
          </div>
        </div>
        <div style={{ textAlign: "right" }}>
          <div style={{ fontSize: "26px", fontWeight: 800, letterSpacing: "0.04em" }}>BILL</div>
          <div style={{ color: C.soft }}>
            <strong>{bill.invoiceNumber}</strong>
          </div>
          <div style={{ color: C.soft }}>Date: {formatDate(bill.finalizedAt ?? bill.createdAt)}</div>
          <div
            style={{
              marginTop: "8px",
              display: "inline-block",
              padding: "4px 14px",
              borderRadius: "999px",
              fontWeight: 700,
              fontSize: "13px",
              background: bill.status === "paid" ? "#dcfce7" : bill.status === "partial" ? "#fef3c7" : "#fee2e2",
              color: bill.status === "paid" ? "#15803d" : bill.status === "partial" ? "#b45309" : "#b91c1c",
            }}
          >
            {statusLabel}
          </div>
        </div>
      </div>

      {/* Bill To */}
      <div style={{ marginTop: "24px" }}>
        <div style={{ color: C.faint, fontSize: "12px", textTransform: "uppercase", letterSpacing: "0.05em" }}>
          Bill To
        </div>
        <div style={{ fontSize: "17px", fontWeight: 700 }}>{bill.customer.name || "Walk-in customer"}</div>
        {bill.customer.phone ? <div style={{ color: C.soft }}>{bill.customer.phone}</div> : null}
        {bill.customer.email ? <div style={{ color: C.soft }}>{bill.customer.email}</div> : null}
        {bill.customer.address ? (
          <div style={{ color: C.soft, whiteSpace: "pre-line" }}>{bill.customer.address}</div>
        ) : null}
        {bill.customer.gstin ? <div style={{ color: C.soft }}>GSTIN: {bill.customer.gstin}</div> : null}
      </div>

      {/* Items */}
      <table style={{ width: "100%", borderCollapse: "collapse", marginTop: "20px" }}>
        <thead>
          <tr style={{ background: C.muted }}>
            <th style={th()}>#</th>
            <th style={th()}>Item</th>
            <th style={thR()}>Qty</th>
            <th style={thR()}>Rate</th>
            <th style={thR()}>Discount</th>
            <th style={thR()}>GST</th>
            <th style={thR()}>Amount</th>
          </tr>
        </thead>
        <tbody>
          {bill.items.map((item, idx) => (
            <tr key={item.id}>
              <td style={td()}>{idx + 1}</td>
              <td style={td()}>{item.name || "Item"}</td>
              <td style={tdR()}>{item.quantity}</td>
              <td style={tdR()}>{formatMoney(item.rate, cur)}</td>
              <td style={tdR()}>{item.lineDiscount ? formatMoney(item.lineDiscount, cur) : "—"}</td>
              <td style={tdR()}>{item.taxRate ? `${item.taxRate}%` : "—"}</td>
              <td style={tdR()}>{formatMoney(item.lineTotal, cur)}</td>
            </tr>
          ))}
        </tbody>
      </table>

      {/* Totals */}
      <div style={{ display: "flex", justifyContent: "flex-end", marginTop: "18px" }}>
        <div style={{ width: "300px" }}>
          {totalRow("Subtotal", formatMoney(bill.subtotal, cur))}
          {bill.discountTotal > 0 ? totalRow("Discount", `– ${formatMoney(bill.discountTotal, cur)}`) : null}
          {bill.taxTotal > 0 ? totalRow("GST / Tax", formatMoney(bill.taxTotal, cur)) : null}
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              borderTop: `2px solid ${C.line}`,
              marginTop: "6px",
              paddingTop: "10px",
              fontSize: "18px",
              fontWeight: 800,
            }}
          >
            <span>Grand Total</span>
            <span>{formatMoney(bill.grandTotal, cur)}</span>
          </div>
          {totalRow("Amount Paid", formatMoney(bill.amountPaid, cur), "#15803d")}
          {totalRow("Balance Due", formatMoney(bill.balanceDue, cur), bill.balanceDue > 0 ? "#b91c1c" : C.soft)}
        </div>
      </div>

      {/* Notes & terms */}
      {(bill.notes || bill.terms) && (
        <div style={{ marginTop: "28px", borderTop: `1px solid ${C.line}`, paddingTop: "16px" }}>
          {bill.notes ? (
            <div style={{ marginBottom: "10px" }}>
              <div style={{ fontWeight: 700 }}>Notes</div>
              <div style={{ color: C.soft, whiteSpace: "pre-line" }}>{bill.notes}</div>
            </div>
          ) : null}
          {bill.terms ? (
            <div>
              <div style={{ fontWeight: 700 }}>Terms</div>
              <div style={{ color: C.soft, whiteSpace: "pre-line" }}>{bill.terms}</div>
            </div>
          ) : null}
        </div>
      )}

      <div style={{ textAlign: "center", color: C.faint, marginTop: "30px", fontSize: "12px" }}>
        This is a computer-generated bill.
      </div>
    </div>
  );
});

function th(): React.CSSProperties {
  return { textAlign: "left", padding: "10px 12px", fontSize: "12px", color: C.soft, borderBottom: `2px solid ${C.line}` };
}
function thR(): React.CSSProperties {
  return { ...th(), textAlign: "right" };
}
function td(): React.CSSProperties {
  return { padding: "10px 12px", borderBottom: `1px solid ${C.line}` };
}
function tdR(): React.CSSProperties {
  return { ...td(), textAlign: "right", fontVariantNumeric: "tabular-nums" };
}
function totalRow(label: string, value: string, color?: string) {
  return (
    <div style={{ display: "flex", justifyContent: "space-between", padding: "5px 0", color: color ?? C.soft }}>
      <span>{label}</span>
      <span style={{ fontWeight: 700 }}>{value}</span>
    </div>
  );
}
