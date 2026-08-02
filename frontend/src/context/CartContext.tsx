import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from "react";
import {
  addToCart as apiAddToCart,
  getCart,
  removeCartItem,
  updateCartItemQuantity,
  type CartItem,
} from "../services/cart";

type CartContextValue = {
  /** Total number of items (sum of quantities) in the cart. */
  itemCount: number;
  /** Cart subtotal based on item quantities and variant prices. */
  totalAmount: number;
  /** Current cart rows, including product and variant details. */
  items: CartItem[];
  /** Call this from product UI. Requires the user to be logged in. */
  addToCart: (variantId: string, quantity?: number) => Promise<void>;
  /** Sets quantity for an existing variant, or removes it at zero. */
  setVariantQuantity: (variantId: string, quantity: number) => Promise<void>;
  /** Returns the quantity currently in cart for a variant. */
  getVariantQuantity: (variantId: string) => number;
  /** Re-fetches cart from the backend. Call when opening the cart overlay. */
  refreshCart: () => Promise<void>;
};

const CartContext = createContext<CartContextValue>({
  itemCount: 0,
  totalAmount: 0,
  items: [],
  addToCart: async () => {},
  setVariantQuantity: async () => {},
  getVariantQuantity: () => 0,
  refreshCart: async () => {},
});

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([]);

  const itemCount = items.reduce((sum, item) => sum + item.quantity, 0);
  const totalAmount = items.reduce((sum, item) => {
    const price = Number(item.product_variants?.price ?? 0);
    return sum + price * item.quantity;
  }, 0);

  const refreshCart = useCallback(async () => {
    const token = localStorage.getItem("access_token");
    if (!token) {
      setItems([]);
      return;
    }
    try {
      const nextItems = await getCart();
      setItems(nextItems);
    } catch {
      // Silently ignore — user may not be logged in
    }
  }, []);

  // Load count on mount (e.g. after page refresh)
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    refreshCart();
  }, [refreshCart]);

  const addToCart = useCallback(
    async (variantId: string, quantity = 1) => {
      const token = localStorage.getItem("access_token");
      if (!token) {
        // Signal to callers that auth is needed — they should open AuthModal
        throw new Error("unauthenticated");
      }
      await apiAddToCart({ variant_id: variantId, quantity });
      await refreshCart();
    },
    [refreshCart],
  );

  const setVariantQuantity = useCallback(
    async (variantId: string, quantity: number) => {
      const token = localStorage.getItem("access_token");
      if (!token) {
        throw new Error("unauthenticated");
      }

      const existingItem = items.find((item) => item.variant_id === variantId);
      if (!existingItem) {
        if (quantity > 0) {
          await apiAddToCart({ variant_id: variantId, quantity });
        }
        await refreshCart();
        return;
      }

      if (quantity <= 0) {
        await removeCartItem(existingItem.id);
      } else {
        await updateCartItemQuantity(existingItem.id, quantity);
      }
      await refreshCart();
    },
    [items, refreshCart],
  );

  const getVariantQuantity = useCallback(
    (variantId: string) =>
      items.find((item) => item.variant_id === variantId)?.quantity ?? 0,
    [items],
  );

  return (
    <CartContext.Provider
      value={{
        itemCount,
        totalAmount,
        items,
        addToCart,
        setVariantQuantity,
        getVariantQuantity,
        refreshCart,
      }}
    >
      {children}
    </CartContext.Provider>
  );
}

/** Consume cart count and actions in any component. */
// eslint-disable-next-line react-refresh/only-export-components
export function useCart() {
  return useContext(CartContext);
}
