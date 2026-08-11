import { apiFetch } from "./api";

/**
 * Learning task: connect OrdersPage and checkout.
 *
 * Files to use with this service:
 * - pages/OrdersPage.tsx: replace mock orders with getOrders().
 * - components/Navbar/Navbar.tsx: call createOrder() from the Pay Now button.
 *
 * Backend endpoints:
 * - GET /api/orders
 * - POST /api/orders
 */

export type Order = {
  id: string;
  status: string;
  total_amount: number | string;
  created_at: string;
  delivery_eta_minutes?: number | string | null;
  addresses?: {
    label: string;
    address: string;
  } | null;
  order_items?: {
    id: string;
    quantity: number;
    product_variants?: {
      image_url?: string | null;
      products?: {
        name?: string;
      };
    };
  }[];
};

/**
 * TODO: Use this in OrdersPage.
 *
 * Steps:
 * 1. Add useEffect/useState to OrdersPage.
 * 2. Call getOrders() after the component mounts.
 * 3. Map backend fields into the existing order card UI.
 * 4. Show a helpful empty state when the user has no orders.
 */
export async function getOrders(): Promise<Order[]> {
  return apiFetch<Order[]>("/orders");
}

/**
 * TODO: Use this from Navbar's Pay Now button after cart is loaded.
 *
 * address_id is optional in the current backend, so you can start with an empty
 * object and add address selection later.
 */
export async function createOrder(
  input: { address_id?: string; delivery_eta_minutes?: number } = {},
) {
  return apiFetch<Order>("/orders", {
    method: "POST",
    body: JSON.stringify(input),
  });
}

/**
 * GET /api/orders/:id
 *
 * Retrieves a single order owned by the authenticated user.
 */
export async function getOrder(id: string): Promise<Order> {
  return apiFetch<Order>(`/orders/${id}`);
}

/**
 * PATCH /api/orders/:id/cancel
 *
 * Cancels an active order. The backend rejects the request if the order is
 * already delivered or cancelled.
 */
export async function cancelOrder(id: string): Promise<Order> {
  return apiFetch<Order>(`/orders/${id}/cancel`, { method: "PATCH" });
}

/**
 * PATCH /api/orders/:id/status
 *
 * Updates the order status directly. Used to mark an order as "success" once
 * the delivery animation completes on the frontend.
 */
export async function updateOrderStatus(
  id: string,
  status: string
): Promise<Order> {
  return apiFetch<Order>(`/orders/${id}/status`, {
    method: "PATCH",
    body: JSON.stringify({ status }),
  });
}
