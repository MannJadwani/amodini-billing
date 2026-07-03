import type { SVGProps } from "react";

// Lightweight inline stroke-icon set (24px grid, currentColor). Replaces emoji
// throughout the UI for a crafted, consistent look. Outline style, round caps.

export type IconName =
  | "home"
  | "receipt"
  | "users"
  | "box"
  | "wallet"
  | "settings"
  | "plus"
  | "download"
  | "printer"
  | "message"
  | "pencil"
  | "ban"
  | "trash"
  | "check"
  | "check-circle"
  | "rotate"
  | "search"
  | "x"
  | "sparkles"
  | "alert"
  | "info"
  | "arrow-right"
  | "arrow-left"
  | "save"
  | "phone"
  | "mail"
  | "chevron-right"
  | "sliders"
  | "image";

const PATHS: Record<IconName, React.ReactNode> = {
  home: <path d="M3 10.5 12 3l9 7.5M5 9.5V20a1 1 0 0 0 1 1h4v-6h4v6h4a1 1 0 0 0 1-1V9.5" />,
  receipt: (
    <>
      <path d="M5 3.5h14v17l-2.3-1.5-2.35 1.5L12 19l-2.35 1.5L7.3 19 5 20.5z" />
      <path d="M8.5 8h7M8.5 12h7" />
    </>
  ),
  users: (
    <>
      <circle cx="9" cy="8" r="3.2" />
      <path d="M3.5 20a5.5 5.5 0 0 1 11 0M16 5.2a3.2 3.2 0 0 1 0 6.1M17.5 20a5.5 5.5 0 0 0-2.4-4.5" />
    </>
  ),
  box: (
    <>
      <path d="M21 8.2 12 13 3 8.2 12 3.5z" />
      <path d="M3 8.2V16l9 4.8M21 8.2V16l-9 4.8M12 13v7.8" />
    </>
  ),
  wallet: (
    <>
      <path d="M4 7.5A2.5 2.5 0 0 1 6.5 5H18v3" />
      <path d="M4 7.5V18a2 2 0 0 0 2 2h13a1 1 0 0 0 1-1V9a1 1 0 0 0-1-1H6a2 2 0 0 1-2-2Z" />
      <circle cx="16.5" cy="13.5" r="1.3" />
    </>
  ),
  settings: (
    <>
      <circle cx="12" cy="12" r="3" />
      <path d="M12 2.5v2.2M12 19.3v2.2M21.5 12h-2.2M4.7 12H2.5M18.7 5.3l-1.55 1.55M6.85 17.15 5.3 18.7M18.7 18.7l-1.55-1.55M6.85 6.85 5.3 5.3" />
    </>
  ),
  plus: <path d="M12 5v14M5 12h14" />,
  download: <path d="M12 3v12m0 0 4.5-4.5M12 15l-4.5-4.5M4 19.5h16" />,
  printer: (
    <>
      <path d="M7 8V3.5h10V8" />
      <path d="M7 17H5a1 1 0 0 1-1-1v-5a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2v5a1 1 0 0 1-1 1h-2" />
      <rect x="7" y="14" width="10" height="6.5" rx="1" />
    </>
  ),
  message: <path d="M4 5.5h16a1 1 0 0 1 1 1V16a1 1 0 0 1-1 1H9l-4 3.5V17H4a1 1 0 0 1-1-1V6.5a1 1 0 0 1 1-1Z" />,
  pencil: <path d="M14.5 5.5l4 4M4 20l1-4L16 5a1.5 1.5 0 0 1 2 0l1 1a1.5 1.5 0 0 1 0 2L8 19l-4 1Z" />,
  ban: (
    <>
      <circle cx="12" cy="12" r="8.5" />
      <path d="M6 6l12 12" />
    </>
  ),
  trash: <path d="M4.5 6.5h15M9 6.5V4.5h6v2M6.5 6.5 7.5 20a1 1 0 0 0 1 1h7a1 1 0 0 0 1-1l1-13.5M10 10.5v6M14 10.5v6" />,
  check: <path d="M5 12.5 10 17.5 19.5 7" />,
  "check-circle": (
    <>
      <circle cx="12" cy="12" r="8.5" />
      <path d="M8 12.2l2.8 2.8L16 9.5" />
    </>
  ),
  rotate: <path d="M4.5 12a7.5 7.5 0 1 0 2.4-5.5M4 4v3.5h3.5" />,
  search: (
    <>
      <circle cx="10.5" cy="10.5" r="6" />
      <path d="M15 15l5 5" />
    </>
  ),
  x: <path d="M6 6l12 12M18 6 6 18" />,
  sparkles: <path d="M12 3.5l1.8 4.7L18.5 10l-4.7 1.8L12 16.5l-1.8-4.7L5.5 10l4.7-1.8zM18 15l.8 2 2 .8-2 .8-.8 2-.8-2-2-.8 2-.8z" />,
  alert: (
    <>
      <path d="M12 4 2.8 20h18.4z" />
      <path d="M12 10v4.5M12 17.2v.2" />
    </>
  ),
  info: (
    <>
      <circle cx="12" cy="12" r="8.5" />
      <path d="M12 11v5M12 8v.2" />
    </>
  ),
  "arrow-right": <path d="M5 12h14m0 0-5.5-5.5M19 12l-5.5 5.5" />,
  "arrow-left": <path d="M19 12H5m0 0 5.5-5.5M5 12l5.5 5.5" />,
  save: (
    <>
      <path d="M5 4.5h11l3 3V19a.5.5 0 0 1-.5.5h-13A.5.5 0 0 1 5 19z" />
      <path d="M8 4.5v4h6v-4M8 20v-5.5h8V20" />
    </>
  ),
  phone: <path d="M6 4h3l1.5 4-2 1.5a11 11 0 0 0 5 5l1.5-2 4 1.5v3a2 2 0 0 1-2 2A15 15 0 0 1 4 6a2 2 0 0 1 2-2Z" />,
  mail: (
    <>
      <rect x="3.5" y="5.5" width="17" height="13" rx="1.5" />
      <path d="M4 7l8 5.5L20 7" />
    </>
  ),
  "chevron-right": <path d="M9 5.5 15.5 12 9 18.5" />,
  sliders: <path d="M4 7h10M18 7h2M4 12h2M10 12h10M4 17h13M21 17h-1M14 5v4M6 10v4M17 15v4" />,
  image: (
    <>
      <rect x="3.5" y="4.5" width="17" height="15" rx="2" />
      <circle cx="8.5" cy="9.5" r="1.5" />
      <path d="M4 17l4.5-4.5L13 17M11 15l3-3 6 6" />
    </>
  ),
};

export function Icon({
  name,
  size = 20,
  strokeWidth = 1.75,
  ...rest
}: { name: IconName; size?: number; strokeWidth?: number } & SVGProps<SVGSVGElement>) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
      focusable={false}
      {...rest}
    >
      {PATHS[name]}
    </svg>
  );
}
