// Default settings + friendly demo data for first run.
import { BillingState, BusinessSettings } from "./types";
import { computeItem, computeTotals, round2 } from "./calc";

export const defaultSettings: BusinessSettings = {
  businessName: "Simple Billing",
  logo: "",
  address: "Shop No. 1, Main Market, Your City",
  phone: "",
  email: "",
  gstin: "",
  invoicePrefix: "INV-",
  nextInvoiceNumber: 1003,
  currency: "INR",
  defaultTaxRate: 18,
  defaultTerms: "Goods once sold will not be taken back. Please pay within 7 days.",
  defaultNotes: "Thank you for your business!",
  aiEnabled: true,
};

const now = "2026-06-20T10:00:00.000Z";

function buildBill(args: {
  id: string;
  invoiceNumber: string;
  customerId: string;
  customer: { name: string; phone: string; email: string; address: string; gstin: string };
  items: Array<{ name: string; quantity: number; rate: number; discount: number; taxRate: number; productId: string | null }>;
  amountPaid: number;
  status: "unpaid" | "partial" | "paid";
  createdAt: string;
  notes: string;
  terms: string;
}) {
  const items = args.items.map((it, idx) =>
    computeItem({ id: `${args.id}-item-${idx}`, ...it }),
  );
  const totals = computeTotals(items);
  const balanceDue = round2(Math.max(0, totals.grandTotal - args.amountPaid));
  return {
    id: args.id,
    invoiceNumber: args.invoiceNumber,
    customerId: args.customerId,
    customer: args.customer,
    items,
    ...totals,
    amountPaid: args.amountPaid,
    balanceDue,
    status: args.status,
    notes: args.notes,
    terms: args.terms,
    createdAt: args.createdAt,
    updatedAt: args.createdAt,
    finalizedAt: args.createdAt,
  };
}

export function buildSeedState(): BillingState {
  const customers = [
    {
      id: "cust-001",
      name: "Priya Sharma",
      phone: "+91 98765 21001",
      email: "priya@example.com",
      address: "12 Market Road, Pune",
      gstin: "",
      createdAt: now,
      updatedAt: now,
    },
    {
      id: "cust-002",
      name: "Rajesh Kumar",
      phone: "+91 98765 21002",
      email: "",
      address: "45 Station Avenue, Mumbai",
      gstin: "27ABCDE1234F1Z5",
      createdAt: now,
      updatedAt: now,
    },
    {
      id: "cust-003",
      name: "Aisha Khan",
      phone: "+91 98765 21003",
      email: "aisha@example.com",
      address: "8 Lake View, Bengaluru",
      gstin: "",
      createdAt: now,
      updatedAt: now,
    },
  ];

  const products = [
    {
      id: "prod-001",
      name: "Cotton Saree",
      description: "Handloom cotton saree",
      defaultRate: 1200,
      defaultTaxRate: 5,
      unit: "pcs",
      active: true,
      createdAt: now,
      updatedAt: now,
    },
    {
      id: "prod-002",
      name: "Blouse Piece",
      description: "Matching blouse piece",
      defaultRate: 500,
      defaultTaxRate: 5,
      unit: "pcs",
      active: true,
      createdAt: now,
      updatedAt: now,
    },
    {
      id: "prod-003",
      name: "Tailoring Service",
      description: "Stitching per garment",
      defaultRate: 350,
      defaultTaxRate: 0,
      unit: "service",
      active: true,
      createdAt: now,
      updatedAt: now,
    },
  ];

  const bills = [
    buildBill({
      id: "bill-001",
      invoiceNumber: "INV-1001",
      customerId: "cust-001",
      customer: {
        name: "Priya Sharma",
        phone: "+91 98765 21001",
        email: "priya@example.com",
        address: "12 Market Road, Pune",
        gstin: "",
      },
      items: [
        { name: "Cotton Saree", quantity: 2, rate: 1200, discount: 0, taxRate: 5, productId: "prod-001" },
        { name: "Blouse Piece", quantity: 2, rate: 500, discount: 0, taxRate: 5, productId: "prod-002" },
      ],
      amountPaid: 3570,
      status: "paid",
      createdAt: "2026-06-10T09:30:00.000Z",
      notes: "Thank you for your business!",
      terms: "Goods once sold will not be taken back.",
    }),
    buildBill({
      id: "bill-002",
      invoiceNumber: "INV-1002",
      customerId: "cust-002",
      customer: {
        name: "Rajesh Kumar",
        phone: "+91 98765 21002",
        email: "",
        address: "45 Station Avenue, Mumbai",
        gstin: "27ABCDE1234F1Z5",
      },
      items: [
        { name: "Cotton Saree", quantity: 3, rate: 1200, discount: 200, taxRate: 5, productId: "prod-001" },
        { name: "Tailoring Service", quantity: 3, rate: 350, discount: 0, taxRate: 0, productId: "prod-003" },
      ],
      amountPaid: 2000,
      status: "partial",
      createdAt: "2026-06-15T11:00:00.000Z",
      notes: "Balance to be paid on delivery.",
      terms: "Please pay within 7 days.",
    }),
  ];

  const payments = [
    {
      id: "pay-001",
      billId: "bill-001",
      invoiceNumber: "INV-1001",
      customerName: "Priya Sharma",
      amount: 3570,
      mode: "upi" as const,
      reference: "UPI-8842",
      paidAt: "2026-06-10T09:35:00.000Z",
      notes: "Paid in full.",
    },
    {
      id: "pay-002",
      billId: "bill-002",
      invoiceNumber: "INV-1002",
      customerName: "Rajesh Kumar",
      amount: 2000,
      mode: "cash" as const,
      reference: "",
      paidAt: "2026-06-15T11:05:00.000Z",
      notes: "Part payment.",
    },
  ];

  return {
    settings: { ...defaultSettings },
    customers,
    products,
    bills,
    payments,
    activity: [
      {
        id: "activity-seed",
        message: "Welcome! Tap “New Bill” to make your first bill.",
        at: now,
      },
    ],
  };
}
