export type ProductUnit = {
  id: string;
  label: string;
  size: string;
  price: number;
  images?: string[];
};

export type Product = {
  id: string;
  categoryId?: string;
  title: string;
  description?: string;
  image: string;
  images: string[];
  units: ProductUnit[];
};

export const products: Product[] = [
  {
    id: "amul-gold-milk",
    categoryId: "dairy",
    title: "Amul Gold Milk",
    description: "Full cream milk, rich in calcium and nutrients.",
    image: "/images/milk.png",
    images: ["/images/milk.png", "/images/milk.png", "/images/milk.png"],
    units: [
      { id: "500ml", label: "Unit 1", size: "500ml", price: 34 },
      { id: "1l", label: "Unit 2", size: "1L", price: 62 },
    ],
  },
];

export function getProductById(id: string): Product | undefined {
  return products.find((product) => product.id === id);
}
