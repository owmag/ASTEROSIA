import type { ReactNode, Ref } from "react";
import { motion, useReducedMotion } from "framer-motion";
import { scaledSeconds } from "../lib/storeMotionDebug";
import shoppingBagSvg from "../assets/shopping_bag.svg?raw";

type Props = {
  children: ReactNode;
  headerCenter?: ReactNode;
  /** Left column (e.g. close when product detail is open). */
  headerStart?: ReactNode;
  headerCenterHidden?: boolean;
  onFooterSelect?: (item: string) => void;
  onCartSelect?: () => void;
  cartCount?: number;
  /** Extra class on the root `.app` wrapper (e.g. footer sheet state). */
  className?: string;
  headerRef?: Ref<HTMLElement>;
};

export function AppShell({
  children,
  headerCenter,
  headerStart,
  headerCenterHidden,
  onFooterSelect,
  onCartSelect,
  cartCount = 0,
  className,
  headerRef,
}: Props) {
  const reduceMotion = useReducedMotion();
  const centerHidden = Boolean(headerCenterHidden);
  /** Fade out when hiding nav; show nav again immediately (e.g. cart closes) without a slow fade-in. */
  const navFadeTransition = reduceMotion
    ? { duration: 0 }
    : centerHidden
      ? { duration: scaledSeconds(0.35), ease: [0.22, 1, 0.36, 1] as const }
      : { duration: 0 };
  // Outlines: add `debug-outlines` → className="app debug-outlines" (App.css `.app.debug-outlines`).
  return (
    <div className={["app", className].filter(Boolean).join(" ")}>
      <header ref={headerRef} className="app__header">
        <div className="app__header-inner">
          <div className="app__header-start">{headerStart}</div>
          <motion.div
            className="app__header-center"
            aria-hidden={centerHidden ? true : undefined}
            style={{ pointerEvents: centerHidden ? "none" : "auto" }}
            initial={false}
            animate={{ opacity: centerHidden ? 0 : 1 }}
            transition={navFadeTransition}
          >
            {headerCenter}
          </motion.div>
          <button
            type="button"
            className="app__header-cart"
            aria-label="Cart"
            onClick={onCartSelect}
          >
            <span className="app__header-cart-visual">
              <span
                className="app__header-cart-icon-slot"
                aria-hidden
                dangerouslySetInnerHTML={{ __html: shoppingBagSvg }}
              />
              {cartCount > 0 ? (
                <span className="app__header-cart-count" aria-hidden>
                  {cartCount}
                </span>
              ) : null}
            </span>
          </button>
        </div>
      </header>
      <main className="app__main">
        {children}
      </main>
      <footer className="app__footer">
        <nav className="app__footer-nav" aria-label="Footer">
          {["Contact", "Terms", "Privacy", "Accessibility"].map((item) => (
            <button
              type="button"
              className="app__footer-link"
              key={item}
              onClick={() => onFooterSelect?.(item)}
            >
              {item}
            </button>
          ))}
        </nav>
      </footer>
    </div>
  );
}
