"use client";

import { useMemo, useRef, useState } from "react";
import { useBilling } from "../lib/store";
import { Product } from "../lib/types";
import { formatMoney } from "../lib/format";

// A search box that suggests products. Selecting one calls onPick with the
// product so the parent can fill an item row. Free text is always allowed.
export function ProductPicker({ onPick }: { onPick: (product: Product) => void }) {
  const { state } = useBilling();
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const blurTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const matches = useMemo(() => {
    const q = query.trim().toLowerCase();
    const active = state.products.filter((p) => p.active);
    if (!q) return active.slice(0, 8);
    return active.filter((p) => p.name.toLowerCase().includes(q)).slice(0, 8);
  }, [query, state.products]);

  return (
    <div className="picker">
      <input
        className="input"
        placeholder="Search saved products to add…"
        value={query}
        aria-label="Search products"
        onFocus={() => setOpen(true)}
        onChange={(e) => {
          setQuery(e.target.value);
          setOpen(true);
        }}
        onBlur={() => {
          blurTimer.current = setTimeout(() => setOpen(false), 150);
        }}
      />
      {open && matches.length > 0 ? (
        <div
          className="picker-menu"
          onMouseDown={() => {
            if (blurTimer.current) clearTimeout(blurTimer.current);
          }}
        >
          {matches.map((p) => (
            <div
              key={p.id}
              className="picker-option"
              onClick={() => {
                onPick(p);
                setOpen(false);
                setQuery("");
              }}
            >
              <span>
                <strong>{p.name}</strong>
              </span>
              <small>
                {formatMoney(p.defaultRate, state.settings.currency)} · {p.unit}
              </small>
            </div>
          ))}
        </div>
      ) : null}
    </div>
  );
}
