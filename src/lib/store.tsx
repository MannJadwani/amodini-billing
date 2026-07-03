"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import {
  ActivityEntry,
  Bill,
  BillItem,
  BillStatus,
  BillingState,
  BusinessSettings,
  Customer,
  CustomerSnapshot,
  Payment,
  PaymentMode,
  Product,
} from "./types";
import { buildSeedState } from "./seed";
import { recalcBill, round2 } from "./calc";

const STORAGE_KEY = "simple-billing-state-v1";

function makeId(prefix: string): string {
  return `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`;
}

function nowISO(): string {
  return new Date().toISOString();
}

function emptySnapshot(): CustomerSnapshot {
  return { name: "", phone: "", email: "", address: "", gstin: "" };
}

export type NewCustomer = Partial<Omit<Customer, "id" | "createdAt" | "updatedAt">> & {
  name: string;
};
export type NewProduct = Partial<Omit<Product, "id" | "createdAt" | "updatedAt">> & {
  name: string;
};

export type DraftBillItem = {
  id?: string;
  productId?: string | null;
  name: string;
  quantity: number;
  rate: number;
  discount?: number;
  taxRate?: number;
};

export type DraftBillInput = {
  customerId?: string | null;
  customer?: Partial<CustomerSnapshot>;
  items?: DraftBillItem[];
  notes?: string;
  terms?: string;
  status?: BillStatus;
};

export type RecordPaymentInput = {
  amount: number;
  mode?: PaymentMode;
  reference?: string;
  paidAt?: string;
  notes?: string;
};

export type Stats = {
  todaySales: number;
  todayBillCount: number;
  outstanding: number;
  unpaidCount: number;
  totalCollected: number;
  monthSales: number;
  billCount: number;
};

type StoreValue = {
  state: BillingState;
  hydrated: boolean;
  stats: Stats;
  // settings
  updateSettings: (patch: Partial<BusinessSettings>) => void;
  // customers
  addCustomer: (input: NewCustomer) => Customer;
  updateCustomer: (id: string, patch: Partial<NewCustomer>) => void;
  deleteCustomer: (id: string) => void;
  customerBalance: (customerId: string) => number;
  // products
  addProduct: (input: NewProduct) => Product;
  updateProduct: (id: string, patch: Partial<NewProduct>) => void;
  deleteProduct: (id: string) => void;
  // bills
  getBill: (id: string) => Bill | undefined;
  createDraftBill: (input?: DraftBillInput) => Bill;
  saveBill: (id: string, input: DraftBillInput) => Bill | undefined;
  finalizeBill: (id: string) => Bill | undefined;
  cancelBill: (id: string) => void;
  deleteBill: (id: string) => void;
  previewInvoiceNumber: () => string;
  // payments
  recordPayment: (billId: string, input: RecordPaymentInput) => Payment | undefined;
  deletePayment: (id: string) => void;
  // misc
  log: (message: string) => void;
  resetDemoData: () => void;
};

const StoreContext = createContext<StoreValue | null>(null);

function itemsFromDraft(items: DraftBillItem[] | undefined, defaultTax: number): BillItem[] {
  return (items ?? []).map((it) =>
    // recalcBill will fully compute; here we just shape the raw fields.
    ({
      id: it.id ?? makeId("item"),
      productId: it.productId ?? null,
      name: it.name ?? "",
      quantity: Number(it.quantity) || 0,
      rate: Number(it.rate) || 0,
      discount: Number(it.discount) || 0,
      taxRate: it.taxRate === undefined ? defaultTax : Number(it.taxRate) || 0,
      lineSubtotal: 0,
      lineDiscount: 0,
      lineTaxable: 0,
      lineTax: 0,
      lineTotal: 0,
    }),
  );
}

export function BillingProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<BillingState>(() => buildSeedState());
  const [hydrated, setHydrated] = useState(false);
  const skipPersist = useRef(true);

  // Hydrate from localStorage after mount (avoids SSR mismatch).
  useEffect(() => {
    try {
      const saved = window.localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved) as BillingState;
        // Merge settings so new fields get defaults.
        const seed = buildSeedState();
        // Intentional: one-time hydration from localStorage after mount (the
        // standard SSR-safe pattern; server renders seed, client swaps to saved).
        // eslint-disable-next-line react-hooks/set-state-in-effect
        setState({
          ...seed,
          ...parsed,
          settings: { ...seed.settings, ...parsed.settings },
        });
      }
    } catch {
      // ignore corrupt storage
    }
    setHydrated(true);
  }, []);

  // Persist after hydration.
  useEffect(() => {
    if (skipPersist.current) {
      skipPersist.current = false;
      return;
    }
    if (!hydrated) return;
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch {
      // storage may be full / unavailable
    }
  }, [state, hydrated]);

  const log = useCallback((message: string) => {
    setState((s) => ({
      ...s,
      activity: [
        { id: makeId("act"), message, at: nowISO() } satisfies ActivityEntry,
        ...s.activity,
      ].slice(0, 30),
    }));
  }, []);

  const updateSettings = useCallback((patch: Partial<BusinessSettings>) => {
    setState((s) => ({ ...s, settings: { ...s.settings, ...patch } }));
  }, []);

  // ---- Customers ----
  const addCustomer = useCallback((input: NewCustomer): Customer => {
    const ts = nowISO();
    const customer: Customer = {
      id: makeId("cust"),
      name: input.name.trim(),
      phone: (input.phone ?? "").trim(),
      email: (input.email ?? "").trim(),
      address: (input.address ?? "").trim(),
      gstin: (input.gstin ?? "").trim(),
      createdAt: ts,
      updatedAt: ts,
    };
    setState((s) => ({ ...s, customers: [customer, ...s.customers] }));
    return customer;
  }, []);

  const updateCustomer = useCallback((id: string, patch: Partial<NewCustomer>) => {
    setState((s) => ({
      ...s,
      customers: s.customers.map((c) =>
        c.id === id ? { ...c, ...patch, updatedAt: nowISO() } : c,
      ),
    }));
  }, []);

  const deleteCustomer = useCallback((id: string) => {
    setState((s) => ({ ...s, customers: s.customers.filter((c) => c.id !== id) }));
  }, []);

  // ---- Products ----
  const addProduct = useCallback((input: NewProduct): Product => {
    const ts = nowISO();
    const product: Product = {
      id: makeId("prod"),
      name: input.name.trim(),
      description: (input.description ?? "").trim(),
      defaultRate: Number(input.defaultRate) || 0,
      defaultTaxRate: Number(input.defaultTaxRate) || 0,
      unit: (input.unit ?? "pcs").trim() || "pcs",
      active: input.active ?? true,
      createdAt: ts,
      updatedAt: ts,
    };
    setState((s) => ({ ...s, products: [product, ...s.products] }));
    return product;
  }, []);

  const updateProduct = useCallback((id: string, patch: Partial<NewProduct>) => {
    setState((s) => ({
      ...s,
      products: s.products.map((p) =>
        p.id === id ? { ...p, ...patch, updatedAt: nowISO() } : p,
      ),
    }));
  }, []);

  const deleteProduct = useCallback((id: string) => {
    setState((s) => ({ ...s, products: s.products.filter((p) => p.id !== id) }));
  }, []);

  // ---- Bills ----
  const getBill = useCallback(
    (id: string) => state.bills.find((b) => b.id === id),
    [state.bills],
  );

  const previewInvoiceNumber = useCallback(
    () => `${state.settings.invoicePrefix}${state.settings.nextInvoiceNumber}`,
    [state.settings.invoicePrefix, state.settings.nextInvoiceNumber],
  );

  const createDraftBill = useCallback((input?: DraftBillInput): Bill => {
    let created!: Bill;
    setState((s) => {
      const ts = nowISO();
      const invoiceNumber = `${s.settings.invoicePrefix}${s.settings.nextInvoiceNumber}`;
      const snapshot = input?.customerId
        ? (() => {
            const c = s.customers.find((x) => x.id === input.customerId);
            return c
              ? { name: c.name, phone: c.phone, email: c.email, address: c.address, gstin: c.gstin }
              : { ...emptySnapshot(), ...input?.customer };
          })()
        : { ...emptySnapshot(), ...input?.customer };

      const draft: Bill = recalcBill({
        id: makeId("bill"),
        invoiceNumber,
        customerId: input?.customerId ?? null,
        customer: snapshot,
        items: itemsFromDraft(input?.items, s.settings.defaultTaxRate),
        subtotal: 0,
        discountTotal: 0,
        taxTotal: 0,
        grandTotal: 0,
        amountPaid: 0,
        balanceDue: 0,
        status: "draft",
        notes: input?.notes ?? s.settings.defaultNotes,
        terms: input?.terms ?? s.settings.defaultTerms,
        createdAt: ts,
        updatedAt: ts,
        finalizedAt: null,
      });
      created = draft;
      return {
        ...s,
        bills: [draft, ...s.bills],
        settings: { ...s.settings, nextInvoiceNumber: s.settings.nextInvoiceNumber + 1 },
      };
    });
    return created;
  }, []);

  const saveBill = useCallback((id: string, input: DraftBillInput): Bill | undefined => {
    let saved: Bill | undefined;
    setState((s) => {
      const existing = s.bills.find((b) => b.id === id);
      if (!existing) return s;
      const snapshot: CustomerSnapshot = input.customerId
        ? (() => {
            const c = s.customers.find((x) => x.id === input.customerId);
            return c
              ? { name: c.name, phone: c.phone, email: c.email, address: c.address, gstin: c.gstin }
              : { ...existing.customer, ...input.customer };
          })()
        : { ...existing.customer, ...input.customer };

      const next = recalcBill({
        ...existing,
        customerId: input.customerId !== undefined ? input.customerId : existing.customerId,
        customer: snapshot,
        items: input.items
          ? itemsFromDraft(input.items, s.settings.defaultTaxRate)
          : existing.items,
        notes: input.notes ?? existing.notes,
        terms: input.terms ?? existing.terms,
        status: input.status ?? existing.status,
        updatedAt: nowISO(),
      });
      saved = next;
      return { ...s, bills: s.bills.map((b) => (b.id === id ? next : b)) };
    });
    return saved;
  }, []);

  const finalizeBill = useCallback((id: string): Bill | undefined => {
    let result: Bill | undefined;
    setState((s) => {
      const existing = s.bills.find((b) => b.id === id);
      if (!existing) return s;
      const ts = nowISO();
      const next = recalcBill({
        ...existing,
        status: existing.amountPaid >= existing.grandTotal && existing.grandTotal > 0 ? "paid" : "unpaid",
        finalizedAt: existing.finalizedAt ?? ts,
        updatedAt: ts,
      });
      result = next;
      return { ...s, bills: s.bills.map((b) => (b.id === id ? next : b)) };
    });
    return result;
  }, []);

  const cancelBill = useCallback((id: string) => {
    setState((s) => ({
      ...s,
      bills: s.bills.map((b) =>
        b.id === id ? { ...b, status: "cancelled", updatedAt: nowISO() } : b,
      ),
    }));
  }, []);

  const deleteBill = useCallback((id: string) => {
    setState((s) => ({
      ...s,
      bills: s.bills.filter((b) => b.id !== id),
      payments: s.payments.filter((p) => p.billId !== id),
    }));
  }, []);

  // ---- Payments ----
  const recordPayment = useCallback(
    (billId: string, input: RecordPaymentInput): Payment | undefined => {
      let payment: Payment | undefined;
      setState((s) => {
        const bill = s.bills.find((b) => b.id === billId);
        if (!bill) return s;
        const amount = round2(Math.max(0, Number(input.amount) || 0));
        if (amount <= 0) return s;
        const newPayment: Payment = {
          id: makeId("pay"),
          billId,
          invoiceNumber: bill.invoiceNumber,
          customerName: bill.customer.name || "Customer",
          amount,
          mode: input.mode ?? "cash",
          reference: input.reference ?? "",
          paidAt: input.paidAt ?? nowISO(),
          notes: input.notes ?? "",
        };
        payment = newPayment;
        const updatedBill = recalcBill({
          ...bill,
          amountPaid: round2(bill.amountPaid + amount),
          // a payment finalizes a draft into a real bill
          status: bill.status === "draft" ? "unpaid" : bill.status,
          finalizedAt: bill.finalizedAt ?? nowISO(),
          updatedAt: nowISO(),
        });
        return {
          ...s,
          bills: s.bills.map((b) => (b.id === billId ? updatedBill : b)),
          payments: [newPayment, ...s.payments],
        };
      });
      return payment;
    },
    [],
  );

  const deletePayment = useCallback((id: string) => {
    setState((s) => {
      const payment = s.payments.find((p) => p.id === id);
      if (!payment) return s;
      const bill = s.bills.find((b) => b.id === payment.billId);
      const bills = bill
        ? s.bills.map((b) =>
            b.id === bill.id
              ? recalcBill({
                  ...b,
                  amountPaid: round2(Math.max(0, b.amountPaid - payment.amount)),
                  updatedAt: nowISO(),
                })
              : b,
          )
        : s.bills;
      return { ...s, bills, payments: s.payments.filter((p) => p.id !== id) };
    });
  }, []);

  const customerBalance = useCallback(
    (customerId: string) =>
      round2(
        state.bills
          .filter((b) => b.customerId === customerId && b.status !== "cancelled" && b.status !== "draft")
          .reduce((sum, b) => sum + b.balanceDue, 0),
      ),
    [state.bills],
  );

  const resetDemoData = useCallback(() => {
    setState(buildSeedState());
  }, []);

  const stats = useMemo<Stats>(() => {
    const today = new Date().toISOString().slice(0, 10);
    const month = today.slice(0, 7);
    const counted = state.bills.filter((b) => b.status !== "cancelled" && b.status !== "draft");
    const todayBills = counted.filter((b) => (b.finalizedAt ?? b.createdAt).slice(0, 10) === today);
    const monthBills = counted.filter((b) => (b.finalizedAt ?? b.createdAt).slice(0, 7) === month);
    return {
      todaySales: round2(todayBills.reduce((sum, b) => sum + b.grandTotal, 0)),
      todayBillCount: todayBills.length,
      outstanding: round2(counted.reduce((sum, b) => sum + b.balanceDue, 0)),
      unpaidCount: counted.filter((b) => b.status === "unpaid" || b.status === "partial").length,
      totalCollected: round2(state.payments.reduce((sum, p) => sum + p.amount, 0)),
      monthSales: round2(monthBills.reduce((sum, b) => sum + b.grandTotal, 0)),
      billCount: counted.length,
    };
  }, [state.bills, state.payments]);

  const value: StoreValue = {
    state,
    hydrated,
    stats,
    updateSettings,
    addCustomer,
    updateCustomer,
    deleteCustomer,
    customerBalance,
    addProduct,
    updateProduct,
    deleteProduct,
    getBill,
    createDraftBill,
    saveBill,
    finalizeBill,
    cancelBill,
    deleteBill,
    previewInvoiceNumber,
    recordPayment,
    deletePayment,
    log,
    resetDemoData,
  };

  return <StoreContext.Provider value={value}>{children}</StoreContext.Provider>;
}

export function useBilling(): StoreValue {
  const ctx = useContext(StoreContext);
  if (!ctx) throw new Error("useBilling must be used within BillingProvider");
  return ctx;
}
