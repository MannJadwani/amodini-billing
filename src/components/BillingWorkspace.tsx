"use client";

import { FormEvent, ReactNode, useEffect, useMemo, useState } from "react";
import {
  useCopilotAction,
  useCopilotAdditionalInstructions,
  useCopilotReadable,
} from "@copilotkit/react-core";
import { CopilotSidebar } from "@copilotkit/react-ui";
import {
  BillingState,
  CustomerStatus,
  InvoiceLineItem,
  InvoiceStatus,
  InventoryItem,
  seedBillingState,
} from "../lib/billing-data";

const STORAGE_KEY = "amodini-billing-state";

type CreateCustomerInput = {
  name: string;
  company?: string;
  email?: string;
  phone?: string;
  address?: string;
  status?: CustomerStatus;
  notes?: string;
};

type InventoryInput = {
  sku: string;
  name: string;
  category?: string;
  stock?: number;
  reorderPoint?: number;
  unitPrice?: number;
  supplier?: string;
};

type InvoiceInput = {
  customerName: string;
  dueDate?: string;
  status?: InvoiceStatus;
  taxRate?: number;
  notes?: string;
  lineItems: Array<{
    sku: string;
    quantity: number;
    unitPrice?: number;
    description?: string;
  }>;
};

type PaymentInput = {
  invoiceNumber: string;
  amount: number;
  method?: string;
  date?: string;
};

type ActivityEntry = {
  id: string;
  message: string;
};

const moneyFormatter = new Intl.NumberFormat("en-IN", {
  style: "currency",
  currency: "INR",
  maximumFractionDigits: 0,
});

const today = () => new Date().toISOString().slice(0, 10);

function cloneSeedState(): BillingState {
  return JSON.parse(JSON.stringify(seedBillingState)) as BillingState;
}

function makeId(prefix: string) {
  return `${prefix}-${Date.now().toString(36)}-${Math.random()
    .toString(36)
    .slice(2, 7)}`;
}

function formatMoney(value: number) {
  return moneyFormatter.format(value || 0);
}

function normalizeStatus<T extends string>(
  value: string | undefined,
  allowed: readonly T[],
  fallback: T,
) {
  if (!value) {
    return fallback;
  }

  const match = allowed.find(
    (option) => option.toLowerCase() === value.toLowerCase(),
  );
  return match ?? fallback;
}

function findCustomer(state: BillingState, nameOrCompany: string) {
  const lookup = nameOrCompany.trim().toLowerCase();
  return state.customers.find(
    (customer) =>
      customer.name.toLowerCase() === lookup ||
      customer.company.toLowerCase() === lookup ||
      customer.name.toLowerCase().includes(lookup) ||
      customer.company.toLowerCase().includes(lookup),
  );
}

function calculateInvoiceTotals(
  lineItems: InvoiceLineItem[],
  taxRate: number,
) {
  const subtotal = lineItems.reduce((sum, item) => sum + item.total, 0);
  const taxTotal = Math.round((subtotal * taxRate) / 100);

  return {
    subtotal,
    taxTotal,
    total: subtotal + taxTotal,
  };
}

function createInvoiceLines(
  inventory: InventoryItem[],
  requestedItems: InvoiceInput["lineItems"],
) {
  const lineItems: InvoiceLineItem[] = [];
  const missingSkus: string[] = [];

  requestedItems.forEach((requestedItem) => {
    const inventoryItem = inventory.find(
      (item) =>
        item.sku.toLowerCase() === requestedItem.sku.trim().toLowerCase(),
    );

    if (!inventoryItem && requestedItem.unitPrice === undefined) {
      missingSkus.push(requestedItem.sku);
      return;
    }

    const quantity = Math.max(1, Number(requestedItem.quantity) || 1);
    const unitPrice = Number(
      requestedItem.unitPrice ?? inventoryItem?.unitPrice ?? 0,
    );
    const description =
      requestedItem.description || inventoryItem?.name || requestedItem.sku;

    lineItems.push({
      itemId: inventoryItem?.id ?? makeId("custom-item"),
      sku: inventoryItem?.sku ?? requestedItem.sku,
      description,
      quantity,
      unitPrice,
      total: quantity * unitPrice,
    });
  });

  return { lineItems, missingSkus };
}

export function BillingWorkspace() {
  const [state, setState] = useState<BillingState>(() => {
    if (typeof window === "undefined") {
      return cloneSeedState();
    }

    const savedState = window.localStorage.getItem(STORAGE_KEY);

    if (!savedState) {
      return cloneSeedState();
    }

    try {
      return JSON.parse(savedState) as BillingState;
    } catch {
      window.localStorage.removeItem(STORAGE_KEY);
      return cloneSeedState();
    }
  });
  const [selectedCustomerId, setSelectedCustomerId] = useState("cust-001");
  const [activityLog, setActivityLog] = useState<ActivityEntry[]>([
    {
      id: "activity-seed",
      message: "Workspace ready. Ask the assistant to create invoices or update stock.",
    },
  ]);
  const [customerForm, setCustomerForm] = useState<CreateCustomerInput>({
    name: "",
    company: "",
    email: "",
    phone: "",
    address: "",
    status: "Prospect",
    notes: "",
  });
  const [inventoryForm, setInventoryForm] = useState<InventoryInput>({
    sku: "",
    name: "",
    category: "",
    stock: 0,
    reorderPoint: 10,
    unitPrice: 0,
    supplier: "",
  });
  const [invoiceForm, setInvoiceForm] = useState({
    customerId: "cust-001",
    sku: "BAG-RICE-25",
    quantity: 1,
    dueDate: "2026-06-30",
    notes: "",
  });

  useEffect(() => {
    if (typeof window !== "undefined") {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    }
  }, [state]);

  const selectedCustomer = useMemo(
    () =>
      state.customers.find((customer) => customer.id === selectedCustomerId) ??
      state.customers[0],
    [selectedCustomerId, state.customers],
  );

  const stats = useMemo(() => {
    const totalRevenue = state.invoices.reduce(
      (sum, invoice) => sum + invoice.amountPaid,
      0,
    );
    const outstanding = state.invoices.reduce(
      (sum, invoice) => sum + Math.max(invoice.total - invoice.amountPaid, 0),
      0,
    );
    const lowStockCount = state.inventory.filter(
      (item) => item.stock <= item.reorderPoint,
    ).length;
    const overdueCount = state.invoices.filter(
      (invoice) => invoice.status === "Overdue",
    ).length;

    return { totalRevenue, outstanding, lowStockCount, overdueCount };
  }, [state]);

  const recordActivity = (message: string) => {
    setActivityLog((entries) => [
      { id: makeId("activity"), message },
      ...entries.slice(0, 7),
    ]);
  };

  const createCustomer = (input: CreateCustomerInput) => {
    if (!input.name?.trim()) {
      return "Customer name is required.";
    }

    const status = normalizeStatus<CustomerStatus>(
      input.status,
      ["Active", "Overdue", "Prospect"],
      "Prospect",
    );
    const customer = {
      id: makeId("cust"),
      name: input.name.trim(),
      company: input.company?.trim() || input.name.trim(),
      email: input.email?.trim() || "not-provided@example.com",
      phone: input.phone?.trim() || "Not provided",
      address: input.address?.trim() || "Not provided",
      status,
      notes: input.notes?.trim() || "No notes yet.",
    };

    setState((current) => ({
      ...current,
      customers: [customer, ...current.customers],
    }));
    setSelectedCustomerId(customer.id);
    recordActivity(`Added customer ${customer.company}.`);

    return `Created customer ${customer.company}.`;
  };

  const upsertInventoryItem = (input: InventoryInput) => {
    if (!input.sku?.trim() || !input.name?.trim()) {
      return "Inventory SKU and item name are required.";
    }

    const sku = input.sku.trim().toUpperCase();
    const quantity = Number(input.stock ?? 0);
    const unitPrice = Number(input.unitPrice ?? 0);
    let message = "";

    setState((current) => {
      const existing = current.inventory.find(
        (item) => item.sku.toLowerCase() === sku.toLowerCase(),
      );

      if (existing) {
        message = `Updated inventory item ${sku}.`;
        return {
          ...current,
          inventory: current.inventory.map((item) =>
            item.id === existing.id
              ? {
                  ...item,
                  name: input.name.trim(),
                  category: input.category?.trim() || item.category,
                  stock: quantity,
                  reorderPoint: Number(input.reorderPoint ?? item.reorderPoint),
                  unitPrice,
                  supplier: input.supplier?.trim() || item.supplier,
                }
              : item,
          ),
        };
      }

      message = `Added inventory item ${sku}.`;
      return {
        ...current,
        inventory: [
          {
            id: makeId("item"),
            sku,
            name: input.name.trim(),
            category: input.category?.trim() || "General",
            stock: quantity,
            reorderPoint: Number(input.reorderPoint ?? 10),
            unitPrice,
            supplier: input.supplier?.trim() || "Unassigned",
          },
          ...current.inventory,
        ],
      };
    });

    recordActivity(message);
    return message;
  };

  const adjustInventoryStock = (
    skuInput: string,
    quantityChange: number,
    reason?: string,
  ) => {
    if (!skuInput?.trim() || Number.isNaN(Number(quantityChange))) {
      return "SKU and quantity change are required.";
    }

    const sku = skuInput.trim();
    let message = `Could not find SKU ${sku}.`;

    setState((current) => ({
      ...current,
      inventory: current.inventory.map((item) => {
        if (item.sku.toLowerCase() !== sku.toLowerCase()) {
          return item;
        }

        const nextStock = Math.max(0, item.stock + Number(quantityChange));
        message = `Adjusted ${item.sku} stock from ${item.stock} to ${nextStock}${
          reason ? ` (${reason})` : ""
        }.`;

        return {
          ...item,
          stock: nextStock,
        };
      }),
    }));

    recordActivity(message);
    return message;
  };

  const createInvoice = (input: InvoiceInput) => {
    if (!input.customerName?.trim()) {
      return "Customer name or company is required.";
    }

    if (!input.lineItems?.length) {
      return "At least one line item is required.";
    }

    let message = "";

    setState((current) => {
      const customer = findCustomer(current, input.customerName);

      if (!customer) {
        message = `Could not find customer ${input.customerName}. Add the customer first.`;
        return current;
      }

      const { lineItems, missingSkus } = createInvoiceLines(
        current.inventory,
        input.lineItems,
      );

      if (missingSkus.length > 0 || lineItems.length === 0) {
        message = `Could not create invoice. Missing SKU pricing for: ${missingSkus.join(
          ", ",
        )}.`;
        return current;
      }

      const taxRate = Number(input.taxRate ?? 18);
      const totals = calculateInvoiceTotals(lineItems, taxRate);
      const invoiceNumber = `INV-${1001 + current.invoices.length}`;
      const invoice = {
        id: makeId("inv"),
        invoiceNumber,
        customerId: customer.id,
        customerName: customer.company,
        issueDate: today(),
        dueDate: input.dueDate || today(),
        status: normalizeStatus<InvoiceStatus>(
          input.status,
          ["Draft", "Sent", "Paid", "Overdue"],
          "Sent",
        ),
        lineItems,
        subtotal: totals.subtotal,
        taxRate,
        taxTotal: totals.taxTotal,
        total: totals.total,
        amountPaid: input.status === "Paid" ? totals.total : 0,
        notes: input.notes?.trim() || "Created from billing workspace.",
      };
      const nextInventory = current.inventory.map((item) => {
        const line = lineItems.find(
          (lineItem) => lineItem.sku.toLowerCase() === item.sku.toLowerCase(),
        );

        if (!line) {
          return item;
        }

        return {
          ...item,
          stock: Math.max(0, item.stock - line.quantity),
        };
      });

      message = `Created ${invoiceNumber} for ${customer.company} (${formatMoney(
        invoice.total,
      )}).`;

      return {
        ...current,
        inventory: nextInventory,
        invoices: [invoice, ...current.invoices],
      };
    });

    recordActivity(message);
    return message;
  };

  const recordPayment = (input: PaymentInput) => {
    if (!input.invoiceNumber?.trim() || Number(input.amount) <= 0) {
      return "Invoice number and a positive payment amount are required.";
    }

    let message = `Could not find invoice ${input.invoiceNumber}.`;

    setState((current) => {
      const invoice = current.invoices.find(
        (item) =>
          item.invoiceNumber.toLowerCase() ===
          input.invoiceNumber.trim().toLowerCase(),
      );

      if (!invoice) {
        return current;
      }

      const paidAmount = Math.min(
        invoice.total,
        invoice.amountPaid + Number(input.amount),
      );
      const updatedInvoice = {
        ...invoice,
        amountPaid: paidAmount,
        status: paidAmount >= invoice.total ? "Paid" : invoice.status,
      } satisfies typeof invoice;
      const payment = {
        id: makeId("pay"),
        invoiceId: invoice.id,
        invoiceNumber: invoice.invoiceNumber,
        customerName: invoice.customerName,
        amount: Number(input.amount),
        date: input.date || today(),
        method: input.method?.trim() || "Cash",
      };

      message = `Recorded ${formatMoney(payment.amount)} payment for ${
        invoice.invoiceNumber
      }.`;

      return {
        ...current,
        invoices: current.invoices.map((item) =>
          item.id === invoice.id ? updatedInvoice : item,
        ),
        payments: [payment, ...current.payments],
      };
    });

    recordActivity(message);
    return message;
  };

  useCopilotReadable(
    {
      description: "Current billing management data",
      value: {
        customers: state.customers,
        inventory: state.inventory,
        invoices: state.invoices,
        payments: state.payments,
        summary: stats,
      },
    },
    [state, stats],
  );

  useCopilotAdditionalInstructions(
    {
      instructions:
        "You are the billing operations assistant for Amodini Billing. Use the available actions to create customers, maintain inventory, create invoices, record payments, and summarize overdue or low-stock work. Prefer exact SKUs and customer company names from the readable context. Ask for missing customer names, SKU, quantity, due date, or payment amount before taking action.",
    },
    [],
  );

  useCopilotAction({
    name: "createCustomer",
    description: "Create a new customer record in the billing app.",
    parameters: [
      { name: "name", type: "string", required: true },
      { name: "company", type: "string" },
      { name: "email", type: "string" },
      { name: "phone", type: "string" },
      { name: "address", type: "string" },
      {
        name: "status",
        type: "string",
        enum: ["Active", "Overdue", "Prospect"],
      },
      { name: "notes", type: "string" },
    ],
    handler: createCustomer,
  });

  useCopilotAction({
    name: "updateCustomerStatus",
    description: "Update a customer status and optionally append notes.",
    parameters: [
      {
        name: "customerName",
        type: "string",
        required: true,
        description: "The customer contact name or company name.",
      },
      {
        name: "status",
        type: "string",
        enum: ["Active", "Overdue", "Prospect"],
        required: true,
      },
      { name: "notes", type: "string" },
    ],
    handler: ({ customerName, status, notes }) => {
      let message = `Could not find customer ${customerName}.`;
      const nextStatus = normalizeStatus<CustomerStatus>(
        status,
        ["Active", "Overdue", "Prospect"],
        "Active",
      );

      setState((current) => ({
        ...current,
        customers: current.customers.map((customer) => {
          const isMatch =
            customer.name.toLowerCase() === customerName.toLowerCase() ||
            customer.company.toLowerCase() === customerName.toLowerCase();

          if (!isMatch) {
            return customer;
          }

          message = `Updated ${customer.company} to ${nextStatus}.`;
          return {
            ...customer,
            status: nextStatus,
            notes: notes ? `${customer.notes} ${notes}` : customer.notes,
          };
        }),
      }));

      recordActivity(message);
      return message;
    },
  });

  useCopilotAction({
    name: "upsertInventoryItem",
    description:
      "Add a new inventory item or update an existing item by SKU with price and stock levels.",
    parameters: [
      { name: "sku", type: "string", required: true },
      { name: "name", type: "string", required: true },
      { name: "category", type: "string" },
      { name: "stock", type: "number" },
      { name: "reorderPoint", type: "number" },
      { name: "unitPrice", type: "number" },
      { name: "supplier", type: "string" },
    ],
    handler: upsertInventoryItem,
  });

  useCopilotAction({
    name: "adjustInventoryStock",
    description:
      "Increase or decrease stock for an inventory item by SKU. Use a negative quantityChange for sales or shrinkage.",
    parameters: [
      { name: "sku", type: "string", required: true },
      { name: "quantityChange", type: "number", required: true },
      { name: "reason", type: "string" },
    ],
    handler: ({ sku, quantityChange, reason }) =>
      adjustInventoryStock(sku, quantityChange, reason),
  });

  useCopilotAction({
    name: "createInvoice",
    description:
      "Create an invoice for a customer and reduce inventory for matching SKUs.",
    parameters: [
      {
        name: "customerName",
        type: "string",
        required: true,
        description: "The customer contact name or company name.",
      },
      { name: "dueDate", type: "string", description: "YYYY-MM-DD date." },
      {
        name: "status",
        type: "string",
        enum: ["Draft", "Sent", "Paid", "Overdue"],
      },
      { name: "taxRate", type: "number" },
      { name: "notes", type: "string" },
      {
        name: "lineItems",
        type: "object[]",
        required: true,
        attributes: [
          { name: "sku", type: "string", required: true },
          { name: "quantity", type: "number", required: true },
          { name: "unitPrice", type: "number" },
          { name: "description", type: "string" },
        ],
      },
    ],
    handler: (input) => createInvoice(input),
  });

  useCopilotAction({
    name: "recordPayment",
    description: "Record a payment against an invoice and mark it paid when complete.",
    parameters: [
      { name: "invoiceNumber", type: "string", required: true },
      { name: "amount", type: "number", required: true },
      { name: "method", type: "string" },
      { name: "date", type: "string", description: "YYYY-MM-DD date." },
    ],
    handler: recordPayment,
  });

  useCopilotAction({
    name: "summarizeBillingHealth",
    description:
      "Return a concise operational summary of revenue, outstanding invoices, overdue invoices, and low stock.",
    parameters: [],
    handler: () => {
      const lowStock = state.inventory
        .filter((item) => item.stock <= item.reorderPoint)
        .map((item) => `${item.sku} (${item.stock} left)`)
        .join(", ");
      const overdue = state.invoices
        .filter((invoice) => invoice.status === "Overdue")
        .map(
          (invoice) =>
            `${invoice.invoiceNumber} ${invoice.customerName} ${formatMoney(
              invoice.total - invoice.amountPaid,
            )}`,
        )
        .join(", ");

      return `Revenue collected: ${formatMoney(
        stats.totalRevenue,
      )}. Outstanding: ${formatMoney(stats.outstanding)}. Overdue: ${
        overdue || "none"
      }. Low stock: ${lowStock || "none"}.`;
    },
  });

  const handleCustomerSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const message = createCustomer(customerForm);

    if (!message.startsWith("Customer name")) {
      setCustomerForm({
        name: "",
        company: "",
        email: "",
        phone: "",
        address: "",
        status: "Prospect",
        notes: "",
      });
    }
  };

  const handleInventorySubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const message = upsertInventoryItem(inventoryForm);

    if (!message.includes("required")) {
      setInventoryForm({
        sku: "",
        name: "",
        category: "",
        stock: 0,
        reorderPoint: 10,
        unitPrice: 0,
        supplier: "",
      });
    }
  };

  const handleInvoiceSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const customer = state.customers.find(
      (item) => item.id === invoiceForm.customerId,
    );
    const inventoryItem = state.inventory.find(
      (item) => item.sku === invoiceForm.sku,
    );

    if (!customer || !inventoryItem) {
      return;
    }

    createInvoice({
      customerName: customer.company,
      dueDate: invoiceForm.dueDate,
      notes: invoiceForm.notes,
      lineItems: [
        {
          sku: inventoryItem.sku,
          quantity: Number(invoiceForm.quantity),
        },
      ],
    });
  };

  const resetDemoData = () => {
    const freshState = cloneSeedState();
    setState(freshState);
    setSelectedCustomerId(freshState.customers[0].id);
    recordActivity("Reset workspace to demo billing data.");
  };

  return (
    <main className="app-shell">
      <section className="hero">
        <div>
          <p className="eyebrow">Amodini Billing</p>
          <h1>Agentic billing management workspace</h1>
          <p className="hero-copy">
            Manage customers, inventory, invoices, and payments manually or ask
            the CopilotKit assistant to make entries for you.
          </p>
          <div className="hero-actions">
            <button type="button" onClick={resetDemoData}>
              Reset demo data
            </button>
            <span>Set OPENAI_API_KEY to enable live assistant responses.</span>
          </div>
        </div>
        <div className="assistant-card">
          <strong>Try asking</strong>
          <ul>
            <li>Create a customer for Nova Catering.</li>
            <li>Invoice Lotus Cafe for 2 BAG-RICE-25 due 2026-07-01.</li>
            <li>Show overdue invoices and low-stock products.</li>
          </ul>
        </div>
      </section>

      <section className="metrics-grid" aria-label="Billing summary">
        <MetricCard label="Revenue collected" value={formatMoney(stats.totalRevenue)} />
        <MetricCard label="Outstanding" value={formatMoney(stats.outstanding)} />
        <MetricCard label="Low-stock SKUs" value={String(stats.lowStockCount)} />
        <MetricCard label="Overdue invoices" value={String(stats.overdueCount)} />
      </section>

      <section className="workspace-grid">
        <article className="panel span-2">
          <div className="panel-heading">
            <div>
              <p className="eyebrow">Customers</p>
              <h2>Customer list and details</h2>
            </div>
            <span>{state.customers.length} records</span>
          </div>
          <div className="split">
            <div className="list-stack">
              {state.customers.map((customer) => (
                <button
                  className={`customer-row ${
                    customer.id === selectedCustomer?.id ? "is-active" : ""
                  }`}
                  key={customer.id}
                  type="button"
                  onClick={() => setSelectedCustomerId(customer.id)}
                >
                  <span>
                    <strong>{customer.company}</strong>
                    <small>{customer.name}</small>
                  </span>
                  <Badge tone={customer.status === "Overdue" ? "danger" : "neutral"}>
                    {customer.status}
                  </Badge>
                </button>
              ))}
            </div>
            {selectedCustomer ? (
              <div className="details-card">
                <h3>{selectedCustomer.company}</h3>
                <dl>
                  <div>
                    <dt>Contact</dt>
                    <dd>{selectedCustomer.name}</dd>
                  </div>
                  <div>
                    <dt>Email</dt>
                    <dd>{selectedCustomer.email}</dd>
                  </div>
                  <div>
                    <dt>Phone</dt>
                    <dd>{selectedCustomer.phone}</dd>
                  </div>
                  <div>
                    <dt>Address</dt>
                    <dd>{selectedCustomer.address}</dd>
                  </div>
                </dl>
                <p>{selectedCustomer.notes}</p>
              </div>
            ) : null}
          </div>
          <form className="inline-form" onSubmit={handleCustomerSubmit}>
            <input
              aria-label="Customer name"
              placeholder="Contact name"
              value={customerForm.name}
              onChange={(event) =>
                setCustomerForm((form) => ({ ...form, name: event.target.value }))
              }
            />
            <input
              aria-label="Company"
              placeholder="Company"
              value={customerForm.company}
              onChange={(event) =>
                setCustomerForm((form) => ({
                  ...form,
                  company: event.target.value,
                }))
              }
            />
            <input
              aria-label="Email"
              placeholder="Email"
              value={customerForm.email}
              onChange={(event) =>
                setCustomerForm((form) => ({ ...form, email: event.target.value }))
              }
            />
            <button type="submit">Add customer</button>
          </form>
        </article>

        <article className="panel">
          <div className="panel-heading">
            <div>
              <p className="eyebrow">Inventory</p>
              <h2>Stock and pricing</h2>
            </div>
          </div>
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>SKU</th>
                  <th>Item</th>
                  <th>Stock</th>
                  <th>Price</th>
                </tr>
              </thead>
              <tbody>
                {state.inventory.map((item) => (
                  <tr key={item.id}>
                    <td>{item.sku}</td>
                    <td>{item.name}</td>
                    <td>
                      <Badge tone={item.stock <= item.reorderPoint ? "danger" : "neutral"}>
                        {item.stock}
                      </Badge>
                    </td>
                    <td>{formatMoney(item.unitPrice)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <form className="stack-form" onSubmit={handleInventorySubmit}>
            <input
              aria-label="SKU"
              placeholder="SKU"
              value={inventoryForm.sku}
              onChange={(event) =>
                setInventoryForm((form) => ({ ...form, sku: event.target.value }))
              }
            />
            <input
              aria-label="Item name"
              placeholder="Item name"
              value={inventoryForm.name}
              onChange={(event) =>
                setInventoryForm((form) => ({ ...form, name: event.target.value }))
              }
            />
            <div className="form-row">
              <input
                aria-label="Stock"
                min="0"
                type="number"
                value={inventoryForm.stock}
                onChange={(event) =>
                  setInventoryForm((form) => ({
                    ...form,
                    stock: Number(event.target.value),
                  }))
                }
              />
              <input
                aria-label="Unit price"
                min="0"
                type="number"
                value={inventoryForm.unitPrice}
                onChange={(event) =>
                  setInventoryForm((form) => ({
                    ...form,
                    unitPrice: Number(event.target.value),
                  }))
                }
              />
            </div>
            <button type="submit">Save inventory</button>
          </form>
        </article>

        <article className="panel span-2">
          <div className="panel-heading">
            <div>
              <p className="eyebrow">Invoices</p>
              <h2>Invoice management</h2>
            </div>
          </div>
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Invoice</th>
                  <th>Customer</th>
                  <th>Due</th>
                  <th>Status</th>
                  <th>Total</th>
                  <th>Balance</th>
                </tr>
              </thead>
              <tbody>
                {state.invoices.map((invoice) => (
                  <tr key={invoice.id}>
                    <td>{invoice.invoiceNumber}</td>
                    <td>{invoice.customerName}</td>
                    <td>{invoice.dueDate}</td>
                    <td>
                      <Badge
                        tone={
                          invoice.status === "Overdue"
                            ? "danger"
                            : invoice.status === "Paid"
                              ? "success"
                              : "neutral"
                        }
                      >
                        {invoice.status}
                      </Badge>
                    </td>
                    <td>{formatMoney(invoice.total)}</td>
                    <td>{formatMoney(invoice.total - invoice.amountPaid)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <form className="inline-form" onSubmit={handleInvoiceSubmit}>
            <select
              aria-label="Invoice customer"
              value={invoiceForm.customerId}
              onChange={(event) =>
                setInvoiceForm((form) => ({
                  ...form,
                  customerId: event.target.value,
                }))
              }
            >
              {state.customers.map((customer) => (
                <option key={customer.id} value={customer.id}>
                  {customer.company}
                </option>
              ))}
            </select>
            <select
              aria-label="Invoice SKU"
              value={invoiceForm.sku}
              onChange={(event) =>
                setInvoiceForm((form) => ({ ...form, sku: event.target.value }))
              }
            >
              {state.inventory.map((item) => (
                <option key={item.id} value={item.sku}>
                  {item.sku}
                </option>
              ))}
            </select>
            <input
              aria-label="Quantity"
              min="1"
              type="number"
              value={invoiceForm.quantity}
              onChange={(event) =>
                setInvoiceForm((form) => ({
                  ...form,
                  quantity: Number(event.target.value),
                }))
              }
            />
            <input
              aria-label="Due date"
              type="date"
              value={invoiceForm.dueDate}
              onChange={(event) =>
                setInvoiceForm((form) => ({
                  ...form,
                  dueDate: event.target.value,
                }))
              }
            />
            <button type="submit">Create invoice</button>
          </form>
        </article>

        <article className="panel">
          <div className="panel-heading">
            <div>
              <p className="eyebrow">Payments</p>
              <h2>Recent payments</h2>
            </div>
          </div>
          <div className="list-stack">
            {state.payments.map((payment) => (
              <div className="payment-row" key={payment.id}>
                <span>
                  <strong>{formatMoney(payment.amount)}</strong>
                  <small>
                    {payment.invoiceNumber} - {payment.customerName}
                  </small>
                </span>
                <small>{payment.method}</small>
              </div>
            ))}
          </div>
        </article>

        <article className="panel">
          <div className="panel-heading">
            <div>
              <p className="eyebrow">Activity</p>
              <h2>Assistant and app log</h2>
            </div>
          </div>
          <div className="activity-list">
            {activityLog.map((entry) => (
              <p key={entry.id}>{entry.message}</p>
            ))}
          </div>
        </article>
      </section>

      <CopilotSidebar
        defaultOpen
        clickOutsideToClose={false}
        labels={{
          title: "Billing Assistant",
          initial:
            "Hi! I can add customers, update inventory, create invoices, record payments, and summarize billing health. What should I do?",
        }}
      />
    </main>
  );
}

function MetricCard({ label, value }: { label: string; value: string }) {
  return (
    <article className="metric-card">
      <span>{label}</span>
      <strong>{value}</strong>
    </article>
  );
}

function Badge({
  children,
  tone,
}: {
  children: ReactNode;
  tone: "neutral" | "success" | "danger";
}) {
  return <span className={`badge badge-${tone}`}>{children}</span>;
}
