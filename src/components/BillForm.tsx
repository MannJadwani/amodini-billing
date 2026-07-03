"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useBilling, DraftBillItem } from "../lib/store";
import { Bill, Customer, CustomerSnapshot } from "../lib/types";
import { computeItem, computeTotals } from "../lib/calc";
import { detectBillIssues } from "../lib/insights";
import { formatMoney } from "../lib/format";
import { Button, Card, Field, TextInput, TextArea, Modal } from "./ui";
import { Icon } from "./Icon";
import { CustomerPicker } from "./CustomerPicker";
import { ProductPicker } from "./ProductPicker";
import { useToast } from "./ToastProvider";

type Row = {
  id: string;
  productId: string | null;
  name: string;
  quantity: number;
  rate: number;
  discount: number;
  taxRate: number;
};

let rowSeq = 0;
function newRow(defaultTax: number): Row {
  rowSeq += 1;
  return {
    id: `row-${Date.now()}-${rowSeq}`,
    productId: null,
    name: "",
    quantity: 1,
    rate: 0,
    discount: 0,
    taxRate: defaultTax,
  };
}

export function BillForm({ existing }: { existing?: Bill }) {
  const billing = useBilling();
  const router = useRouter();
  const toast = useToast();
  const { state } = billing;
  const defaultTax = state.settings.defaultTaxRate;

  const [customerId, setCustomerId] = useState<string | null>(existing?.customerId ?? null);
  const [snapshot, setSnapshot] = useState<CustomerSnapshot>(
    existing?.customer ?? { name: "", phone: "", email: "", address: "", gstin: "" },
  );
  const [rows, setRows] = useState<Row[]>(
    existing && existing.items.length
      ? existing.items.map((i) => ({
          id: i.id,
          productId: i.productId,
          name: i.name,
          quantity: i.quantity,
          rate: i.rate,
          discount: i.discount,
          taxRate: i.taxRate,
        }))
      : [newRow(defaultTax)],
  );
  const [notes, setNotes] = useState(existing?.notes ?? state.settings.defaultNotes);
  const [terms, setTerms] = useState(existing?.terms ?? state.settings.defaultTerms);
  const [newCustomerOpen, setNewCustomerOpen] = useState(false);
  const [newCustomerDraft, setNewCustomerDraft] = useState<Partial<Customer>>({});

  const computedItems = useMemo(
    () => rows.map((r) => computeItem({ ...r })),
    [rows],
  );
  const totals = useMemo(() => computeTotals(computedItems), [computedItems]);

  const issues = useMemo(
    () =>
      detectBillIssues(
        {
          customer: { name: snapshot.name, phone: snapshot.phone },
          items: rows.map((r) => ({ name: r.name, quantity: r.quantity, rate: r.rate })),
          grandTotal: totals.grandTotal,
          amountPaid: existing?.amountPaid ?? 0,
        },
        state.bills.filter((b) => b.id !== existing?.id),
      ),
    [snapshot, rows, totals, existing, state.bills],
  );

  const updateRow = (id: string, patch: Partial<Row>) =>
    setRows((rs) => rs.map((r) => (r.id === id ? { ...r, ...patch } : r)));

  const buildInput = () => ({
    customerId,
    customer: snapshot,
    items: rows
      .filter((r) => r.name.trim() || r.rate > 0)
      .map<DraftBillItem>((r) => ({
        id: r.id,
        productId: r.productId,
        name: r.name.trim(),
        quantity: r.quantity,
        rate: r.rate,
        discount: r.discount,
        taxRate: r.taxRate,
      })),
    notes,
    terms,
  });

  const persist = (): Bill | undefined => {
    if (!snapshot.name.trim()) {
      toast.error("Please choose a customer first.");
      return undefined;
    }
    const input = buildInput();
    if (input.items.length === 0) {
      toast.error("Add at least one item.");
      return undefined;
    }
    if (existing) {
      return billing.saveBill(existing.id, input);
    }
    return billing.createDraftBill(input);
  };

  const handleSaveDraft = () => {
    const bill = persist();
    if (bill) {
      toast.success(`Saved draft ${bill.invoiceNumber}.`);
      router.push(`/bills/${bill.id}`);
    }
  };

  const handleFinalize = () => {
    const bill = persist();
    if (!bill) return;
    const final = billing.finalizeBill(bill.id);
    toast.success(`Bill ${bill.invoiceNumber} finalized.`);
    router.push(`/bills/${(final ?? bill).id}`);
  };

  const previewNumber = existing?.invoiceNumber ?? billing.previewInvoiceNumber();

  return (
    <div className="two-col">
      <div className="stack">
        {/* Customer */}
        <Card>
          <div className="card-title">1. Who is this bill for?</div>
          <p className="card-hint" style={{ marginBottom: 14 }}>
            Search an existing customer or add a new one.
          </p>
          <CustomerPicker
            value={customerId}
            onSelect={(c) => {
              setCustomerId(c.id);
              setSnapshot({ name: c.name, phone: c.phone, email: c.email, address: c.address, gstin: c.gstin });
            }}
            onClear={() => {
              setCustomerId(null);
              setSnapshot({ name: "", phone: "", email: "", address: "", gstin: "" });
            }}
            onCreate={(name) => {
              setNewCustomerDraft({ name });
              setNewCustomerOpen(true);
            }}
          />
        </Card>

        {/* Items */}
        <Card>
          <div className="spread" style={{ marginBottom: 12 }}>
            <div className="card-title" style={{ margin: 0 }}>
              2. What are you billing?
            </div>
          </div>
          <div style={{ marginBottom: 14 }}>
            <ProductPicker
              onPick={(p) =>
                setRows((rs) => {
                  const empty = rs.find((r) => !r.name.trim() && r.rate === 0);
                  const filled: Row = {
                    ...(empty ?? newRow(defaultTax)),
                    productId: p.id,
                    name: p.name,
                    rate: p.defaultRate,
                    taxRate: p.defaultTaxRate,
                  };
                  return empty ? rs.map((r) => (r.id === empty.id ? filled : r)) : [...rs, filled];
                })
              }
            />
          </div>

          {rows.map((row, idx) => {
            const computed = computeItem({ ...row });
            return (
              <div className="item-row" key={row.id}>
                <div className="field">
                  <span className="lbl">Item name</span>
                  <input
                    className="input"
                    placeholder={`Item ${idx + 1}`}
                    value={row.name}
                    onChange={(e) => updateRow(row.id, { name: e.target.value })}
                  />
                </div>
                <div className="field">
                  <span className="lbl">Qty</span>
                  <input
                    className="input"
                    type="number"
                    min={0}
                    inputMode="decimal"
                    value={row.quantity}
                    onChange={(e) => updateRow(row.id, { quantity: Number(e.target.value) })}
                  />
                </div>
                <div className="field">
                  <span className="lbl">Rate (₹)</span>
                  <input
                    className="input"
                    type="number"
                    min={0}
                    inputMode="decimal"
                    value={row.rate}
                    onChange={(e) => updateRow(row.id, { rate: Number(e.target.value) })}
                  />
                </div>
                <div className="field">
                  <span className="lbl">Discount (₹)</span>
                  <input
                    className="input"
                    type="number"
                    min={0}
                    inputMode="decimal"
                    value={row.discount}
                    onChange={(e) => updateRow(row.id, { discount: Number(e.target.value) })}
                  />
                </div>
                <div className="field">
                  <span className="lbl">GST %</span>
                  <input
                    className="input"
                    type="number"
                    min={0}
                    inputMode="decimal"
                    value={row.taxRate}
                    onChange={(e) => updateRow(row.id, { taxRate: Number(e.target.value) })}
                  />
                </div>
                <button
                  type="button"
                  className="remove"
                  aria-label="Remove item"
                  title="Remove item"
                  onClick={() =>
                    setRows((rs) => (rs.length > 1 ? rs.filter((r) => r.id !== row.id) : rs))
                  }
                >
                  <Icon name="trash" size={20} />
                </button>
                <div style={{ gridColumn: "1 / -1", textAlign: "right" }} className="muted">
                  Line total: <strong>{formatMoney(computed.lineTotal, state.settings.currency)}</strong>
                </div>
              </div>
            );
          })}

          <Button variant="secondary" icon={<Icon name="plus" />} onClick={() => setRows((rs) => [...rs, newRow(defaultTax)])}>
            Add another item
          </Button>
        </Card>

        {/* Notes & terms */}
        <Card>
          <div className="card-title">3. Notes & terms (optional)</div>
          <div className="form-grid" style={{ marginTop: 10 }}>
            <Field label="Notes for customer">
              <TextArea value={notes} onChange={(e) => setNotes(e.target.value)} />
            </Field>
            <Field label="Terms & conditions">
              <TextArea value={terms} onChange={(e) => setTerms(e.target.value)} />
            </Field>
          </div>
        </Card>
      </div>

      {/* Sidebar: totals + actions */}
      <div className="stack">
        <div className="totals-box">
          <div className="muted" style={{ marginBottom: 8 }}>
            Bill no. <strong>{previewNumber}</strong>
          </div>
          <div className="line">
            <span>Subtotal</span>
            <span>{formatMoney(totals.subtotal, state.settings.currency)}</span>
          </div>
          <div className="line">
            <span>Discount</span>
            <span>– {formatMoney(totals.discountTotal, state.settings.currency)}</span>
          </div>
          <div className="line">
            <span>GST / Tax</span>
            <span>{formatMoney(totals.taxTotal, state.settings.currency)}</span>
          </div>
          <div className="line grand">
            <span>Grand Total</span>
            <span>{formatMoney(totals.grandTotal, state.settings.currency)}</span>
          </div>

          <div className="stack" style={{ marginTop: 18, gap: 12 }}>
            <Button variant="success" size="lg" block icon={<Icon name="check" />} onClick={handleFinalize}>
              Finalize Bill
            </Button>
            <Button variant="secondary" block icon={<Icon name="save" />} onClick={handleSaveDraft}>
              Save as Draft
            </Button>
          </div>
        </div>

        {issues.length > 0 ? (
          <Card>
            <div className="card-title" style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <span style={{ color: "var(--warning)", display: "inline-flex" }}>
                <Icon name="alert" size={20} />
              </span>
              Please check
            </div>
            <ul style={{ margin: "8px 0 0", paddingLeft: 20 }}>
              {issues.map((iss, i) => (
                <li key={i} className="muted" style={{ marginBottom: 6 }}>
                  {iss.message}
                </li>
              ))}
            </ul>
          </Card>
        ) : (
          <Card>
            <div className="muted" style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <span style={{ color: "var(--success)", display: "inline-flex" }}>
                <Icon name="check-circle" size={20} />
              </span>
              This bill looks good. You can finalize it.
            </div>
          </Card>
        )}
      </div>

      {/* New customer modal */}
      <Modal open={newCustomerOpen} onClose={() => setNewCustomerOpen(false)}>
        <h2>Add new customer</h2>
        <Field label="Name">
          <TextInput
            value={newCustomerDraft.name ?? ""}
            onChange={(e) => setNewCustomerDraft((d) => ({ ...d, name: e.target.value }))}
          />
        </Field>
        <Field label="Phone number" hint="Needed to share the bill on WhatsApp.">
          <TextInput
            value={newCustomerDraft.phone ?? ""}
            inputMode="tel"
            onChange={(e) => setNewCustomerDraft((d) => ({ ...d, phone: e.target.value }))}
          />
        </Field>
        <Field label="Address (optional)">
          <TextInput
            value={newCustomerDraft.address ?? ""}
            onChange={(e) => setNewCustomerDraft((d) => ({ ...d, address: e.target.value }))}
          />
        </Field>
        <div className="form-actions">
          <Button
            variant="primary"
            onClick={() => {
              if (!newCustomerDraft.name?.trim()) {
                toast.error("Enter a name.");
                return;
              }
              const c = billing.addCustomer({
                name: newCustomerDraft.name,
                phone: newCustomerDraft.phone ?? "",
                address: newCustomerDraft.address ?? "",
              });
              setCustomerId(c.id);
              setSnapshot({ name: c.name, phone: c.phone, email: c.email, address: c.address, gstin: c.gstin });
              setNewCustomerOpen(false);
              setNewCustomerDraft({});
              toast.success(`Added ${c.name}.`);
            }}
          >
            Save customer
          </Button>
          <Button variant="secondary" onClick={() => setNewCustomerOpen(false)}>
            Cancel
          </Button>
        </div>
      </Modal>
    </div>
  );
}
