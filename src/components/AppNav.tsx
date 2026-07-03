"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useBilling } from "../lib/store";
import { useAuth } from "../lib/auth";
import { Icon, type IconName } from "./Icon";
import { DensityToggle } from "./Density";

const NAV: { href: string; label: string; icon: IconName; short: string }[] = [
  { href: "/", label: "Home", icon: "home", short: "Home" },
  { href: "/bills", label: "Bills", icon: "receipt", short: "Bills" },
  { href: "/customers", label: "Customers", icon: "users", short: "People" },
  { href: "/products", label: "Products", icon: "box", short: "Items" },
  { href: "/payments", label: "Payments", icon: "wallet", short: "Pay" },
  { href: "/settings", label: "Settings", icon: "settings", short: "Setup" },
];

const MOBILE = [NAV[0], NAV[1], NAV[2], NAV[3], NAV[5]];

function isActive(pathname: string, href: string): boolean {
  if (href === "/") return pathname === "/";
  return pathname === href || pathname.startsWith(`${href}/`);
}

function Brand() {
  const { state } = useBilling();
  const name = state.settings.businessName || "Simple Billing";
  const initial = name.trim().charAt(0).toUpperCase() || "S";
  return (
    <div className="logo" aria-hidden>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      {state.settings.logo ? <img src={state.settings.logo} alt="" /> : initial}
    </div>
  );
}

export function Sidebar() {
  const pathname = usePathname();
  const { state } = useBilling();
  const auth = useAuth();
  return (
    <nav className="sidebar" aria-label="Main navigation">
      <div className="sidebar-brand">
        <Brand />
        <strong>{state.settings.businessName || "Simple Billing"}</strong>
      </div>
      {NAV.map((item) => (
        <Link
          key={item.href}
          href={item.href}
          className={`nav-link ${isActive(pathname, item.href) ? "is-active" : ""}`}
        >
          <span className="ico">
            <Icon name={item.icon} size={21} />
          </span>
          {item.label}
        </Link>
      ))}
      <DensityToggle />
      <div className="sidebar-account">
        <span>Signed in as</span>
        <strong>{auth.ownerName || "Business owner"}</strong>
        <button type="button" className="btn btn-ghost btn-block" onClick={auth.logout}>
          Sign out
        </button>
      </div>
      <div className="sidebar-footer">Works offline in your browser</div>
    </nav>
  );
}

export function MobileBar() {
  const { state } = useBilling();
  const auth = useAuth();
  return (
    <div className="mobile-bar">
      <Brand />
      <strong>{state.settings.businessName || "Simple Billing"}</strong>
      <span className="spacer" />
      <DensityToggle />
      <button type="button" className="btn btn-ghost mobile-sign-out" onClick={auth.logout}>
        Sign out
      </button>
    </div>
  );
}

export function MobileNav() {
  const pathname = usePathname();
  return (
    <nav className="mobile-nav" aria-label="Main navigation">
      {MOBILE.map((item) => (
        <Link
          key={item.href}
          href={item.href}
          className={isActive(pathname, item.href) ? "is-active" : ""}
        >
          <span className="ico">
            <Icon name={item.icon} size={22} />
          </span>
          {item.short}
        </Link>
      ))}
    </nav>
  );
}
