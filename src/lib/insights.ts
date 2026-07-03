// Pure, offline "smart help" logic. None of this needs an AI key — it powers
// the assistant's summaries, mistake checks, reminders and explanations even
// when no model is configured.

import { Bill, BillingState, BusinessSettings } from "./types";
import { formatMoney } from "./format";

export type Issue = { level: "warn" | "info"; message: string };

// Look at an in-progress bill and flag likely mistakes.
export function detectBillIssues(
  bill: {
    customer: { name: string; phone: string };
    items: { name: string; quantity: number; rate: number }[];
    grandTotal: number;
    amountPaid: number;
  },
  history: Bill[] = [],
): Issue[] {
  const issues: Issue[] = [];
  if (!bill.customer.name.trim()) {
    issues.push({ level: "warn", message: "No customer selected for this bill." });
  }
  if (bill.customer.name.trim() && !bill.customer.phone.trim()) {
    issues.push({ level: "info", message: "Customer has no phone number — you won’t be able to share on WhatsApp." });
  }
  if (bill.items.length === 0) {
    issues.push({ level: "warn", message: "This bill has no items yet." });
  }
  bill.items.forEach((it, idx) => {
    const label = it.name.trim() || `Item ${idx + 1}`;
    if (!it.name.trim()) issues.push({ level: "warn", message: `Item ${idx + 1} has no name.` });
    if (it.quantity <= 0) issues.push({ level: "warn", message: `“${label}” has a quantity of 0.` });
    if (it.rate <= 0) issues.push({ level: "info", message: `“${label}” has a price of 0.` });
    // Unusual price check vs. history for same-named item.
    const past = history.flatMap((b) => b.items).filter((p) => p.name.toLowerCase() === it.name.toLowerCase() && p.rate > 0);
    if (it.rate > 0 && past.length >= 2) {
      const avg = past.reduce((s, p) => s + p.rate, 0) / past.length;
      if (it.rate > avg * 3) issues.push({ level: "info", message: `“${label}” price looks unusually high (was about ${formatMoney(avg)} before).` });
      if (it.rate < avg / 3) issues.push({ level: "info", message: `“${label}” price looks unusually low (was about ${formatMoney(avg)} before).` });
    }
  });
  // Duplicate bill: same customer + same total finalized very recently.
  const dup = history.find(
    (b) =>
      b.customer.name.toLowerCase() === bill.customer.name.toLowerCase() &&
      Math.abs(b.grandTotal - bill.grandTotal) < 0.5 &&
      bill.grandTotal > 0,
  );
  if (dup) issues.push({ level: "info", message: `A similar bill (${dup.invoiceNumber}) already exists for this customer and amount.` });
  return issues;
}

export function businessSummary(state: BillingState): string {
  const today = new Date().toISOString().slice(0, 10);
  const counted = state.bills.filter((b) => b.status !== "cancelled" && b.status !== "draft");
  const todaySales = counted
    .filter((b) => (b.finalizedAt ?? b.createdAt).slice(0, 10) === today)
    .reduce((s, b) => s + b.grandTotal, 0);
  const outstanding = counted.reduce((s, b) => s + b.balanceDue, 0);
  const unpaid = counted.filter((b) => b.balanceDue > 0);
  const lines = [
    `Today's sales: ${formatMoney(todaySales, state.settings.currency)} (${counted.filter((b) => (b.finalizedAt ?? b.createdAt).slice(0, 10) === today).length} bills).`,
    `Money still to collect: ${formatMoney(outstanding, state.settings.currency)} across ${unpaid.length} bill(s).`,
  ];
  const top = topCustomers(state, 3);
  if (top.length) {
    lines.push(`Top customers: ${top.map((t) => `${t.name} (${formatMoney(t.total, state.settings.currency)})`).join(", ")}.`);
  }
  return lines.join("\n");
}

export function topCustomers(state: BillingState, limit = 5): { name: string; total: number }[] {
  const map = new Map<string, number>();
  state.bills
    .filter((b) => b.status !== "cancelled" && b.status !== "draft")
    .forEach((b) => {
      const name = b.customer.name || "Walk-in";
      map.set(name, (map.get(name) ?? 0) + b.grandTotal);
    });
  return [...map.entries()]
    .map(([name, total]) => ({ name, total }))
    .sort((a, b) => b.total - a.total)
    .slice(0, limit);
}

export function unpaidBills(state: BillingState): Bill[] {
  return state.bills
    .filter((b) => (b.status === "unpaid" || b.status === "partial") && b.balanceDue > 0)
    .sort((a, b) => b.balanceDue - a.balanceDue);
}

// Polite WhatsApp reminder template (English + a touch of Hindi).
export function reminderMessage(bill: Bill, settings: BusinessSettings): string {
  return [
    `Namaste ${bill.customer.name || "ji"} 🙏`,
    "",
    `This is a gentle reminder for bill ${bill.invoiceNumber}.`,
    `Balance due: ${formatMoney(bill.balanceDue, settings.currency)}.`,
    "",
    `Kripya jaldi bhugtan karein. Thank you!`,
    settings.businessName ? `– ${settings.businessName}` : "",
  ]
    .filter(Boolean)
    .join("\n");
}

export const GLOSSARY: { term: string; meaning: string }[] = [
  { term: "What does Balance Due mean?", meaning: "Balance Due is the money the customer still has to pay you. It is the Grand Total minus the Amount Paid." },
  { term: "What is GST / Tax?", meaning: "GST is the government tax added on top of your price. You collect it from the customer and pay it to the government." },
  { term: "What is a Draft bill?", meaning: "A Draft is a bill you are still working on. It is not final yet, so you can keep changing it. Tap ‘Finalize’ when it is ready." },
  { term: "What does Subtotal mean?", meaning: "Subtotal is the total of all item prices before any discount or tax is added." },
  { term: "How do I print this bill?", meaning: "Open the bill, then tap the ‘Print’ button. Your browser will show a print window — choose your printer or ‘Save as PDF’." },
  { term: "How do I share a bill on WhatsApp?", meaning: "Open the bill and tap ‘Share WhatsApp’. Make sure the customer has a phone number saved first." },
  { term: "What is Partly Paid?", meaning: "Partly Paid means the customer has paid some of the money but not all of it. Some Balance Due is still left." },
];
