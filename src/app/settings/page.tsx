"use client";

import { useEffect, useRef, useState } from "react";
import { useBilling } from "../../lib/store";
import {
  Button,
  Card,
  ConfirmDialog,
  Field,
  PageHeader,
  Select,
  TextArea,
  TextInput,
} from "../../components/ui";
import { Icon } from "../../components/Icon";
import { DensityToggle } from "../../components/Density";
import { useToast } from "../../components/ToastProvider";

const CURRENCIES = [
  { code: "INR", label: "₹ Indian Rupee (INR)" },
  { code: "USD", label: "$ US Dollar (USD)" },
  { code: "AED", label: "د.إ UAE Dirham (AED)" },
  { code: "GBP", label: "£ British Pound (GBP)" },
];

export default function SettingsPage() {
  const billing = useBilling();
  const toast = useToast();
  const [form, setForm] = useState(billing.state.settings);
  const [aiConfigured, setAiConfigured] = useState<boolean | null>(null);
  const [confirmReset, setConfirmReset] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  // Keep local form in sync when the stored settings change (hydration, reset).
  // Settings identity only changes on save/reset, so in-progress edits are safe.
  useEffect(() => {
    // Sync the editable form when stored settings change (hydration / reset).
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setForm(billing.state.settings);
  }, [billing.state.settings]);

  useEffect(() => {
    fetch("/api/ai/status")
      .then((r) => r.json())
      .then((d) => setAiConfigured(Boolean(d.configured)))
      .catch(() => setAiConfigured(false));
  }, []);

  const set = <K extends keyof typeof form>(key: K, value: (typeof form)[K]) =>
    setForm((f) => ({ ...f, [key]: value }));

  const handleLogo = (file: File | undefined) => {
    if (!file) return;
    if (file.size > 600 * 1024) {
      toast.error("Please choose a logo under 600 KB.");
      return;
    }
    const reader = new FileReader();
    reader.onload = () => set("logo", String(reader.result));
    reader.readAsDataURL(file);
  };

  const save = () => {
    billing.updateSettings({
      ...form,
      nextInvoiceNumber: Math.max(1, Number(form.nextInvoiceNumber) || 1),
      defaultTaxRate: Math.max(0, Number(form.defaultTaxRate) || 0),
    });
    toast.success("Settings saved.");
  };

  return (
    <div>
      <PageHeader
        title="Settings"
        subtitle="Set up your business once. It appears on every bill and PDF."
        actions={
          <Button variant="primary" size="lg" icon={<Icon name="save" />} onClick={save}>
            Save Settings
          </Button>
        }
      />

      <div className="stack">
        {/* Display mode */}
        <Card>
          <div className="spread">
            <div>
              <div className="card-title">Display mode</div>
              <p className="card-hint">
                <strong>Easy</strong> = bigger text & buttons (best for comfort).{" "}
                <strong>Efficient</strong> = smaller & denser (more on screen).
              </p>
            </div>
            <DensityToggle />
          </div>
        </Card>

        {/* Business profile */}
        <Card>
          <div className="card-title">Business profile</div>
          <p className="card-hint" style={{ marginBottom: 16 }}>
            This is how you rebrand the app — change the name and logo here.
          </p>
          <div className="row" style={{ marginBottom: 16, gap: 18 }}>
            <div
              className="logo"
              style={{
                width: 72,
                height: 72,
                borderRadius: 14,
                background: "var(--primary)",
                color: "#fdf7ea",
                display: "grid",
                placeItems: "center",
                fontFamily: "var(--font-display-stack)",
                fontWeight: 600,
                fontSize: "1.9rem",
                overflow: "hidden",
              }}
            >
              {form.logo ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={form.logo} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
              ) : (
                (form.businessName || "S").charAt(0).toUpperCase()
              )}
            </div>
            <div className="row" style={{ gap: 8 }}>
              <input
                ref={fileRef}
                type="file"
                accept="image/*"
                style={{ display: "none" }}
                onChange={(e) => handleLogo(e.target.files?.[0])}
              />
              <Button variant="secondary" onClick={() => fileRef.current?.click()}>
                Upload logo
              </Button>
              {form.logo ? (
                <Button variant="ghost" onClick={() => set("logo", "")}>
                  Remove
                </Button>
              ) : null}
            </div>
          </div>
          <Field label="Business name">
            <TextInput value={form.businessName} onChange={(e) => set("businessName", e.target.value)} />
          </Field>
          <div className="form-grid">
            <Field label="Phone">
              <TextInput inputMode="tel" value={form.phone} onChange={(e) => set("phone", e.target.value)} />
            </Field>
            <Field label="Email">
              <TextInput type="email" value={form.email} onChange={(e) => set("email", e.target.value)} />
            </Field>
          </div>
          <Field label="Address">
            <TextArea value={form.address} onChange={(e) => set("address", e.target.value)} />
          </Field>
          <Field label="GSTIN (optional)">
            <TextInput value={form.gstin} onChange={(e) => set("gstin", e.target.value)} />
          </Field>
        </Card>

        {/* Tax + numbering */}
        <Card>
          <div className="card-title">Bills, tax & numbering</div>
          <div className="form-grid" style={{ marginTop: 12 }}>
            <Field label="Currency">
              <Select value={form.currency} onChange={(e) => set("currency", e.target.value)}>
                {CURRENCIES.map((c) => (
                  <option key={c.code} value={c.code}>
                    {c.label}
                  </option>
                ))}
              </Select>
            </Field>
            <Field label="Default GST / tax %">
              <TextInput
                type="number"
                inputMode="decimal"
                value={form.defaultTaxRate}
                onChange={(e) => set("defaultTaxRate", Number(e.target.value))}
              />
            </Field>
            <Field label="Bill number prefix" hint="e.g. INV-">
              <TextInput value={form.invoicePrefix} onChange={(e) => set("invoicePrefix", e.target.value)} />
            </Field>
            <Field label="Next bill number">
              <TextInput
                type="number"
                value={form.nextInvoiceNumber}
                onChange={(e) => set("nextInvoiceNumber", Number(e.target.value))}
              />
            </Field>
          </div>
          <p className="muted">
            Next bill will be: <strong>{form.invoicePrefix}{form.nextInvoiceNumber}</strong>
          </p>
        </Card>

        {/* Default notes/terms */}
        <Card>
          <div className="card-title">Default notes & terms</div>
          <p className="card-hint" style={{ marginBottom: 12 }}>
            These fill in automatically on every new bill (you can still change them per bill).
          </p>
          <div className="form-grid">
            <Field label="Default note">
              <TextArea value={form.defaultNotes} onChange={(e) => set("defaultNotes", e.target.value)} />
            </Field>
            <Field label="Default terms">
              <TextArea value={form.defaultTerms} onChange={(e) => set("defaultTerms", e.target.value)} />
            </Field>
          </div>
        </Card>

        {/* AI helper */}
        <Card>
          <div className="card-title">AI helper (optional)</div>
          <p className="card-hint" style={{ marginBottom: 12 }}>
            The Smart Help summaries and reminders always work. The AI chat is optional.
          </p>
          <div className="notice" style={{ background: aiConfigured ? "var(--success-soft)" : undefined, color: aiConfigured ? "var(--success)" : undefined, borderColor: aiConfigured ? "#a7e0bd" : undefined }}>
            {aiConfigured === null
              ? "Checking…"
              : aiConfigured
                ? "AI chat is configured and ready."
                : "AI chat is not configured. Add OPENROUTER_API_KEY in .env.local to enable it. The app works fully without it."}
          </div>
          <Field label="Show the Smart Help button" htmlFor="ai-toggle">
            <Select
              id="ai-toggle"
              value={form.aiEnabled ? "yes" : "no"}
              onChange={(e) => set("aiEnabled", e.target.value === "yes")}
            >
              <option value="yes">Yes, show it</option>
              <option value="no">No, hide it</option>
            </Select>
          </Field>
        </Card>

        {/* Danger zone */}
        <Card>
          <div className="card-title">Demo data</div>
          <p className="card-hint" style={{ marginBottom: 12 }}>
            Reset everything back to the sample customers, products and bills. Your changes will be lost.
          </p>
          <Button variant="danger" icon={<Icon name="rotate" />} onClick={() => setConfirmReset(true)}>
            Reset to demo data
          </Button>
        </Card>

        <div className="form-actions">
          <Button variant="primary" size="lg" icon={<Icon name="save" />} onClick={save}>
            Save Settings
          </Button>
        </div>
      </div>

      <ConfirmDialog
        open={confirmReset}
        title="Reset all data?"
        message="This replaces your customers, products, bills and payments with the demo sample. This cannot be undone."
        danger
        confirmLabel="Yes, reset"
        onConfirm={() => {
          billing.resetDemoData();
          setConfirmReset(false);
          toast.success("Demo data restored.");
        }}
        onCancel={() => setConfirmReset(false)}
      />
    </div>
  );
}
