export type Product = {
  title: string;
  category: string;
  priceCents: number;
  sku: string;
  image: string;
  imageScale?: number;
  tags?: string[];
  summary?: string;
  detailBullets?: string[];
};
