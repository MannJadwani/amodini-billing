// Pure bill/line calculation helpers. No React, easy to reason about & test.

import { Bill, BillItem, BillStatus } from "./types";

export function round2(value: number): number {
  return Math.round((Number(value) + Number.EPSILON) * 100) / 100;
}

export type RawItem = {
  id: string;
  productId: string | null;
  name: string;
  quantity: number;
  rate: number;
  discount: number;
  taxRate: number;
};

// Compute all derived fields for a single line item.
export function computeItem(raw: RawItem): BillItem {
  const quantity = Math.max(0, Number(raw.quantity) || 0);
  const rate = Math.max(0, Number(raw.rate) || 0);
  const taxRate = Math.max(0, Number(raw.taxRate) || 0);
  const lineSubtotal = round2(quantity * rate);
  const lineDiscount = Math.min(lineSubtotal, Math.max(0, Number(raw.discount) || 0));
  const lineTaxable = round2(lineSubtotal - lineDiscount);
  const lineTax = round2((lineTaxable * taxRate) / 100);
  const lineTotal = round2(lineTaxable + lineTax);

  return {
    id: raw.id,
    productId: raw.productId ?? null,
    name: raw.name,
    quantity,
    rate,
    discount: lineDiscount,
    taxRate,
    lineSubtotal,
    lineDiscount,
    lineTaxable,
    lineTax,
    lineTotal,
  };
}

export type BillTotals = {
  subtotal: number;
  discountTotal: number;
  taxTotal: number;
  grandTotal: number;
};

export function computeTotals(items: BillItem[]): BillTotals {
  const subtotal = round2(items.reduce((sum, i) => sum + i.lineSubtotal, 0));
  const discountTotal = round2(items.reduce((sum, i) => sum + i.lineDiscount, 0));
  const taxTotal = round2(items.reduce((sum, i) => sum + i.lineTax, 0));
  const grandTotal = round2(subtotal - discountTotal + taxTotal);
  return { subtotal, discountTotal, taxTotal, grandTotal };
}

// Decide the bill status from amounts (never override draft/cancelled).
export function deriveStatus(
  current: BillStatus,
  grandTotal: number,
  amountPaid: number,
): BillStatus {
  if (current === "draft" || current === "cancelled") return current;
  if (amountPaid <= 0) return "unpaid";
  if (amountPaid >= grandTotal) return "paid";
  return "partial";
}

// Recompute every derived field on a bill from its items + amountPaid.
export function recalcBill(bill: Bill): Bill {
  const items = bill.items.map((i) => computeItem(i));
  const totals = computeTotals(items);
  const amountPaid = round2(Math.max(0, Number(bill.amountPaid) || 0));
  const balanceDue = round2(Math.max(0, totals.grandTotal - amountPaid));
  const status = deriveStatus(bill.status, totals.grandTotal, amountPaid);
  return {
    ...bill,
    items,
    ...totals,
    amountPaid,
    balanceDue,
    status,
  };
}
