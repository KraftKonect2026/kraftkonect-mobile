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

// Formats a number with thousands separators safely.
// Whole numbers show no decimals, floats show 2 decimal places.
export const formatNumberSafe = (amount: number): string => {
  if (amount == null || isNaN(amount)) return "0";
  if (amount % 1 === 0) {
    return amount.toFixed(0).replace(/\B(?=(\d{3})+(?!\d))/g, ",");
  }
  return amount.toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ",");
};

// Formats a major-unit amount (e.g. naira) with thousands separators.
// Whole amounts show no decimals; fractional amounts show up to two.
export const formatCurrency = (amount: number, currency?: string | null): string =>
  `${currencySymbol(currency)}${formatNumberSafe(amount)}`;

// Formats a minor-unit amount (kobo/cents) coming straight from the API.
export const formatPriceCents = (
  priceCents?: number | null,
  currency?: string | null,
): string => formatCurrency((priceCents ?? 0) / 100, currency);
