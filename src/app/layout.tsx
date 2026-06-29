import type { Metadata } from "next";
import type { ReactNode } from "react";
import { Fraunces, Hanken_Grotesk } from "next/font/google";
import { Providers } from "./providers";
import { AppShell } from "../components/AppShell";
import "./globals.css";

// Bespoke pairing — a warm editorial serif for headings + a highly legible
// humanist grotesque for UI. Deliberately NOT Inter/Roboto/system.
const display = Fraunces({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  style: ["normal", "italic"],
  variable: "--font-display",
  display: "swap",
});

const ui = Hanken_Grotesk({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
  variable: "--font-ui",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Simple Billing",
  description: "Easy billing & invoices for small businesses.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: ReactNode;
}>) {
  return (
    <html lang="en" className={`${display.variable} ${ui.variable}`}>
      <body>
        {/* Apply saved density before paint to avoid a flash of the wrong mode. */}
        <script
          dangerouslySetInnerHTML={{
            __html:
              "try{var d=localStorage.getItem('simple-billing-density');document.documentElement.dataset.density=d==='compact'?'compact':'comfortable';}catch(e){}",
          }}
        />
        <Providers>
          <AppShell>{children}</AppShell>
        </Providers>
      </body>
    </html>
  );
}
