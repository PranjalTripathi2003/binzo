import { apiFetch } from "./api";

/**
 * Learning task: connect product cards and the Navbar cart overlay.
 *
 * Files to use with this service:
 * - components/ProductCard/ProductCard.tsx: call addToCart() from the Add button.
 * - components/Navbar/Navbar.tsx: call getCart() when opening the cart overlay.
 *
 * Backend endpoints:
 * - GET /api/cart
 * - POST /api/cart
 * - PATCH /api/cart/:id
 * - DELETE /api/cart/:id
 * - DELETE /api/cart
 */

export type CartItem = {
  id: string;
  variant_id: string;
  quantity: number;
  product_variants?: {
    unit?: string;
    price?: number | string;
    image_url?: string | null;
    product_variant_images?: {
      image_url?: string | null;
    }[];
    products?: {
      name?: string;
    };
  };
};

export type AddToCartInput = {
  variant_id: string;
  quantity: number;
};

/**
 * TODO: Use this in Navbar when the user opens "My Cart".
 *
 * Steps:
 * 1. Check that localStorage has access_token.
 * 2. Call getCart().
 * 3. Replace the placeholder cart item and bill totals with the returned data.
 */
export async function getCart(): Promise<CartItem[]> {
  return apiFetch<CartItem[]>("/cart");
}

/**
 * TODO: Use this in ProductCard's Add button.
 *
 * ProductCard currently receives productId, not variant_id. Your first step is
 * to pass the first unit/variant id from ProductSection into ProductCard.
 */
export async function addToCart(input: AddToCartInput): Promise<CartItem> {
  return apiFetch<CartItem>("/cart", {
    method: "POST",
    body: JSON.stringify(input),
  });
}

/**
 * TODO: Use this for + and - buttons inside the Navbar cart overlay.
 */
export async function updateCartItemQuantity(
  cartItemId: string,
  quantity: number,
): Promise<CartItem> {
  return apiFetch<CartItem>(`/cart/${cartItemId}`, {
    method: "PATCH",
    body: JSON.stringify({ quantity }),
  });
}

/**
 * TODO: Use this for a remove item button in the cart overlay.
 */
export async function removeCartItem(
  cartItemId: string,
): Promise<{ success: true; message: string }> {
  return apiFetch<{ success: true; message: string }>(`/cart/${cartItemId}`, {
    method: "DELETE",
  });
}
