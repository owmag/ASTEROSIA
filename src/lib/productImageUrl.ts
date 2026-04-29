export function productImageUrl(fileName: string): string {
  return `/products/${encodeURIComponent(fileName)}`;
}
