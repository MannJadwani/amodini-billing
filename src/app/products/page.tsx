"use client";

import { useMemo, useState } from "react";
import { useBilling } from "../../lib/store";
import {
  Button,
  Card,
  ConfirmDialog,
  EmptyState,
  Field,
  Modal,
  PageHeader,
  Select,
  TextArea,
  TextInput,
} from "../../components/ui";
import { formatMoney } from "../../lib/format";
import { Product } from "../../lib/types";
import { useToast } from "../../components/ToastProvider";

type Draft = Partial<Product>;

const UNITS = ["pcs", "kg", "gram", "litre", "metre", "hour", "service", "box", "dozen"];

export default function ProductsPage() {
  const billing = useBilling();
  const { state } = billing;
  const toast = useToast();
  const [query, setQuery] = useState("");
  const [editing, setEditing] = useState<Draft | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<Product | null>(null);
  const cur = state.settings.currency;

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return state.products;
    return state.products.filter((p) => p.name.toLowerCase().includes(q));
  }, [state.products, query]);

  const save = () => {
    if (!editing?.name?.trim()) {
      toast.error("Enter a product name.");
      return;
    }
    if (editing.id) {
      billing.updateProduct(editing.id, editing);
      toast.success("Product updated.");
    } else {
      billing.addProduct({
        name: editing.name,
        description: editing.description ?? "",
        defaultRate: Number(editing.defaultRate) || 0,
        defaultTaxRate: editing.defaultTaxRate === undefined ? state.settings.defaultTaxRate : Number(editing.defaultTaxRate),
        unit: editing.unit ?? "pcs",
        active: editing.active ?? true,
      });
      toast.success("Product added.");
    }
    setEditing(null);
  };

  return (
    <div>
      <PageHeader
        title="Products & Services"
        subtitle="Save items so you can add them to bills quickly."
        actions={
          <Button variant="primary" size="lg" icon="➕" onClick={() => setEditing({ active: true, defaultTaxRate: state.settings.defaultTaxRate })}>
            Add Product
          </Button>
        }
      />

      <div className="toolbar">
        <input
          className="input search"
          placeholder="🔍 Search products…"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          aria-label="Search products"
        />
      </div>

      {filtered.length === 0 ? (
        <EmptyState
          emoji="📦"
          title={state.products.length === 0 ? "No products yet" : "No matches"}
          message={
            state.products.length === 0
              ? "Add the items or services you sell. You can still type any item directly on a bill."
              : "Try a different search."
          }
          action={
            <Button variant="primary" icon="➕" onClick={() => setEditing({ active: true, defaultTaxRate: state.settings.defaultTaxRate })}>
              Add Product
            </Button>
          }
        />
      ) : (
        <div className="row-list">
          {filtered.map((p) => (
            <Card key={p.id}>
              <div className="spread">
                <div className="row-main">
                  <strong style={{ fontSize: "1.15rem" }}>
                    {p.name} {!p.active ? <span className="badge badge-neutral">Hidden</span> : null}
                  </strong>
                  {p.description ? <div className="muted">{p.description}</div> : null}
                  <div className="muted" style={{ fontSize: "0.92rem" }}>
                    {formatMoney(p.defaultRate, cur)} per {p.unit} · GST {p.defaultTaxRate}%
                  </div>
                </div>
                <div className="row" style={{ gap: 6 }}>
                  <Button variant="ghost" onClick={() => setEditing(p)}>
                    Edit
                  </Button>
                  <Button variant="ghost" onClick={() => setConfirmDelete(p)}>
                    Delete
                  </Button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      <Modal open={editing !== null} onClose={() => setEditing(null)}>
        <h2>{editing?.id ? "Edit product" : "Add product"}</h2>
        <Field label="Name">
          <TextInput value={editing?.name ?? ""} autoFocus onChange={(e) => setEditing((d) => ({ ...d, name: e.target.value }))} />
        </Field>
        <Field label="Description (optional)">
          <TextArea value={editing?.description ?? ""} onChange={(e) => setEditing((d) => ({ ...d, description: e.target.value }))} />
        </Field>
        <div className="form-grid">
          <Field label="Price (₹)">
            <TextInput
              type="number"
              inputMode="decimal"
              value={editing?.defaultRate ?? 0}
              onChange={(e) => setEditing((d) => ({ ...d, defaultRate: Number(e.target.value) }))}
            />
          </Field>
          <Field label="GST %">
            <TextInput
              type="number"
              inputMode="decimal"
              value={editing?.defaultTaxRate ?? 0}
              onChange={(e) => setEditing((d) => ({ ...d, defaultTaxRate: Number(e.target.value) }))}
            />
          </Field>
          <Field label="Unit">
            <Select value={editing?.unit ?? "pcs"} onChange={(e) => setEditing((d) => ({ ...d, unit: e.target.value }))}>
              {UNITS.map((u) => (
                <option key={u} value={u}>
                  {u}
                </option>
              ))}
            </Select>
          </Field>
          <Field label="Show on bills?">
            <Select
              value={editing?.active === false ? "no" : "yes"}
              onChange={(e) => setEditing((d) => ({ ...d, active: e.target.value === "yes" }))}
            >
              <option value="yes">Yes</option>
              <option value="no">No (hidden)</option>
            </Select>
          </Field>
        </div>
        <div className="form-actions">
          <Button variant="primary" onClick={save}>
            Save
          </Button>
          <Button variant="secondary" onClick={() => setEditing(null)}>
            Cancel
          </Button>
        </div>
      </Modal>

      <ConfirmDialog
        open={confirmDelete !== null}
        title={`Delete ${confirmDelete?.name}?`}
        message="This removes the saved product. Existing bills are not affected."
        danger
        confirmLabel="Yes, delete"
        onConfirm={() => {
          if (confirmDelete) {
            billing.deleteProduct(confirmDelete.id);
            toast.success("Product deleted.");
          }
          setConfirmDelete(null);
        }}
        onCancel={() => setConfirmDelete(null)}
      />
    </div>
  );
}
