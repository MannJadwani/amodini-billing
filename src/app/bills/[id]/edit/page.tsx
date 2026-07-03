"use client";

import { use } from "react";
import Link from "next/link";
import { useBilling } from "../../../../lib/store";
import { BillForm } from "../../../../components/BillForm";
import { EmptyState, PageHeader } from "../../../../components/ui";

export default function EditBillPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const { getBill } = useBilling();
  const bill = getBill(id);

  if (!bill) {
    return (
      <EmptyState
        icon="search"
        title="Bill not found"
        message="This bill may have been deleted."
        action={
          <Link href="/bills" className="btn btn-primary">
            Back to bills
          </Link>
        }
      />
    );
  }

  return (
    <div>
      <PageHeader title={`Edit ${bill.invoiceNumber}`} subtitle="Make changes, then save or finalize." />
      <BillForm existing={bill} />
    </div>
  );
}
