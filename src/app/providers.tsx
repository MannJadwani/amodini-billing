"use client";

import { CopilotKit } from "@copilotkit/react-core";
import type { ReactNode } from "react";
import "@copilotkit/react-ui/styles.css";

export function Providers({ children }: { children: ReactNode }) {
  return (
    <CopilotKit runtimeUrl="/api/copilotkit" showDevConsole={false}>
      {children}
    </CopilotKit>
  );
}
