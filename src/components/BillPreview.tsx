"use client";

import { useRef, useState } from "react";
import { Bill, BusinessSettings } from "../lib/types";
import { PdfInvoiceTemplate } from "./PdfInvoiceTemplate";
import { Button } from "./ui";
import { downloadElementAsPdf } from "../lib/pdf";
import { whatsappLink, formatMoney } from "../lib/format";
import { useToast } from "./ToastProvider";

// Renders the printable invoice plus the Preview / Print / Download PDF /
// Share WhatsApp action buttons. Used on the Bill Detail page.
export function BillPreview({
  bill,
  settings,
  showActions = true,
}: {
  bill: Bill;
  settings: BusinessSettings;
  showActions?: boolean;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [busy, setBusy] = useState(false);
  const toast = useToast();

  const handleDownload = async () => {
    if (!ref.current) return;
    setBusy(true);
    try {
      await downloadElementAsPdf(ref.current, `${bill.invoiceNumber}.pdf`);
      toast.success("PDF downloaded.");
    } catch {
      toast.error("Could not make PDF. Try Print instead.");
    } finally {
      setBusy(false);
    }
  };

  const handlePrint = () => window.print();

  const shareMessage = () => {
    const lines = [
      `Hello ${bill.customer.name || "there"},`,
      `Here is your bill ${bill.invoiceNumber} from ${settings.businessName || "us"}.`,
      `Total: ${formatMoney(bill.grandTotal, settings.currency)}`,
      bill.balanceDue > 0
        ? `Balance due: ${formatMoney(bill.balanceDue, settings.currency)}`
        : `Paid in full. Thank you!`,
    ];
    return lines.join("\n");
  };

  return (
    <div>
      {showActions ? (
        <div className="row no-print" style={{ marginBottom: 18 }}>
          <Button variant="primary" icon="⬇️" onClick={handleDownload} disabled={busy}>
            {busy ? "Preparing…" : "Download PDF"}
          </Button>
          <Button variant="secondary" icon="🖨️" onClick={handlePrint}>
            Print
          </Button>
          <a
            className="btn btn-success"
            href={whatsappLink(bill.customer.phone, shareMessage())}
            target="_blank"
            rel="noreferrer"
            onClick={(e) => {
              if (!bill.customer.phone) {
                e.preventDefault();
                toast.error("Add a phone number to share on WhatsApp.");
              }
            }}
          >
            <span className="ico">💬</span> Share WhatsApp
          </a>
        </div>
      ) : null}

      <div className="card" style={{ overflowX: "auto", padding: 0 }}>
        <PdfInvoiceTemplate ref={ref} bill={bill} settings={settings} />
      </div>
    </div>
  );
}
