export function formatEur(priceCents: number): string {
  return new Intl.NumberFormat("en-IE", {
    style: "currency",
    currency: "EUR",
  }).format(priceCents / 100);
}
