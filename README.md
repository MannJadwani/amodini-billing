# Amodini Billing

A simple billing management application built with Next.js and CopilotKit.

The workspace includes:

- Customer list and customer details
- Inventory management with stock, reorder points, suppliers, and pricing
- Invoice creation with tax totals and automatic inventory deductions
- Payment tracking and invoice balance updates
- Dashboard cards for revenue, outstanding balance, low-stock SKUs, and overdue invoices
- A CopilotKit sidebar assistant that can read the current billing state and use app actions to create customers, update inventory, create invoices, record payments, and summarize billing health

## Getting started

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

To enable live CopilotKit chat responses, add an OpenRouter key before starting the app:

```bash
cp .env.example .env.local
# edit .env.local and set OPENROUTER_API_KEY
```

The CopilotKit runtime uses OpenRouter at `https://openrouter.ai/api/v1` and defaults to the `nex-agi/nex-n2-pro:free` model. You can override it with `OPENROUTER_MODEL`.

The app stores demo changes in browser local storage. Use **Reset demo data** in the UI to restore the seed records.

## Scripts

```bash
npm run dev
npm run build
npm run lint
```
