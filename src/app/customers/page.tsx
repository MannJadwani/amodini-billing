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
  SearchInput,
  TextInput,
} from "../../components/ui";
import { Icon } from "../../components/Icon";
import { formatMoney, formatDate } from "../../lib/format";
import { Customer } from "../../lib/types";
import { useToast } from "../../components/ToastProvider";

type Draft = Partial<Customer>;

export default function CustomersPage() {
  const billing = useBilling();
  const { state } = billing;
  const toast = useToast();
  const [query, setQuery] = useState("");
  const [editing, setEditing] = useState<Draft | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<Customer | null>(null);
  const cur = state.settings.currency;

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return state.customers;
    return state.customers.filter(
      (c) => c.name.toLowerCase().includes(q) || c.phone.toLowerCase().includes(q),
    );
  }, [state.customers, query]);

  const save = () => {
    if (!editing?.name?.trim()) {
      toast.error("Enter a name.");
      return;
    }
    if (editing.id) {
      billing.updateCustomer(editing.id, editing);
      toast.success("Customer updated.");
    } else {
      billing.addCustomer({
        name: editing.name,
        phone: editing.phone ?? "",
        email: editing.email ?? "",
        address: editing.address ?? "",
        gstin: editing.gstin ?? "",
      });
      toast.success("Customer added.");
    }
    setEditing(null);
  };

  return (
    <div>
      <PageHeader
        title="Customers"
        subtitle="The people you sell to."
        actions={
          <Button variant="primary" size="lg" icon={<Icon name="plus" />} onClick={() => setEditing({})}>
            Add Customer
          </Button>
        }
      />

      <div className="toolbar">
        <SearchInput
          className="search"
          placeholder="Search by name or phone…"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          aria-label="Search customers"
        />
      </div>

      {filtered.length === 0 ? (
        <EmptyState
          icon="users"
          title={state.customers.length === 0 ? "No customers yet" : "No matches"}
          message={
            state.customers.length === 0
              ? "Add your first customer to start making bills faster."
              : "Try a different search."
          }
          action={
            <Button variant="primary" icon={<Icon name="plus" />} onClick={() => setEditing({})}>
              Add Customer
            </Button>
          }
        />
      ) : (
        <div className="row-list">
          {filtered.map((c) => {
            const balance = billing.customerBalance(c.id);
            const billCount = state.bills.filter((b) => b.customerId === c.id).length;
            return (
              <Card key={c.id}>
                <div className="spread">
                  <div className="row-main">
                    <strong style={{ fontSize: "1.15rem" }}>{c.name}</strong>
                    <div className="muted">
                      {c.phone || "No phone"} {c.email ? `· ${c.email}` : ""}
                    </div>
                    {c.address ? <div className="muted" style={{ fontSize: "0.92rem" }}>{c.address}</div> : null}
                    <div className="muted" style={{ fontSize: "0.92rem" }}>
                      {billCount} bill(s) · Added {formatDate(c.createdAt)}
                    </div>
                  </div>
                  <div className="row-end">
                    {balance > 0 ? (
                      <span className="badge badge-danger">Owes {formatMoney(balance, cur)}</span>
                    ) : (
                      <span className="badge badge-success">No dues</span>
                    )}
                    <div className="row" style={{ gap: 6 }}>
                      <Button variant="ghost" onClick={() => setEditing(c)}>
                        Edit
                      </Button>
                      <Button variant="ghost" onClick={() => setConfirmDelete(c)}>
                        Delete
                      </Button>
                    </div>
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      )}

      <Modal open={editing !== null} onClose={() => setEditing(null)}>
        <h2>{editing?.id ? "Edit customer" : "Add customer"}</h2>
        <Field label="Name">
          <TextInput value={editing?.name ?? ""} autoFocus onChange={(e) => setEditing((d) => ({ ...d, name: e.target.value }))} />
        </Field>
        <div className="form-grid">
          <Field label="Phone" hint="Used for WhatsApp sharing.">
            <TextInput
              inputMode="tel"
              value={editing?.phone ?? ""}
              onChange={(e) => setEditing((d) => ({ ...d, phone: e.target.value }))}
            />
          </Field>
          <Field label="Email (optional)">
            <TextInput
              type="email"
              value={editing?.email ?? ""}
              onChange={(e) => setEditing((d) => ({ ...d, email: e.target.value }))}
            />
          </Field>
        </div>
        <Field label="Address (optional)">
          <TextInput value={editing?.address ?? ""} onChange={(e) => setEditing((d) => ({ ...d, address: e.target.value }))} />
        </Field>
        <Field label="GSTIN (optional)">
          <TextInput value={editing?.gstin ?? ""} onChange={(e) => setEditing((d) => ({ ...d, gstin: e.target.value }))} />
        </Field>
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
        message="Their bills will stay, but the saved customer details will be removed."
        danger
        confirmLabel="Yes, delete"
        onConfirm={() => {
          if (confirmDelete) {
            billing.deleteCustomer(confirmDelete.id);
            toast.success("Customer deleted.");
          }
          setConfirmDelete(null);
        }}
        onCancel={() => setConfirmDelete(null)}
      />
    </div>
  );
}
