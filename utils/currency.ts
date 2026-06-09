// Centralised money formatting so every screen renders prices the same way.
// The platform operates in Nigerian Naira, so NGN is the default when a
// service/booking doesn't carry an explicit currency.
const SYMBOLS: Record<string, string> = {
  NGN: "₦",
  USD: "$",
  GBP: "£",
  EUR: "€",
};

export const DEFAULT_CURRENCY = "NGN";

export const currencySymbol = (currency?: string | null): string => {
  if (!currency) return SYMBOLS[DEFAULT_CURRENCY];
  return SYMBOLS[currency.toUpperCase()] ?? SYMBOLS[DEFAULT_CURRENCY];
};

// Formats a major-unit amount (e.g. naira) with thousands separators.
// Whole amounts show no decimals; fractional amounts show up to two.
export const formatCurrency = (amount: number, currency?: string | null): string =>
  `${currencySymbol(currency)}${amount.toLocaleString("en-NG", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  })}`;

// Formats a minor-unit amount (kobo/cents) coming straight from the API.
export const formatPriceCents = (
  priceCents?: number | null,
  currency?: string | null,
): string => formatCurrency((priceCents ?? 0) / 100, currency);
