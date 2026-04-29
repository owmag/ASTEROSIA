export function categoriesWithMinCount(
  products: { category: string }[],
  minCount: number,
): string[] {
  const counts = new Map<string, number>();
  for (const p of products) {
    counts.set(p.category, (counts.get(p.category) ?? 0) + 1);
  }
  return [...counts.entries()]
    .filter(([, n]) => n >= minCount)
    .map(([c]) => c)
    .sort((a, b) => a.localeCompare(b));
}
