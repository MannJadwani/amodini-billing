"use client";

import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from "react";
import { Icon } from "./Icon";

export type Density = "comfortable" | "compact";
const KEY = "simple-billing-density";

type Ctx = { density: Density; setDensity: (d: Density) => void };
const DensityContext = createContext<Ctx | null>(null);

export function DensityProvider({ children }: { children: ReactNode }) {
  const [density, setDensityState] = useState<Density>("comfortable");

  useEffect(() => {
    const saved = (typeof window !== "undefined" && (localStorage.getItem(KEY) as Density)) || "comfortable";
    // Intentional one-time hydration from localStorage after mount.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setDensityState(saved === "compact" ? "compact" : "comfortable");
    document.documentElement.dataset.density = saved === "compact" ? "compact" : "comfortable";
  }, []);

  const setDensity = useCallback((d: Density) => {
    setDensityState(d);
    document.documentElement.dataset.density = d;
    try {
      localStorage.setItem(KEY, d);
    } catch {
      /* storage unavailable */
    }
  }, []);

  return <DensityContext.Provider value={{ density, setDensity }}>{children}</DensityContext.Provider>;
}

export function useDensity(): Ctx {
  const ctx = useContext(DensityContext);
  if (!ctx) throw new Error("useDensity must be used within DensityProvider");
  return ctx;
}

// Segmented Easy / Efficient control. "Easy" = comfortable (big & spacious,
// great for older users). "Efficient" = compact (denser, more on screen).
export function DensityToggle() {
  const { density, setDensity } = useDensity();
  return (
    <div className="density-toggle" role="group" aria-label="Display mode">
      <button
        type="button"
        className={density === "comfortable" ? "is-active" : ""}
        aria-pressed={density === "comfortable"}
        onClick={() => setDensity("comfortable")}
      >
        <Icon name="home" size={15} /> Easy
      </button>
      <button
        type="button"
        className={density === "compact" ? "is-active" : ""}
        aria-pressed={density === "compact"}
        onClick={() => setDensity("compact")}
      >
        <Icon name="sliders" size={15} /> Efficient
      </button>
    </div>
  );
}
