/** Format GYD price: 8500 → "GYD 8,500" */
export function formatGYD(amount: number): string {
  return `GYD ${amount.toLocaleString()}`;
}

/** Format GYD with /mo: 8500 → "GYD 8,500/mo" */
export function formatGYDMonthly(amount: number): string {
  return `${formatGYD(amount)}/mo`;
}

/** Format USD: 40.00 → "~USD $40" */
export function formatUSD(amount: number): string {
  return `~USD $${Math.round(amount)}`;
}

/** WhatsApp deep link */
export function waLink(message?: string): string {
  const phone = process.env.NEXT_PUBLIC_WHATSAPP_NUMBER || "5926092487";
  const base = `https://wa.me/${phone}`;
  return message ? `${base}?text=${encodeURIComponent(message)}` : base;
}

/** Validate Guyanese phone: +592 followed by 7 digits */
export function isValidGYPhone(phone: string): boolean {
  return /^\+592\d{7}$/.test(phone);
}

/** CSS class helper */
export function cn(...classes: (string | false | null | undefined)[]): string {
  return classes.filter(Boolean).join(" ");
}

/** Get UTM params from URL */
export function getUTMParams(): Record<string, string | null> {
  if (typeof window === "undefined") return {};
  const params = new URLSearchParams(window.location.search);
  return {
    utm_source: params.get("utm_source"),
    utm_medium: params.get("utm_medium"),
    utm_campaign: params.get("utm_campaign"),
  };
}
