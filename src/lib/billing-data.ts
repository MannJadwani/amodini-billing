export type CustomerStatus = "Active" | "Overdue" | "Prospect";
export type InvoiceStatus = "Draft" | "Sent" | "Paid" | "Overdue";

export type Customer = {
  id: string;
  name: string;
  company: string;
  email: string;
  phone: string;
  address: string;
  status: CustomerStatus;
  notes: string;
};

export type InventoryItem = {
  id: string;
  sku: string;
  name: string;
  category: string;
  stock: number;
  reorderPoint: number;
  unitPrice: number;
  supplier: string;
};

export type InvoiceLineItem = {
  itemId: string;
  sku: string;
  description: string;
  quantity: number;
  unitPrice: number;
  total: number;
};

export type Invoice = {
  id: string;
  invoiceNumber: string;
  customerId: string;
  customerName: string;
  issueDate: string;
  dueDate: string;
  status: InvoiceStatus;
  lineItems: InvoiceLineItem[];
  subtotal: number;
  taxRate: number;
  taxTotal: number;
  total: number;
  amountPaid: number;
  notes: string;
};

export type Payment = {
  id: string;
  invoiceId: string;
  invoiceNumber: string;
  customerName: string;
  amount: number;
  date: string;
  method: string;
};

export type BillingState = {
  customers: Customer[];
  inventory: InventoryItem[];
  invoices: Invoice[];
  payments: Payment[];
};

export const seedBillingState: BillingState = {
  customers: [
    {
      id: "cust-001",
      name: "Priya Shah",
      company: "Lotus Cafe",
      email: "priya@lotuscafe.example",
      phone: "+91 98765 21001",
      address: "12 Market Road, Pune",
      status: "Active",
      notes: "Prefers monthly consolidated invoices.",
    },
    {
      id: "cust-002",
      name: "Rahul Mehta",
      company: "Mehta Retail",
      email: "rahul@mehtaretail.example",
      phone: "+91 98765 21002",
      address: "45 Station Avenue, Mumbai",
      status: "Overdue",
      notes: "Follow up on invoice INV-1002.",
    },
    {
      id: "cust-003",
      name: "Aisha Khan",
      company: "Aisha Events",
      email: "hello@aishaevents.example",
      phone: "+91 98765 21003",
      address: "8 Lake View, Bengaluru",
      status: "Prospect",
      notes: "Interested in bulk event supplies.",
    },
  ],
  inventory: [
    {
      id: "item-001",
      sku: "BAG-RICE-25",
      name: "Premium Rice Bag 25kg",
      category: "Grocery",
      stock: 42,
      reorderPoint: 15,
      unitPrice: 1850,
      supplier: "Amodini Wholesale",
    },
    {
      id: "item-002",
      sku: "OIL-SUN-15",
      name: "Sunflower Oil 15L",
      category: "Grocery",
      stock: 18,
      reorderPoint: 12,
      unitPrice: 2200,
      supplier: "FreshHarvest",
    },
    {
      id: "item-003",
      sku: "NAP-ECO-500",
      name: "Eco Napkins 500 pack",
      category: "Packaging",
      stock: 9,
      reorderPoint: 20,
      unitPrice: 320,
      supplier: "GreenServe",
    },
    {
      id: "item-004",
      sku: "CUP-PAPER-250",
      name: "Paper Cups 250 pack",
      category: "Packaging",
      stock: 33,
      reorderPoint: 18,
      unitPrice: 450,
      supplier: "GreenServe",
    },
  ],
  invoices: [
    {
      id: "inv-001",
      invoiceNumber: "INV-1001",
      customerId: "cust-001",
      customerName: "Lotus Cafe",
      issueDate: "2026-06-01",
      dueDate: "2026-06-15",
      status: "Sent",
      lineItems: [
        {
          itemId: "item-001",
          sku: "BAG-RICE-25",
          description: "Premium Rice Bag 25kg",
          quantity: 4,
          unitPrice: 1850,
          total: 7400,
        },
        {
          itemId: "item-004",
          sku: "CUP-PAPER-250",
          description: "Paper Cups 250 pack",
          quantity: 6,
          unitPrice: 450,
          total: 2700,
        },
      ],
      subtotal: 10100,
      taxRate: 18,
      taxTotal: 1818,
      total: 11918,
      amountPaid: 0,
      notes: "Due on receipt of delivery.",
    },
    {
      id: "inv-002",
      invoiceNumber: "INV-1002",
      customerId: "cust-002",
      customerName: "Mehta Retail",
      issueDate: "2026-05-18",
      dueDate: "2026-06-01",
      status: "Overdue",
      lineItems: [
        {
          itemId: "item-002",
          sku: "OIL-SUN-15",
          description: "Sunflower Oil 15L",
          quantity: 3,
          unitPrice: 2200,
          total: 6600,
        },
      ],
      subtotal: 6600,
      taxRate: 18,
      taxTotal: 1188,
      total: 7788,
      amountPaid: 2500,
      notes: "Partial payment received.",
    },
  ],
  payments: [
    {
      id: "pay-001",
      invoiceId: "inv-002",
      invoiceNumber: "INV-1002",
      customerName: "Mehta Retail",
      amount: 2500,
      date: "2026-05-28",
      method: "UPI",
    },
  ],
};
