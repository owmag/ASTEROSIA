import { forwardRef, useCallback, useEffect, useImperativeHandle } from "react";
import { ProductCard } from "./ProductCard";
import type { Product } from "../types/product";

export type ProductDetailDialogHandle = {
  close: () => void;
};

type Props = {
  product: Product;
  onClose: () => void;
  onAddToCartBySku: (sku: string) => void;
};

export const ProductDetailDialog = forwardRef<ProductDetailDialogHandle, Props>(
  function ProductDetailDialog({ product, onClose, onAddToCartBySku }, ref) {
    const runClose = useCallback(() => {
      onClose();
    }, [onClose]);

    useImperativeHandle(ref, () => ({ close: runClose }), [runClose]);

    useEffect(() => {
      const onKey = (e: KeyboardEvent) => {
        if (e.key === "Escape") runClose();
      };
      window.addEventListener("keydown", onKey);
      return () => window.removeEventListener("keydown", onKey);
    }, [runClose]);

    return (
      <ProductCard
        product={product}
        layoutId={`product-${product.sku}-media`}
        overlay
        eagerImage
        onAddToCart={(p) => onAddToCartBySku(p.sku)}
      />
    );
  },
);
