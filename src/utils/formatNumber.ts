export function formatNumberToCurrency(
  value: any,
  locale: string = "en-US",
  currency: string = "USD"
): string {
  // Convert the value to a number and default to 0 if it's invalid
  const numericValue = isNaN(Number(value)) ? 0 : Number(value);

  return new Intl.NumberFormat(locale, {
    style: "currency",
    currency: currency,
  }).format(numericValue);
}
