"use client";

import type { ReactNode } from "react";
import { MobileBar, MobileNav, Sidebar } from "./AppNav";
import { AiZone } from "./AiZone";

export function AppShell({ children }: { children: ReactNode }) {
  return (
    <div className="app-layout">
      <Sidebar />
      <div style={{ flex: 1, minWidth: 0, display: "flex", flexDirection: "column" }}>
        <MobileBar />
        <main className="content">{children}</main>
      </div>
      <MobileNav />
      <AiZone />
    </div>
  );
}
