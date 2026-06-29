"use client";

import { useState } from "react";
import { CopilotChat } from "@copilotkit/react-ui";
import { useBilling } from "../lib/store";
import { businessSummary, GLOSSARY, reminderMessage, unpaidBills } from "../lib/insights";
import { whatsappLink, formatMoney } from "../lib/format";
import { Button } from "./ui";
import { Icon } from "./Icon";

type Tab = "help" | "chat";

export function AiAssistantPanel({ configured }: { configured: boolean }) {
  const [open, setOpen] = useState(false);
  const [tab, setTab] = useState<Tab>("help");

  return (
    <>
      {!open ? (
        <div className="assistant-fab no-print">
          <Button variant="primary" size="lg" icon={<Icon name="sparkles" />} onClick={() => setOpen(true)}>
            Smart Help
          </Button>
        </div>
      ) : null}

      {open ? (
        <aside className="assistant-panel no-print" aria-label="Smart help assistant">
          <div className="assistant-head">
            <strong style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <span style={{ color: "var(--accent)", display: "inline-flex" }}>
                <Icon name="sparkles" size={22} />
              </span>
              Smart Help
            </strong>
            <Button variant="ghost" onClick={() => setOpen(false)} aria-label="Close">
              <Icon name="x" size={18} /> Close
            </Button>
          </div>

          <div className="chip-row" style={{ padding: "12px 20px 0" }}>
            <button className={`chip ${tab === "help" ? "is-active" : ""}`} onClick={() => setTab("help")}>
              Helpful info
            </button>
            <button className={`chip ${tab === "chat" ? "is-active" : ""}`} onClick={() => setTab("chat")}>
              Ask the AI
            </button>
          </div>

          <div className="assistant-body">
            {tab === "help" ? <SmartHelp /> : <ChatTab configured={configured} />}
          </div>
        </aside>
      ) : null}
    </>
  );
}

function SmartHelp() {
  const { state } = useBilling();
  const unpaid = unpaidBills(state).slice(0, 5);

  return (
    <div className="stack">
      <div className="card card-pad">
        <div className="card-title">Today at a glance</div>
        <p className="muted" style={{ whiteSpace: "pre-line" }}>
          {businessSummary(state)}
        </p>
      </div>

      <div className="card card-pad">
        <div className="card-title">Payment reminders</div>
        {unpaid.length === 0 ? (
          <p className="muted">Great — no pending payments right now.</p>
        ) : (
          <div className="row-list">
            {unpaid.map((b) => (
              <div key={b.id} className="spread">
                <div>
                  <strong>{b.customer.name}</strong>
                  <div className="muted" style={{ fontSize: "0.9rem" }}>
                    {b.invoiceNumber} · due {formatMoney(b.balanceDue, state.settings.currency)}
                  </div>
                </div>
                <a
                  className="btn btn-success"
                  style={{ minHeight: 44, padding: "8px 14px" }}
                  href={whatsappLink(b.customer.phone, reminderMessage(b, state.settings))}
                  target="_blank"
                  rel="noreferrer"
                >
                  <Icon name="message" size={18} /> Remind
                </a>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="card card-pad">
        <div className="card-title">Simple answers</div>
        <div className="stack" style={{ gap: 8 }}>
          {GLOSSARY.map((g) => (
            <details key={g.term}>
              <summary style={{ cursor: "pointer", fontWeight: 700, padding: "6px 0" }}>{g.term}</summary>
              <p className="muted" style={{ paddingBottom: 8 }}>
                {g.meaning}
              </p>
            </details>
          ))}
        </div>
      </div>
    </div>
  );
}

function ChatTab({ configured }: { configured: boolean }) {
  if (!configured) {
    return (
      <div className="notice">
        <strong>AI helper not configured.</strong>
        <p style={{ marginTop: 8, fontWeight: 400 }}>
          The chat assistant is optional. Everything in this app works without it. To turn it on, add an{" "}
          <code>OPENROUTER_API_KEY</code> in a <code>.env.local</code> file and restart the app. Meanwhile, use the
          “Helpful info” tab for summaries and reminders.
        </p>
      </div>
    );
  }
  return (
    <div style={{ height: "100%" }}>
      <CopilotChat
        labels={{
          title: "Billing Assistant",
          initial:
            "Namaste! 🙏 Try: “Make a bill for Rajesh for 2 sarees at 1200 each and 1 blouse at 500”, or “How much is pending today?”",
        }}
      />
    </div>
  );
}
