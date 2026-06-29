# Simple Billing

An easy, **elderly-friendly billing & invoicing app for small Indian businesses**.
Big buttons, large readable text, calm colours and obvious flows — a
non-technical shop owner can create and print/download a bill in under two
minutes. Built with Next.js (App Router), React and TypeScript.

> The app is fully general-purpose. Set your business name, logo and details
> once in **Settings** and every bill and PDF is rebranded — no code edits.

## What you can do

- **Dashboard** — today's sales, money to collect, this month, recent bills, big quick-action tiles.
- **Bills** — create/edit bills with multiple items (quantity, rate, discount, GST), live auto-totals (subtotal → discount → GST → grand total → amount paid → balance due), draft & finalized states, search and filter by status.
- **Bill detail** — printable invoice preview, **Download PDF**, **Print**, **Share on WhatsApp**, record full/partial payments, payment history.
- **Customers** — add/edit, see outstanding balance and bill count.
- **Products & Services** — save items with default price/GST/unit to add to bills in one tap.
- **Payments** — full payment log with search and mode filters.
- **Settings** — business profile, logo upload, currency, default GST, invoice prefix & numbering, default notes/terms, AI toggle, reset demo data.
- **Smart Help** assistant — works **with or without** an AI key (see below).

All data is stored in the browser (localStorage), so the app works offline and
needs no database to try out. Use **Settings → Reset to demo data** to restore
the sample records.

## Getting started

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000). The app is pre-loaded with
demo customers, products and bills.

### Scripts

```bash
npm run dev     # development server
npm run build   # production build
npm run start   # run the production build
npm run lint    # eslint
```

## How PDF generation works

The app is frontend-first, so bills are rendered from a self-contained,
print-friendly HTML invoice template (`src/components/PdfInvoiceTemplate.tsx`)
that uses inline styles so it looks identical on screen, in print and in PDF.

On the **Bill detail** page:

- **Download PDF** — uses [`html2pdf.js`](https://github.com/eKoopmans/html2pdf.js) (loaded dynamically in the browser) to rasterise the invoice element to an A4 PDF named `<invoice-number>.pdf`.
- **Print** — uses the browser's print dialog; print CSS hides the app chrome so only the invoice prints (also lets users "Save as PDF").
- **Share WhatsApp** — opens a pre-filled WhatsApp message with the bill summary.

There is no server dependency for PDFs, so it works on any static/Vercel
deployment. (If you later add a backend, you can swap in Playwright/Puppeteer
server-side rendering for even higher fidelity.)

## How to configure the AI helper (optional)

**Billing works fully without AI.** The floating **Smart Help** panel always
provides offline help: today's summary, top customers, one-tap WhatsApp payment
reminders, and plain-language answers ("What does Balance Due mean?"). The bill
form also flags likely mistakes (missing phone, zero quantity, unusual price,
duplicate bill) with no AI required.

To additionally enable the **"Ask the AI"** chat (create a bill from plain
English like *"Make a bill for Rajesh for 2 sarees at 1200 each and 1 blouse at
500"*, ask questions, get summaries):

```bash
cp .env.example .env.local
# edit .env.local and set OPENROUTER_API_KEY
npm run dev
```

The chat uses CopilotKit with an OpenRouter (OpenAI-compatible) backend; the
model defaults to `nex-agi/nex-n2-pro:free` and can be changed with
`OPENROUTER_MODEL`. If no key is set, the app makes **no AI network requests**
and the AI tab shows a friendly *"AI helper not configured"* message. No secrets
are committed — `.env*.local` is gitignored.

## Tech notes

- **Framework:** Next.js App Router, React 19, TypeScript (strict).
- **State:** `BillingProvider` React context backed by localStorage (`src/lib/store.tsx`).
- **Pure logic:** calculations (`src/lib/calc.ts`), offline insights/checks (`src/lib/insights.ts`).
- **Reusable components:** `PageHeader`, `Card`, `Button`, `EmptyState`, `PaymentStatusBadge`, `Modal`/`ConfirmDialog`, `CustomerPicker`, `ProductPicker`, `BillPreview`, `PdfInvoiceTemplate`, `AiAssistantPanel`.
- **Accessibility:** large fonts and tap targets, high contrast, labels associated with inputs, keyboard-friendly forms, responsive desktop/tablet/mobile layouts.

## Known limitations

- Data lives in the browser (localStorage) — it is per-device and not synced across devices. A backend/database can be added later behind the same store API.
- Logo is stored inline as a data URL (kept under 600 KB).
- PDF rendering is client-side raster (html2pdf.js); very long bills span multiple pages automatically but text is not selectable in the PDF.
