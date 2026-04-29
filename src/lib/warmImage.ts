/** Loads and decodes an image URL into the HTTP cache / GPU-ready buffers (repeat-safe). */
export function warmImage(src: string): void {
  const img = new Image();
  img.src = src;
  img.decode?.().catch(() => {});
}
