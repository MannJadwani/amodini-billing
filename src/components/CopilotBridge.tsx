"use client";

import { useRouter } from "next/navigation";
import {
  useCopilotAction,
  useCopilotAdditionalInstructions,
  useCopilotReadable,
} from "@copilotkit/react-core";
import { useBilling } from "../lib/store";
import { businessSummary, unpaidBills } from "../lib/insights";
import { formatMoney } from "../lib/format";

// Registers the app's data + actions with CopilotKit so the chat assistant can
// read business state and make real changes. Renders nothing. Mounted once.
// Safe to mount even when no AI key is configured — these only do work when the
// assistant actually runs.
export function CopilotBridge() {
  const billing = useBilling();
  const router = useRouter();
  const { state } = billing;

  useCopilotReadable({
    description:
      "Current billing data for this small business: customers, products, recent bills and payments, plus business settings.",
    value: {
      business: state.settings.businessName,
      currency: state.settings.currency,
      customers: state.customers.map((c) => ({ name: c.name, phone: c.phone })),
      products: state.products
        .filter((p) => p.active)
        .map((p) => ({ name: p.name, rate: p.defaultRate, taxRate: p.defaultTaxRate, unit: p.unit })),
      recentBills: state.bills.slice(0, 10).map((b) => ({
        invoiceNumber: b.invoiceNumber,
        customer: b.customer.name,
        total: b.grandTotal,
        balanceDue: b.balanceDue,
        status: b.status,
      })),
    },
  });

  useCopilotAdditionalInstructions({
    instructions:
      "You are a friendly billing helper for a small Indian shop owner who may not be tech-savvy. " +
      "Use simple, short sentences. Amounts are in Indian Rupees. When asked to make a bill, call the createBill action with the items. " +
      "Match customer and product names from the readable context when possible. Always confirm what you did in plain language.",
  });

  // --- Create a bill from plain English ---
  useCopilotAction({
    name: "createBill",
    description:
      "Create a new draft bill for a customer with one or more items. Use this for requests like 'make a bill for Rajesh for 2 sarees at 1200 each'.",
    parameters: [
      { name: "customerName", type: "string", required: true },
      { name: "customerPhone", type: "string", required: false },
      {
        name: "items",
        type: "object[]",
        required: true,
        attributes: [
          { name: "name", type: "string", required: true },
          { name: "quantity", type: "number", required: true },
          { name: "rate", type: "number", required: true },
          { name: "taxRate", type: "number", required: false },
          { name: "discount", type: "number", required: false },
        ],
      },
      { name: "notes", type: "string", required: false },
    ],
    handler: ({ customerName, customerPhone, items, notes }) => {
      const existing = state.customers.find(
        (c) => c.name.trim().toLowerCase() === String(customerName).trim().toLowerCase(),
      );
      const customer =
        existing ??
        billing.addCustomer({ name: String(customerName).trim(), phone: customerPhone ?? "" });
      const bill = billing.createDraftBill({
        customerId: customer.id,
        items: (items ?? []).map((it) => ({
          name: it.name,
          quantity: Number(it.quantity) || 1,
          rate: Number(it.rate) || 0,
          taxRate: it.taxRate === undefined ? state.settings.defaultTaxRate : Number(it.taxRate),
          discount: Number(it.discount) || 0,
        })),
        notes: notes ?? undefined,
      });
      router.push(`/bills/${bill.id}/edit`);
      return `Made a draft bill ${bill.invoiceNumber} for ${customer.name}, total ${formatMoney(
        bill.grandTotal,
        state.settings.currency,
      )}. Opening it now so you can check and finalize it.`;
    },
  });

  useCopilotAction({
    name: "addCustomer",
    description: "Add a new customer.",
    parameters: [
      { name: "name", type: "string", required: true },
      { name: "phone", type: "string", required: false },
      { name: "email", type: "string", required: false },
      { name: "address", type: "string", required: false },
    ],
    handler: ({ name, phone, email, address }) => {
      const c = billing.addCustomer({ name, phone, email, address });
      return `Added customer ${c.name}.`;
    },
  });

  useCopilotAction({
    name: "addProduct",
    description: "Add a new product or service with a default price.",
    parameters: [
      { name: "name", type: "string", required: true },
      { name: "rate", type: "number", required: true },
      { name: "taxRate", type: "number", required: false },
      { name: "unit", type: "string", required: false },
    ],
    handler: ({ name, rate, taxRate, unit }) => {
      const p = billing.addProduct({
        name,
        defaultRate: Number(rate) || 0,
        defaultTaxRate: taxRate === undefined ? state.settings.defaultTaxRate : Number(taxRate),
        unit,
      });
      return `Added product ${p.name} at ${formatMoney(p.defaultRate, state.settings.currency)}.`;
    },
  });

  useCopilotAction({
    name: "recordPayment",
    description: "Record a payment against an existing bill by its invoice number.",
    parameters: [
      { name: "invoiceNumber", type: "string", required: true },
      { name: "amount", type: "number", required: true },
      { name: "mode", type: "string", required: false, enum: ["cash", "upi", "card", "bank", "other"] },
    ],
    handler: ({ invoiceNumber, amount, mode }) => {
      const bill = state.bills.find(
        (b) => b.invoiceNumber.toLowerCase() === String(invoiceNumber).trim().toLowerCase(),
      );
      if (!bill) return `Could not find bill ${invoiceNumber}.`;
      const pay = billing.recordPayment(bill.id, {
        amount: Number(amount),
        mode: (mode as "cash") ?? "cash",
      });
      if (!pay) return "Could not record that payment.";
      return `Recorded ${formatMoney(pay.amount, state.settings.currency)} for ${bill.invoiceNumber}.`;
    },
  });

  useCopilotAction({
    name: "getBusinessSummary",
    description: "Summarize today's sales, money to collect, unpaid bills and top customers.",
    parameters: [],
    handler: () => {
      const unpaid = unpaidBills(state)
        .slice(0, 5)
        .map((b) => `${b.invoiceNumber} ${b.customer.name} ${formatMoney(b.balanceDue, state.settings.currency)}`)
        .join("; ");
      return `${businessSummary(state)}\nUnpaid: ${unpaid || "none"}.`;
    },
  });

  return null;
}
