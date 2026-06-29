"use client";

import type { ReactNode } from "react";
import { BillingProvider } from "../lib/store";
import { ToastProvider } from "../components/ToastProvider";

// CopilotKit is intentionally NOT mounted here. It is scoped to the AI zone
// (see AiZone) and only mounts when an AI key is configured, so the app makes
// zero AI network requests — and logs no console errors — without a key.
export function Providers({ children }: { children: ReactNode }) {
  return (
    <BillingProvider>
      <ToastProvider>{children}</ToastProvider>
    </BillingProvider>
  );
}
