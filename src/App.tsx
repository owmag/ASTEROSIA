import { useEffect, useMemo, useRef, useState } from "react";
import { AnimatePresence, LayoutGroup, motion, useReducedMotion } from "framer-motion";
import products from "./data/products.json";
import { AppShell } from "./components/AppShell";
import { CategoryNav } from "./components/CategoryNav";
import { ProductGrid } from "./components/ProductGrid";
import {
  ProductDetailDialog,
  type ProductDetailDialogHandle,
} from "./components/ProductDetailDialog";
import {
  FooterDetailDialog,
  type FooterDetailDialogHandle,
} from "./components/FooterDetailDialog";
import {
  CartDetailDialog,
  type CartDetailDialogHandle,
} from "./components/CartDetailDialog";
import { HeaderBrandMark } from "./components/HeaderBrandMark";
import { categoriesWithMinCount } from "./lib/categoriesWithMinCount";
import { useProductGridTitlesHeaderZone } from "./lib/useProductGridTitlesHeaderZone";
import { productImageUrl } from "./lib/productImageUrl";
import { warmImage } from "./lib/warmImage";
import { scaledSeconds } from "./lib/storeMotionDebug";
import type { Product } from "./types/product";
import "./App.css";

const catalog = products as Product[];
const categoryNavRows = [["Natural Medicine"], ["Frankincense", "Incense"]];
const categoryNavOrder = categoryNavRows.flat();
const CART_STORAGE_KEY = "store2.cart.v1";

const detailBackdropTransition = {
  duration: scaledSeconds(0.48),
  ease: [0.22, 1, 0.36, 1] as const,
};

export default function App() {
  const reduceMotion = useReducedMotion();
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [footerSheetOpen, setFooterSheetOpen] = useState(false);
  const [cartDialogOpen, setCartDialogOpen] = useState(false);
  const [detailSku, setDetailSku] = useState<string | null>(null);
  /** Mirrors expanded row in the grid — cleared as soon as we close so the tile’s `layoutId` exists while overlay exits */
  const [detailGridHoldSku, setDetailGridHoldSku] = useState<string | null>(null);
  const [cartQtyBySku, setCartQtyBySku] = useState<Record<string, number>>({});
  const [headerEl, setHeaderEl] = useState<HTMLElement | null>(null);
  const detailRef = useRef<ProductDetailDialogHandle>(null);
  const footerDetailRef = useRef<FooterDetailDialogHandle>(null);
  const cartDetailRef = useRef<CartDetailDialogHandle>(null);

  /** Cart/footer modals reuse scroll lock classes; footer path can replace product backdrop in the same gesture. */
  const otherDetailOverlayOpenRef = useRef(false);
  otherDetailOverlayOpenRef.current = footerSheetOpen || cartDialogOpen;

  /** Strip product-detail shell chrome (footer sheets stay light — no re-apply). Product chrome comes from `useEffect([detailSku])`. */
  const revertProductShellChrome = () => {
    document.documentElement.classList.remove("detail-shell-chrome");
    document.documentElement.classList.remove("detail-shell-chrome--instant");
    document.documentElement.classList.remove("detail-shell-chrome--instant-exit");
    document.body.classList.remove("detail-shell-chrome");
    document.body.classList.remove("detail-shell-chrome--instant");
    document.body.classList.remove("detail-shell-chrome--instant-exit");
  };

  const closeProductDetail = () => {
    revertProductShellChrome();
    setDetailSku(null);
    setDetailGridHoldSku(null);
  };

  const filterableCategories = useMemo(() => {
    const availableCategories = new Set(categoriesWithMinCount(catalog, 2));
    return categoryNavOrder.filter((category) => availableCategories.has(category));
  }, []);

  const visibleProducts = useMemo(
    () =>
      selectedCategory
        ? catalog.filter((p) => p.category.split(" / ").includes(selectedCategory))
        : catalog,
    [selectedCategory],
  );

  const productGridLayoutKey = useMemo(
    () => visibleProducts.map((p) => p.sku).join("|"),
    [visibleProducts],
  );

  useProductGridTitlesHeaderZone(headerEl, productGridLayoutKey);

  const detailProduct = useMemo(
    () => (detailSku ? (catalog.find((p) => p.sku === detailSku) ?? null) : null),
    [detailSku],
  );

  const addToCartBySku = (sku: string) => {
    setCartQtyBySku((prev) => ({ ...prev, [sku]: (prev[sku] ?? 0) + 1 }));
  };
  const decrementCartBySku = (sku: string) => {
    setCartQtyBySku((prev) => {
      const nextQty = (prev[sku] ?? 0) - 1;
      if (nextQty <= 0) {
        const { [sku]: _, ...rest } = prev;
        return rest;
      }
      return { ...prev, [sku]: nextQty };
    });
  };

  const cartItems = useMemo(
    () =>
      catalog
        .map((product) => ({
          product,
          quantity: cartQtyBySku[product.sku] ?? 0,
        }))
        .filter((item) => item.quantity > 0),
    [cartQtyBySku],
  );

  const cartItemCount = useMemo(
    () => cartItems.reduce((sum, item) => sum + item.quantity, 0),
    [cartItems],
  );

  const cartTotalCents = useMemo(
    () => cartItems.reduce((sum, item) => sum + item.product.priceCents * item.quantity, 0),
    [cartItems],
  );

  const productImageSources = useMemo(() => catalog.map((p) => productImageUrl(p.image)), []);

  const shellOverlayOpen =
    footerSheetOpen ||
    cartDialogOpen ||
    detailProduct !== null ||
    detailGridHoldSku !== null;

  /** Distinguishes X-button contexts; detail + grid-hold share one sku token so closing detail→hold doesn’t retrigger a spin. */
  const overlaySpinSignature = useMemo(() => {
    if (!shellOverlayOpen) return "idle";
    if (cartDialogOpen) return "cart";
    if (footerSheetOpen) return "footer";
    const sku = detailSku ?? detailGridHoldSku;
    if (sku) return `detail:${sku}`;
    return "open";
  }, [shellOverlayOpen, cartDialogOpen, footerSheetOpen, detailSku, detailGridHoldSku]);

  const headerCategoryNavHidden =
    !cartDialogOpen &&
    (footerSheetOpen || detailProduct !== null || detailGridHoldSku !== null);

  /** Only mount CategoryNav on the browse grid — avoids a flash/fade when leaving cart onto an open product detail */
  const showBrowseCategoryNav =
    !cartDialogOpen &&
    !footerSheetOpen &&
    detailProduct === null &&
    detailGridHoldSku === null;

  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(CART_STORAGE_KEY);
      if (!raw) return;
      const parsed = JSON.parse(raw) as Record<string, unknown>;
      const validSkus = new Set(catalog.map((p) => p.sku));
      const hydrated: Record<string, number> = {};
      for (const [sku, qty] of Object.entries(parsed)) {
        if (!validSkus.has(sku)) continue;
        if (typeof qty !== "number" || !Number.isFinite(qty)) continue;
        const nextQty = Math.floor(qty);
        if (nextQty > 0) hydrated[sku] = nextQty;
      }
      setCartQtyBySku(hydrated);
    } catch {}
  }, []);

  useEffect(() => {
    try {
      if (Object.keys(cartQtyBySku).length === 0) {
        window.localStorage.removeItem(CART_STORAGE_KEY);
        return;
      }
      window.localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(cartQtyBySku));
    } catch {}
  }, [cartQtyBySku]);

  useEffect(() => {
    const preloadLinks: HTMLLinkElement[] = [];
    for (const src of productImageSources) {
      const link = document.createElement("link");
      link.rel = "preload";
      link.as = "image";
      link.href = src;
      document.head.appendChild(link);
      preloadLinks.push(link);
      warmImage(src);
    }
    return () => preloadLinks.forEach((link) => link.remove());
  }, [productImageSources]);

  /** Scroll lock lasts until backdrop exit completes. */
  useEffect(() => {
    if (!detailSku) return;
    document.documentElement.classList.add("detail-dialog-open");
    document.body.classList.add("detail-dialog-open");
  }, [detailSku]);

  return (
    <AppShell
      className={footerSheetOpen && !cartDialogOpen ? "app--footer-page" : undefined}
      headerRef={setHeaderEl}
      headerStart={
        <HeaderBrandMark
          overlayOpen={shellOverlayOpen}
          overlaySpinSignature={overlaySpinSignature}
          cartDialogOpen={cartDialogOpen}
          onActivate={() => {
            if (cartDialogOpen) {
              cartDetailRef.current?.close();
              return;
            }
            detailRef.current?.close();
            footerDetailRef.current?.close();
            cartDetailRef.current?.close();
          }}
        />
      }
      headerCenterHidden={headerCategoryNavHidden}
      onFooterSelect={(item) => {
        revertProductShellChrome();
        setDetailSku(null);
        setDetailGridHoldSku(null);
        footerDetailRef.current?.open(item);
      }}
      onCartSelect={() => {
        cartDetailRef.current?.open();
      }}
      cartCount={cartItemCount}
      headerCenter={
        cartDialogOpen ? (
          <div className="app__header-title-stack" aria-label="Cart">
            <p className="app__header-title">Cart</p>
            <p className="app__header-title app__header-title--blank" aria-hidden="true">
              &nbsp;
            </p>
          </div>
        ) : showBrowseCategoryNav ? (
          <CategoryNav
            categories={filterableCategories}
            rows={categoryNavRows}
            selected={selectedCategory}
            onSelect={setSelectedCategory}
          />
        ) : (
          <div className="app__header-title-stack" aria-hidden="true">
            <p className="app__header-title app__header-title--blank">&nbsp;</p>
            <p className="app__header-title app__header-title--blank" aria-hidden="true">
              &nbsp;
            </p>
          </div>
        )
      }
    >
      <LayoutGroup id="store-catalog">
        <div className="page">
          <ProductGrid
            products={visibleProducts}
            expandedSku={detailGridHoldSku}
            onAddToCart={(product) => addToCartBySku(product.sku)}
            onProductOpen={(product) => {
              footerDetailRef.current?.close();
              setCartDialogOpen(false);
              setDetailGridHoldSku(product.sku);
              setDetailSku(product.sku);
            }}
          />
        </div>
        <AnimatePresence
          initial={false}
          onExitComplete={() => {
            if (otherDetailOverlayOpenRef.current) return;
            document.documentElement.classList.remove("detail-dialog-open");
            document.body.classList.remove("detail-dialog-open");
          }}
        >
          {detailProduct ? (
            <motion.div
              key={detailProduct.sku}
              role="dialog"
              aria-modal="true"
              aria-label="Product details"
              className="product-detail-dialog product-detail-dialog--product product-detail-dialog--open"
              initial={
                reduceMotion ? false : { backgroundColor: "rgba(255, 255, 255, 0)" }
              }
              animate={{ backgroundColor: "rgba(255, 255, 255, 1)", opacity: 1 }}
              exit={{ backgroundColor: "rgba(255, 255, 255, 0)", opacity: 0 }}
              transition={reduceMotion ? { duration: 0 } : detailBackdropTransition}
              onClick={(e) => {
                if (e.target === e.currentTarget) detailRef.current?.close();
              }}
            >
              <ProductDetailDialog
                ref={detailRef}
                product={detailProduct}
                onClose={closeProductDetail}
                onAddToCartBySku={addToCartBySku}
              />
            </motion.div>
          ) : null}
        </AnimatePresence>
      </LayoutGroup>
      <FooterDetailDialog
        ref={footerDetailRef}
        onOpenChange={(open) => {
          setFooterSheetOpen(open);
          if (open) {
            cartDetailRef.current?.close();
            setDetailSku(null);
            setDetailGridHoldSku(null);
          }
        }}
      />
      <CartDetailDialog
        ref={cartDetailRef}
        items={cartItems}
        totalCents={cartTotalCents}
        onIncreaseItem={addToCartBySku}
        onDecreaseItem={decrementCartBySku}
        onOpenChange={(open) => {
          setCartDialogOpen(open);
        }}
      />
    </AppShell>
  );
}
