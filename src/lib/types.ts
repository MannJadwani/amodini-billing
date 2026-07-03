// Core data model for the Simple Billing app.
// Designed to be generic for any small Indian business (no brand-specific fields).

export type BillStatus = "draft" | "unpaid" | "partial" | "paid" | "cancelled";

export type PaymentMode = "cash" | "upi" | "card" | "bank" | "other";

export type BusinessSettings = {
  businessName: string;
  logo: string; // data URL or empty string
  address: string;
  phone: string;
  email: string;
  gstin: string;
  invoicePrefix: string;
  nextInvoiceNumber: number;
  currency: string; // ISO code, e.g. "INR"
  defaultTaxRate: number; // percent, e.g. 18
  defaultTerms: string;
  defaultNotes: string;
  aiEnabled: boolean; // user toggle; AI also requires a server key
};

export type Customer = {
  id: string;
  name: string;
  phone: string;
  email: string;
  address: string;
  gstin: string;
  createdAt: string;
  updatedAt: string;
};

export type Product = {
  id: string;
  name: string;
  description: string;
  defaultRate: number;
  defaultTaxRate: number; // percent
  unit: string; // e.g. "pcs", "kg", "hour"
  active: boolean;
  createdAt: string;
  updatedAt: string;
};

export type BillItem = {
  id: string;
  productId: string | null;
  name: string;
  quantity: number;
  rate: number;
  discount: number; // flat amount in currency, applied to the line
  taxRate: number; // percent
  // Derived (stored for snapshot/PDF stability):
  lineSubtotal: number; // quantity * rate
  lineDiscount: number; // = discount (clamped)
  lineTaxable: number; // lineSubtotal - lineDiscount
  lineTax: number; // lineTaxable * taxRate / 100
  lineTotal: number; // lineTaxable + lineTax
};

// Snapshot of customer details captured at bill creation so historical
// bills/PDFs stay correct even if the customer record later changes.
export type CustomerSnapshot = {
  name: string;
  phone: string;
  email: string;
  address: string;
  gstin: string;
};

export type Bill = {
  id: string;
  invoiceNumber: string;
  customerId: string | null;
  customer: CustomerSnapshot;
  items: BillItem[];
  subtotal: number;
  discountTotal: number;
  taxTotal: number;
  grandTotal: number;
  amountPaid: number;
  balanceDue: number;
  status: BillStatus;
  notes: string;
  terms: string;
  createdAt: string;
  updatedAt: string;
  finalizedAt: string | null;
};

export type Payment = {
  id: string;
  billId: string;
  invoiceNumber: string;
  customerName: string;
  amount: number;
  mode: PaymentMode;
  reference: string;
  paidAt: string;
  notes: string;
};

export type ActivityEntry = {
  id: string;
  message: string;
  at: string;
};

export type BillingState = {
  settings: BusinessSettings;
  customers: Customer[];
  products: Product[];
  bills: Bill[];
  payments: Payment[];
  activity: ActivityEntry[];
};

export const BILL_STATUS_LABELS: Record<BillStatus, string> = {
  draft: "Draft",
  unpaid: "Unpaid",
  partial: "Partly Paid",
  paid: "Paid",
  cancelled: "Cancelled",
};

export const PAYMENT_MODE_LABELS: Record<PaymentMode, string> = {
  cash: "Cash",
  upi: "UPI",
  card: "Card",
  bank: "Bank Transfer",
  other: "Other",
};
