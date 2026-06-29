"use client";

import { useEffect, useState } from "react";
import { CopilotKit } from "@copilotkit/react-core";
import "@copilotkit/react-ui/styles.css";
import { useBilling } from "../lib/store";
import { AiAssistantPanel } from "./AiAssistantPanel";
import { CopilotBridge } from "./CopilotBridge";

// Owns everything AI-related. When a key is configured it mounts CopilotKit
// (so the chat works) plus the action bridge. When not, it mounts only the
// offline Smart Help panel — no CopilotKit, so no runtime requests/errors.
export function AiZone() {
  const { state } = useBilling();
  const [configured, setConfigured] = useState<boolean | null>(null);

  useEffect(() => {
    fetch("/api/ai/status")
      .then((r) => r.json())
      .then((d) => setConfigured(Boolean(d.configured)))
      .catch(() => setConfigured(false));
  }, []);

  // Owner hid the helper entirely.
  if (state.settings.aiEnabled === false) return null;

  if (configured) {
    return (
      <CopilotKit runtimeUrl="/api/copilotkit" showDevConsole={false}>
        <CopilotBridge />
        <AiAssistantPanel configured />
      </CopilotKit>
    );
  }

  // null (still checking) or false → offline-only panel.
  return <AiAssistantPanel configured={false} />;
}
