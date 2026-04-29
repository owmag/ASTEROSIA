import type { Product } from "../types/product";
import { ProductCard } from "./ProductCard";

type Props = {
  products: Product[];
  expandedSku: string | null;
  onProductOpen: (product: Product) => void;
  onAddToCart?: (product: Product) => void;
};

export function ProductGrid({
  products,
  expandedSku,
  onProductOpen,
  onAddToCart,
}: Props) {
  return (
    <ul className="product-grid" role="list">
      {products.map((p) => (
        <li key={p.sku} className="product-grid__item">
          {expandedSku === p.sku ? (
            <ProductCard product={p} placeholder eagerImage />
          ) : (
            <ProductCard
              product={p}
              layoutId={`product-${p.sku}-media`}
              onOpen={() => onProductOpen(p)}
              onAddToCart={onAddToCart}
              eagerImage
            />
          )}
        </li>
      ))}
    </ul>
  );
}
