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

type ProductVariantImageDto = {
  image_url: string;
  position: number;
};

type ProductVariantDto = {
  id: string;
  unit: string;
  price: string | number;
  image_url?: string | null;
  product_variant_images?: ProductVariantImageDto[];
};

type ProductImageDto = {
  image_url: string;
  position: number;
};

type ProductDto = {
  id: string;
  name: string;
  description?: string | null;
  product_variants?: ProductVariantDto[];
  product_images?: ProductImageDto[];
};

const fallbackImage = "/images/milk.png";
const fallbackCategoryImage = "";
const staticCategoryImages: Record<string, string> = {
  "Dairy, Bread & Eggs": "/images/dairy-bread-eggs.png",
  "Fruits & Vegetables": "/images/fruits-and-vegetables.png",
  "Cold Drinks & Juices": "/images/cold-drink-and-juices.png",
  "Snacks & Munchies": "/images/snack-and-munchies.png",
  "Sweet Tooth": "/images/sweet-tooth.png",
  "Tea, Coffee & Milk Drinks": "/images/tea-coffee-milk.png",
  "Chicken, Meat & Fish": "/images/chicken-meat-fish.png",
  "Cleaning Essentials": "/images/cleaning-essentials.png",
};

const getVariantImageUrls = (variant: ProductVariantDto): string[] => {
  const galleryImages = (variant.product_variant_images ?? [])
    .slice()
    .sort((a, b) => a.position - b.position)
    .map((image) => image.image_url)
    .filter((image): image is string => Boolean(image));

  if (galleryImages.length > 0) {
    return galleryImages;
  }

  return variant.image_url ? [variant.image_url] : [];
};

const toProductUnit = (
  variant: ProductVariantDto,
  index: number,
): ProductUnit => {
  const images = getVariantImageUrls(variant);

  return {
    id: variant.id,
    label: `Unit ${index + 1}`,
    size: variant.unit,
    price: Number(variant.price),
    images: images.length > 0 ? images : undefined,
  };
};

const toProduct = (product: ProductDto): Product => {
  const variants = product.product_variants ?? [];
  const units = variants.map(toProductUnit);
  const productImages = (product.product_images ?? [])
    .slice()
    .sort((a, b) => a.position - b.position)
    .map((image) => image.image_url)
    .filter((image): image is string => Boolean(image));
  const firstVariantImages = units[0]?.images ?? [];
  const images =
    firstVariantImages.length > 0
      ? firstVariantImages
      : productImages.length > 0
        ? productImages
        : [fallbackImage];

  return {
    id: product.id,
    title: product.name,
    description: product.description ?? undefined,
    image: images[0] ?? fallbackImage,
    images,
    units,
  };
};

const toCategory = (category: CategoryDto): Category => ({
  id: category.id,
  title: category.name,
  image:
    category.image_url ??
    staticCategoryImages[category.name] ??
    fallbackCategoryImage,
});

export async function getCategories(): Promise<Category[]> {
  const categories = await apiFetch<CategoryDto[]>("/categories");
  return categories.map(toCategory);
}

export async function getProducts(
  categoryId?: string,
  search?: string,
): Promise<Product[]> {
  const queryParts: string[] = [];
  if (categoryId) {
    queryParts.push(`categoryId=${encodeURIComponent(categoryId)}`);
  }
  if (search?.trim()) {
    queryParts.push(`search=${encodeURIComponent(search.trim())}`);
  }

  const query = queryParts.length > 0 ? `?${queryParts.join("&")}` : "";
  const products = await apiFetch<ProductDto[]>(`/products${query}`);
  return products.map(toProduct).filter((product) => product.units.length > 0);
}

export async function getProduct(id: string): Promise<Product> {
  const product = await apiFetch<ProductDto>(`/products/${id}`);
  return toProduct(product);
}
