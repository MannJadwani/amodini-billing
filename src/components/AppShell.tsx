"use client";

import type { ReactNode } from "react";
import { useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import { MobileBar, MobileNav, Sidebar } from "./AppNav";
import { AiZone } from "./AiZone";
import { useAuth } from "../lib/auth";

export function AppShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const auth = useAuth();
  const isLoginPage = pathname === "/login";
  const isSignedIn = auth.status === "signed-in";

  useEffect(() => {
    if (auth.status === "checking") return;
    if (!isSignedIn && !isLoginPage) {
      router.replace("/login");
    }
    if (isSignedIn && isLoginPage) {
      router.replace("/");
    }
  }, [auth.status, isLoginPage, isSignedIn, router]);

  if (isLoginPage) {
    return <main className="auth-page">{children}</main>;
  }

  if (!isSignedIn) {
    return (
      <main className="auth-page">
        <div className="auth-card" role="status" aria-live="polite">
          <div className="auth-mark">S</div>
          <h1>Opening Simple Billing…</h1>
          <p className="muted">Checking your local login session.</p>
        </div>
      </main>
    );
  }

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
