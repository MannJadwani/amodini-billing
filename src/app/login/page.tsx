"use client";

import { FormEvent, useState } from "react";
import { useAuth } from "../../lib/auth";
import { Button, Card, Field, TextInput } from "../../components/ui";
import { Icon } from "../../components/Icon";

export default function LoginPage() {
  const auth = useAuth();
  const [ownerName, setOwnerName] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  const isSetup = auth.status === "setup-required";

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");

    if (password.length < 6) {
      setError("Use at least 6 characters for the password.");
      return;
    }

    if (isSetup && password !== confirmPassword) {
      setError("Both password fields must match.");
      return;
    }

    setBusy(true);
    try {
      if (isSetup) {
        await auth.setupAccount(ownerName, password);
        return;
      }

      const ok = await auth.login(password);
      if (!ok) setError("That password did not match. Please try again.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="auth-wrap">
      <Card className="auth-card">
        <div className="auth-mark" aria-hidden>
          <Icon name="receipt" size={34} />
        </div>
        <div className="stack" style={{ gap: 8, textAlign: "center" }}>
          <p className="eyebrow">Simple Billing</p>
          <h1>{isSetup ? "Create your login" : "Welcome back"}</h1>
          <p className="muted">
            {isSetup
              ? "Set a local password before using bills, customers, payments, and settings."
              : `Enter the password for ${auth.ownerName || "this billing app"}.`}
          </p>
        </div>

        <form className="auth-form" onSubmit={onSubmit}>
          {isSetup ? (
            <Field label="Your name">
              <TextInput
                autoComplete="name"
                autoFocus
                value={ownerName}
                onChange={(event) => setOwnerName(event.target.value)}
                placeholder="Business owner"
              />
            </Field>
          ) : null}

          <Field label="Password" hint="Stored only in this browser. Do not share this computer account.">
            <TextInput
              autoComplete={isSetup ? "new-password" : "current-password"}
              autoFocus={!isSetup}
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              placeholder="Enter password"
              required
            />
          </Field>

          {isSetup ? (
            <Field label="Confirm password">
              <TextInput
                autoComplete="new-password"
                type="password"
                value={confirmPassword}
                onChange={(event) => setConfirmPassword(event.target.value)}
                placeholder="Repeat password"
                required
              />
            </Field>
          ) : null}

          {error ? (
            <div className="auth-error" role="alert">
              {error}
            </div>
          ) : null}

          <Button type="submit" variant="primary" size="lg" block disabled={busy || auth.status === "checking"}>
            {busy ? "Please wait…" : isSetup ? "Create login" : "Sign in"}
          </Button>
        </form>

        <p className="auth-note">
          This protects the app on this browser only. For team logins or cloud sync, connect a backend auth
          provider later.
        </p>
      </Card>
    </div>
  );
}
