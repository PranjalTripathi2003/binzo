import type { Product, ProductUnit } from "../data/products";
import { apiFetch } from "./api";

export type Category = {
  id: string;
  title: string;
  image: string;
};

type CategoryDto = {
  id: string;
  name: string;
  image_url?: string | null;
};

type ProductVariantDto = {
  id: string;
  unit: string;
  price: string | number;
  image_url?: string | null;
};

type ProductDto = {
  id: string;
  name: string;
  product_variants?: ProductVariantDto[];
};

const fallbackImage = "/images/milk.png";
const fallbackCategoryImage = "/images/dairy.png";

const toProductUnit = (
  variant: ProductVariantDto,
  index: number,
): ProductUnit => ({
  id: variant.id,
  label: `Unit ${index + 1}`,
  size: variant.unit,
  price: Number(variant.price),
});

const toProduct = (product: ProductDto): Product => {
  const variants = product.product_variants ?? [];
  const firstImage = variants.find((variant) => variant.image_url)?.image_url;
  const images = variants
    .map((variant) => variant.image_url)
    .filter((image): image is string => Boolean(image));

  return {
    id: product.id,
    title: product.name,
    image: firstImage ?? fallbackImage,
    images: images.length > 0 ? images : [fallbackImage],
    units: variants.map(toProductUnit),
  };
};

const toCategory = (category: CategoryDto): Category => ({
  id: category.id,
  title: category.name,
  image: category.image_url ?? fallbackCategoryImage,
});

export async function getCategories(): Promise<Category[]> {
  const categories = await apiFetch<CategoryDto[]>("/categories");
  return categories.map(toCategory);
}

export async function getProducts(categoryId?: string): Promise<Product[]> {
  const query = categoryId ? `?categoryId=${encodeURIComponent(categoryId)}` : "";
  const products = await apiFetch<ProductDto[]>(`/products${query}`);
  return products.map(toProduct).filter((product) => product.units.length > 0);
}

export async function getProduct(id: string): Promise<Product> {
  const product = await apiFetch<ProductDto>(`/products/${id}`);
  return toProduct(product);
}
