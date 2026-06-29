"use client";

import { useMemo, useRef, useState } from "react";
import { useBilling } from "../lib/store";
import { Customer } from "../lib/types";

export function CustomerPicker({
  value,
  onSelect,
  onCreate,
  onClear,
}: {
  value: string | null;
  onSelect: (customer: Customer) => void;
  onCreate: (name: string) => void;
  onClear: () => void;
}) {
  const { state } = useBilling();
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const blurTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const selected = state.customers.find((c) => c.id === value) ?? null;

  const matches = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return state.customers.slice(0, 8);
    return state.customers
      .filter(
        (c) =>
          c.name.toLowerCase().includes(q) ||
          c.phone.toLowerCase().includes(q) ||
          c.email.toLowerCase().includes(q),
      )
      .slice(0, 8);
  }, [query, state.customers]);

  const exactExists = state.customers.some(
    (c) => c.name.trim().toLowerCase() === query.trim().toLowerCase(),
  );

  if (selected) {
    return (
      <div className="row-card" style={{ marginBottom: 4 }}>
        <div className="row-main">
          <strong>{selected.name}</strong>
          <small>{selected.phone || "No phone"}</small>
        </div>
        <button
          type="button"
          className="btn btn-ghost"
          onClick={() => {
            setQuery("");
            onClear();
          }}
        >
          Change
        </button>
      </div>
    );
  }

  return (
    <div className="picker">
      <input
        className="input"
        placeholder="Type customer name or phone…"
        value={query}
        aria-label="Search customer"
        onFocus={() => setOpen(true)}
        onChange={(e) => {
          setQuery(e.target.value);
          setOpen(true);
        }}
        onBlur={() => {
          blurTimer.current = setTimeout(() => setOpen(false), 150);
        }}
      />
      {open ? (
        <div
          className="picker-menu"
          onMouseDown={() => {
            if (blurTimer.current) clearTimeout(blurTimer.current);
          }}
        >
          {matches.map((c) => (
            <div
              key={c.id}
              className="picker-option"
              onClick={() => {
                onSelect(c);
                setOpen(false);
                setQuery("");
              }}
            >
              <span>
                <strong>{c.name}</strong>
              </span>
              <small>{c.phone}</small>
            </div>
          ))}
          {query.trim() && !exactExists ? (
            <div
              className="picker-option picker-create"
              onClick={() => {
                onCreate(query.trim());
                setOpen(false);
                setQuery("");
              }}
            >
              ➕ Add new customer “{query.trim()}”
            </div>
          ) : null}
          {matches.length === 0 && !query.trim() ? (
            <div className="picker-option">
              <small>No customers yet. Start typing a name to add one.</small>
            </div>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
