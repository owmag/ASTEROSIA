import type { CSSProperties, ForwardedRef } from "react";
import { forwardRef, useMemo } from "react";
import { motion } from "framer-motion";
import type { Product } from "../types/product";
import { getProductMediaLayoutTransition } from "../lib/productMediaLayoutTransition";
import { productImageUrl } from "../lib/productImageUrl";
import { warmImage } from "../lib/warmImage";
import { formatEur } from "../lib/formatEur";

export type ProductCardProps = {
  product: Product;
  onOpen?: (article: HTMLElement) => void;
  onAddToCart?: (product: Product) => void;
  eagerImage?: boolean;
  /** Shared layout id for the image frame (grid ↔ overlay); omit for placeholders */
  layoutId?: string;
  /** Invisible cell while this product is expanded */
  placeholder?: boolean;
  /** Expanded layer: not a focusable grid tile */
  overlay?: boolean;
};

function ProductCardInner({
  product,
  onAddToCart,
  eagerImage,
  mediaLayoutId,
  mediaSpacerOnly,
  overlay = false,
}: {
  product: Product;
  onAddToCart?: (product: Product) => void;
  eagerImage: boolean;
  mediaLayoutId?: string;
  /** Empty aspect-ratio box — no second <img> while overlay is open */
  mediaSpacerOnly?: boolean;
  overlay?: boolean;
}) {
  const layoutTransition = useMemo(() => getProductMediaLayoutTransition(), []);
  /** Keeps PNG from quick opacity dips during shared-layout id handoff / remount */
  const mediaMotionTransition = useMemo(
    () => ({
      layout: { ...layoutTransition },
      opacity: { duration: 0 },
    }),
    [layoutTransition],
  );
  const hasRichDetail =
    Boolean(product.summary) || Boolean(product.detailBullets && product.detailBullets.length > 0);

  const image = !mediaSpacerOnly ? (
    <img
      src={productImageUrl(product.image)}
      alt={product.title}
      loading={eagerImage ? "eager" : "lazy"}
      fetchPriority={eagerImage ? "high" : "auto"}
      decoding={eagerImage ? "sync" : "async"}
      width={400}
      height={400}
    />
  ) : null;

  const media = mediaSpacerOnly ? (
    <div className="product-card__media" aria-hidden />
  ) : mediaLayoutId !== undefined ? (
    <motion.div
      className="product-card__media"
      layoutId={mediaLayoutId}
      initial={false}
      animate={{ opacity: 1 }}
      transition={mediaMotionTransition}
    >
      {image}
    </motion.div>
  ) : (
    <div className="product-card__media">{image}</div>
  );

  const body = (
    <>
      <h2 className="product-card__title">{product.title}</h2>
      <div className="product-card__meta">
        <p className="product-card__meta-line">{formatEur(product.priceCents)}</p>
        {product.tags && product.tags.length > 0 ? (
          <p className="product-card__meta-line product-card__meta-line--tags">
            {product.tags.join(" · ")}
          </p>
        ) : null}
      </div>
      <div className="product-card__detail">
        {product.summary ? <p className="product-card__summary">{product.summary}</p> : null}
        {product.detailBullets && product.detailBullets.length > 0 ? (
          <ul className="product-card__bullets">
            {product.detailBullets.map((line: string, i: number) => (
              <li key={i}>{line}</li>
            ))}
          </ul>
        ) : null}
        {!hasRichDetail ? (
          <p className="product-card__placeholder">
            Extended description for this item will appear here as the catalog grows.
          </p>
        ) : null}
        <button
          type="button"
          className="product-card__cart-button"
          onClick={(e) => {
            e.stopPropagation();
            onAddToCart?.(product);
          }}
        >
          Add to cart
        </button>
      </div>
    </>
  );

  return (
    <>
      {media}
      {overlay ? (
        <div className="product-card__body product-card__body--overlay">{body}</div>
      ) : (
        <div className="product-card__body">{body}</div>
      )}
    </>
  );
}

export const ProductCard = forwardRef(function ProductCard(
  {
    product,
    onOpen,
    onAddToCart,
    eagerImage = false,
    layoutId,
    placeholder = false,
    overlay = false,
  }: ProductCardProps,
  ref: ForwardedRef<HTMLElement>,
) {
  const imageScale = product.imageScale ?? 1;
  const style = { ["--image-scale" as string]: String(imageScale) } as CSSProperties;

  const innerProps = {
    product,
    onAddToCart,
    eagerImage,
    mediaLayoutId: placeholder ? undefined : layoutId,
    mediaSpacerOnly: placeholder,
    overlay,
  };

  if (placeholder) {
    return (
      <article
        ref={ref}
        className="product-card product-card--placeholder"
        data-product-sku={product.sku}
        style={style}
        aria-hidden
        tabIndex={-1}
      >
        <ProductCardInner {...innerProps} />
      </article>
    );
  }

  const warmOnHover = () => warmImage(productImageUrl(product.image));

  if (layoutId) {
    return (
      <article
        ref={ref}
        className="product-card"
        data-product-sku={product.sku}
        style={style}
        tabIndex={overlay ? -1 : 0}
        role={overlay ? undefined : "button"}
        aria-haspopup={overlay ? undefined : "dialog"}
        onPointerEnter={warmOnHover}
        onClick={overlay ? undefined : (e) => onOpen?.(e.currentTarget)}
        onKeyDown={
          overlay
            ? undefined
            : (e) => {
                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault();
                  onOpen?.(e.currentTarget);
                }
              }
        }
      >
        <ProductCardInner {...innerProps} />
      </article>
    );
  }

  return (
    <article
      ref={ref}
      className="product-card"
      data-product-sku={product.sku}
      style={style}
      tabIndex={0}
      role="button"
      aria-haspopup="dialog"
      onPointerEnter={warmOnHover}
      onClick={(e) => onOpen?.(e.currentTarget)}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          onOpen?.(e.currentTarget);
        }
      }}
    >
      <ProductCardInner {...innerProps} />
    </article>
  );
});
