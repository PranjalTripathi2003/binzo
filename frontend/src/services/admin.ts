import { API_BASE_URL, apiFetch, refreshAccessToken } from "./api";

// ────────────────────────────────────────────────────────────
// Types
// ────────────────────────────────────────────────────────────

export type Category = {
  id: string;
  name: string;
  slug: string;
  image_url?: string | null;
  created_at: string;
};

export type ProductVariantImage = {
  id: string;
  variant_id: string;
  image_url: string;
  position: number;
  created_at: string;
};

export type ProductVariant = {
  id: string;
  product_id: string;
  unit: string;
  price: number;
  stock: number;
  image_url?: string | null;
  note?: string | null;
  product_variant_images?: ProductVariantImage[];
};

export type ProductImage = {
  id: string;
  product_id: string;
  image_url: string;
  position: number;
  created_at: string;
};

export type Product = {
  id: string;
  category_id: string;
  name: string;
  description?: string | null;
  brand?: string | null;
  created_at: string;
  updated_at: string;
  product_variants: ProductVariant[];
  product_images?: ProductImage[];
};

export type CreateProductVariantInput = {
  unit: string;
  price: number;
  stock?: number;
  image_url?: string;
  image_urls?: string[];
  note?: string;
};

export type UpdateProductVariantInput = {
  id?: string;
  unit: string;
  price: number;
  stock?: number;
  image_url?: string;
  image_urls?: string[];
  note?: string;
};

export type CreateProductInput = {
  category_id: string;
  name: string;
  description?: string;
  brand?: string;
  image_urls?: string[];
  variants: CreateProductVariantInput[];
};

export type UpdateProductInput = {
  category_id?: string;
  name?: string;
  description?: string;
  brand?: string;
  image_urls?: string[];
  variants?: UpdateProductVariantInput[];
};

export type CreateCategoryInput = {
  name: string;
  slug: string;
  image_url?: string;
};

export type UpdateCategoryInput = {
  name?: string;
  slug?: string;
  image_url?: string;
};

// ────────────────────────────────────────────────────────────
// Category endpoints
// ────────────────────────────────────────────────────────────

export async function getCategories(): Promise<Category[]> {
  return apiFetch<Category[]>("/categories");
}

export async function createCategory(
  input: CreateCategoryInput,
): Promise<Category> {
  return apiFetch<Category>("/categories", {
    method: "POST",
    body: JSON.stringify(input),
  });
}

export async function updateCategory(
  id: string,
  input: UpdateCategoryInput,
): Promise<Category> {
  return apiFetch<Category>(`/categories/${id}`, {
    method: "PATCH",
    body: JSON.stringify(input),
  });
}

export async function deleteCategory(id: string): Promise<void> {
  return apiFetch<void>(`/categories/${id}`, { method: "DELETE" });
}

// ────────────────────────────────────────────────────────────
// Product endpoints
// ────────────────────────────────────────────────────────────

export async function getProducts(categoryId?: string): Promise<Product[]> {
  const qs = categoryId ? `?categoryId=${categoryId}` : "";
  return apiFetch<Product[]>(`/products${qs}`);
}

export async function createProduct(
  input: CreateProductInput,
): Promise<Product> {
  return apiFetch<Product>("/products", {
    method: "POST",
    body: JSON.stringify(input),
  });
}

export async function updateProduct(
  id: string,
  input: UpdateProductInput,
): Promise<Product> {
  return apiFetch<Product>(`/products/${id}`, {
    method: "PATCH",
    body: JSON.stringify(input),
  });
}

export async function deleteProduct(id: string): Promise<void> {
  return apiFetch<void>(`/products/${id}`, { method: "DELETE" });
}

/**
 * Uploads a product image to Supabase Storage via the backend.
 * Returns the public URL of the stored image.
 */
export async function uploadProductImage(file: File): Promise<string> {
  const formData = new FormData();
  formData.append("file", file);

  const upload = (token: string | null) =>
    fetch(`${API_BASE_URL}/products/upload-image`, {
      method: "POST",
      headers: token ? { Authorization: `Bearer ${token}` } : {},
      body: formData,
    });

  let token = localStorage.getItem("access_token");
  let response = await upload(token);

  if (response.status === 401) {
    token = await refreshAccessToken();
    if (token) {
      response = await upload(token);
    }
  }

  const json = await response.json();

  if (response.status === 401) {
    localStorage.removeItem("access_token");
    localStorage.removeItem("refresh_token");
    throw new Error("unauthenticated");
  }

  if (!response.ok || !json.success) {
    throw new Error(json.message || "Image upload failed");
  }
  return json.data.url as string;
}
