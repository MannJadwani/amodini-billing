"use client";

import { use, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useBilling } from "../../../lib/store";
import { BillPreview } from "../../../components/BillPreview";
import {
  Button,
  Card,
  ConfirmDialog,
  EmptyState,
  Field,
  LinkButton,
  Modal,
  PageHeader,
  PaymentStatusBadge,
  Select,
  TextInput,
} from "../../../components/ui";
import { formatMoney, formatDate, todayISO } from "../../../lib/format";
import { PaymentMode, PAYMENT_MODE_LABELS } from "../../../lib/types";
import { useToast } from "../../../components/ToastProvider";

export default function BillDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const billing = useBilling();
  const router = useRouter();
  const toast = useToast();
  const bill = billing.getBill(id);

  const [payOpen, setPayOpen] = useState(false);
  const [confirm, setConfirm] = useState<null | "cancel" | "delete">(null);
  const [payAmount, setPayAmount] = useState("");
  const [payMode, setPayMode] = useState<PaymentMode>("cash");
  const [payRef, setPayRef] = useState("");
  const [payDate, setPayDate] = useState(todayISO());

  if (!bill) {
    return (
      <EmptyState
        emoji="🔍"
        title="Bill not found"
        message="This bill may have been deleted."
        action={
          <Link href="/bills" className="btn btn-primary">
            Back to bills
          </Link>
        }
      />
    );
  }

  const cur = billing.state.settings.currency;
  const billPayments = billing.state.payments.filter((p) => p.billId === bill.id);
  const isDraft = bill.status === "draft";
  const canPay = bill.balanceDue > 0 && bill.status !== "cancelled";

  const submitPayment = () => {
    const amount = Number(payAmount);
    if (!amount || amount <= 0) {
      toast.error("Enter a payment amount.");
      return;
    }
    billing.recordPayment(bill.id, { amount, mode: payMode, reference: payRef, paidAt: new Date(payDate).toISOString() });
    toast.success(`Recorded ${formatMoney(amount, cur)}.`);
    setPayOpen(false);
    setPayAmount("");
    setPayRef("");
  };

  return (
    <div>
      <PageHeader
        title={bill.invoiceNumber}
        subtitle={`${bill.customer.name || "Walk-in customer"} · ${formatDate(bill.finalizedAt ?? bill.createdAt)}`}
        actions={
          <div className="row">
            <PaymentStatusBadge status={bill.status} />
            <LinkButton href="/bills" variant="ghost">
              ← All bills
            </LinkButton>
          </div>
        }
      />

      {/* Action bar */}
      <Card className="no-print" style={{ marginBottom: 22 }}>
        <div className="row">
          {isDraft ? (
            <Button
              variant="success"
              size="lg"
              icon="✅"
              onClick={() => {
                billing.finalizeBill(bill.id);
                toast.success("Bill finalized.");
              }}
            >
              Finalize Bill
            </Button>
          ) : null}
          {canPay ? (
            <Button variant="primary" size="lg" icon="💰" onClick={() => setPayOpen(true)}>
              Record Payment
            </Button>
          ) : null}
          <LinkButton href={`/bills/${bill.id}/edit`} variant="secondary" icon="✏️">
            Edit
          </LinkButton>
          {bill.status !== "cancelled" ? (
            <Button variant="danger" icon="🚫" onClick={() => setConfirm("cancel")}>
              Cancel Bill
            </Button>
          ) : null}
          <Button variant="danger" icon="🗑️" onClick={() => setConfirm("delete")}>
            Delete
          </Button>
        </div>
      </Card>

      <div className="two-col">
        <BillPreview bill={bill} settings={billing.state.settings} />

        {/* Payment summary + history */}
        <div className="stack">
          <div className="totals-box">
            <div className="line">
              <span>Grand Total</span>
              <span>{formatMoney(bill.grandTotal, cur)}</span>
            </div>
            <div className="line paid">
              <span>Amount Paid</span>
              <span>{formatMoney(bill.amountPaid, cur)}</span>
            </div>
            <div className="line due">
              <span>Balance Due</span>
              <span>{formatMoney(bill.balanceDue, cur)}</span>
            </div>
            {canPay ? (
              <Button
                variant="primary"
                block
                icon="💰"
                style={{ marginTop: 14 }}
                onClick={() => setPayOpen(true)}
              >
                Record Payment
              </Button>
            ) : null}
          </div>

          <Card>
            <div className="card-title">Payment history</div>
            {billPayments.length === 0 ? (
              <p className="muted">No payments recorded yet.</p>
            ) : (
              <div className="row-list" style={{ marginTop: 8 }}>
                {billPayments.map((p) => (
                  <div key={p.id} className="spread">
                    <div>
                      <strong>{formatMoney(p.amount, cur)}</strong>
                      <div className="muted" style={{ fontSize: "0.9rem" }}>
                        {PAYMENT_MODE_LABELS[p.mode]} · {formatDate(p.paidAt)}
                        {p.reference ? ` · ${p.reference}` : ""}
                      </div>
                    </div>
                    <button
                      className="btn btn-ghost"
                      onClick={() => {
                        billing.deletePayment(p.id);
                        toast.success("Payment removed.");
                      }}
                    >
                      Remove
                    </button>
                  </div>
                ))}
              </div>
            )}
          </Card>
        </div>
      </div>

      {/* Record payment modal */}
      <Modal open={payOpen} onClose={() => setPayOpen(false)}>
        <h2>Record a payment</h2>
        <p>Balance due is {formatMoney(bill.balanceDue, cur)}.</p>
        <Field label="Amount received (₹)">
          <TextInput
            type="number"
            inputMode="decimal"
            autoFocus
            value={payAmount}
            placeholder={String(bill.balanceDue)}
            onChange={(e) => setPayAmount(e.target.value)}
          />
        </Field>
        <div className="form-grid">
          <Field label="Payment mode">
            <Select value={payMode} onChange={(e) => setPayMode(e.target.value as PaymentMode)}>
              {Object.entries(PAYMENT_MODE_LABELS).map(([k, v]) => (
                <option key={k} value={k}>
                  {v}
                </option>
              ))}
            </Select>
          </Field>
          <Field label="Date">
            <TextInput type="date" value={payDate} onChange={(e) => setPayDate(e.target.value)} />
          </Field>
        </div>
        <Field label="Reference (optional)" hint="UPI ID, cheque number, etc.">
          <TextInput value={payRef} onChange={(e) => setPayRef(e.target.value)} />
        </Field>
        <div className="form-actions">
          <Button variant="success" onClick={submitPayment}>
            Save payment
          </Button>
          <Button
            variant="secondary"
            onClick={() => {
              setPayAmount(String(bill.balanceDue));
            }}
          >
            Full amount
          </Button>
          <Button variant="ghost" onClick={() => setPayOpen(false)}>
            Cancel
          </Button>
        </div>
      </Modal>

      <ConfirmDialog
        open={confirm === "cancel"}
        title="Cancel this bill?"
        message="The bill will be marked as cancelled. You can still see it in the list."
        danger
        confirmLabel="Yes, cancel bill"
        onConfirm={() => {
          billing.cancelBill(bill.id);
          setConfirm(null);
          toast.success("Bill cancelled.");
        }}
        onCancel={() => setConfirm(null)}
      />
      <ConfirmDialog
        open={confirm === "delete"}
        title="Delete this bill?"
        message="This permanently removes the bill and its payments. This cannot be undone."
        danger
        confirmLabel="Yes, delete"
        onConfirm={() => {
          billing.deleteBill(bill.id);
          setConfirm(null);
          toast.success("Bill deleted.");
          router.push("/bills");
        }}
        onCancel={() => setConfirm(null)}
      />
    </div>
  );
}
