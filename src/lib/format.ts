// Formatting helpers tuned for small Indian businesses.

export function formatMoney(value: number, currency = "INR"): string {
  const amount = Number.isFinite(value) ? value : 0;
  try {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency,
      maximumFractionDigits: 2,
      minimumFractionDigits: amount % 1 === 0 ? 0 : 2,
    }).format(amount);
  } catch {
    // Fallback if an unknown currency code is configured.
    return `₹${amount.toFixed(2)}`;
  }
}

// Indian-friendly date, e.g. "29 Jun 2026".
export function formatDate(value: string | null | undefined): string {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "—";
  return new Intl.DateTimeFormat("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(date);
}

export function formatDateTime(value: string | null | undefined): string {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "—";
  return new Intl.DateTimeFormat("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}

// Today's date as YYYY-MM-DD for <input type="date"> defaults.
export function todayISO(): string {
  return new Date().toISOString().slice(0, 10);
}

// Keep digits, spaces, +, - for Indian phone numbers.
export function cleanPhone(phone: string): string {
  return phone.replace(/[^\d+\-\s]/g, "").trim();
}

// Build a WhatsApp deep link. Strips non-digits; assumes Indian (+91)
// numbers when a bare 10-digit number is supplied.
export function whatsappLink(phone: string, message: string): string {
  let digits = phone.replace(/\D/g, "");
  if (digits.length === 10) digits = `91${digits}`;
  return `https://wa.me/${digits}?text=${encodeURIComponent(message)}`;
}
