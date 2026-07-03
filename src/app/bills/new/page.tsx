"use client";

import { BillForm } from "../../../components/BillForm";
import { PageHeader } from "../../../components/ui";

export default function NewBillPage() {
  return (
    <div>
      <PageHeader title="New Bill" subtitle="Fill in the details below. Totals are calculated for you." />
      <BillForm />
    </div>
  );
}
