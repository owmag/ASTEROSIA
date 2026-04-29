import { useLayoutEffect, useRef } from "react";

const TITLE_SELECTOR =
  ".product-grid .product-card:not(.product-card--placeholder) .product-card__title";

/**
 * When the title’s bottom edge is at or above this Y (viewport px), hide instantly (snap).
 */
const VIEWPORT_TOP_SNAP_LINE_PX = 64;

function clearProductTitleClipClasses() {
  if (typeof document === "undefined") return;
  document.querySelectorAll<HTMLElement>(TITLE_SELECTOR).forEach((el) => {
    el.classList.remove("product-card__title--header-zone", "product-card__title--top-snap");
  });
}

function syncProductTitlesToHeader(headerEl: HTMLElement | null) {
  if (typeof document === "undefined") return;
  if (!headerEl) {
    clearProductTitleClipClasses();
    return;
  }
  const headerBottom = headerEl.getBoundingClientRect().bottom;

  document.querySelectorAll<HTMLElement>(TITLE_SELECTOR).forEach((el) => {
    const r = el.getBoundingClientRect();

    if (r.bottom <= 0 || r.top > window.innerHeight) {
      el.classList.remove("product-card__title--header-zone", "product-card__title--top-snap");
      return;
    }

    const inTopSnap = r.bottom <= VIEWPORT_TOP_SNAP_LINE_PX && r.bottom > 0;
    const inHeaderFade = r.top < headerBottom && r.bottom > 0;

    if (inTopSnap) {
      el.classList.add("product-card__title--top-snap");
      el.classList.remove("product-card__title--header-zone");
    } else if (inHeaderFade) {
      el.classList.remove("product-card__title--top-snap");
      el.classList.add("product-card__title--header-zone");
    } else {
      el.classList.remove("product-card__title--header-zone", "product-card__title--top-snap");
    }
  });
}

/**
 * Grid titles: smooth fade under the header, instant hide when the title bottom
 * crosses the viewport snap line (see VIEWPORT_TOP_SNAP_LINE_PX).
 */
export function useProductGridTitlesHeaderZone(headerEl: HTMLElement | null, layoutSyncKey: string) {
  const rafRef = useRef(0);

  useLayoutEffect(() => {
    const cancelRaf = () => {
      if (rafRef.current) {
        cancelAnimationFrame(rafRef.current);
        rafRef.current = 0;
      }
    };

    const flush = () => {
      cancelRaf();
      syncProductTitlesToHeader(headerEl);
    };

    const schedule = () => {
      cancelRaf();
      rafRef.current = requestAnimationFrame(() => {
        rafRef.current = 0;
        syncProductTitlesToHeader(headerEl);
      });
    };

    flush();

    if (!headerEl) {
      return () => {
        cancelRaf();
        clearProductTitleClipClasses();
      };
    }

    const ro = new ResizeObserver(schedule);
    ro.observe(headerEl);

    window.addEventListener("scroll", schedule, { passive: true });
    window.addEventListener("resize", schedule);

    return () => {
      cancelRaf();
      ro.disconnect();
      window.removeEventListener("scroll", schedule);
      window.removeEventListener("resize", schedule);
      clearProductTitleClipClasses();
    };
  }, [headerEl, layoutSyncKey]);
}
