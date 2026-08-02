import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from "react";
import { addToCart as apiAddToCart, getCart } from "../services/cart";

type CartContextValue = {
  /** Total number of items (sum of quantities) in the cart. */
  itemCount: number;
  /** Call this from ProductCard's Add button. Requires the user to be logged in. */
  addToCart: (variantId: string) => Promise<void>;
  /** Re-fetches cart from the backend. Call when opening the cart overlay. */
  refreshCart: () => Promise<void>;
};

const CartContext = createContext<CartContextValue>({
  itemCount: 0,
  addToCart: async () => {},
  refreshCart: async () => {},
});

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [itemCount, setItemCount] = useState(0);

  const refreshCart = useCallback(async () => {
    const token = localStorage.getItem("access_token");
    if (!token) {
      setItemCount(0);
      return;
    }
    try {
      const items = await getCart();
      const total = items.reduce((sum, item) => sum + item.quantity, 0);
      setItemCount(total);
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
    async (variantId: string) => {
      const token = localStorage.getItem("access_token");
      if (!token) {
        // Signal to callers that auth is needed — they should open AuthModal
        throw new Error("unauthenticated");
      }
      await apiAddToCart({ variant_id: variantId, quantity: 1 });
      await refreshCart();
    },
    [refreshCart],
  );

  return (
    <CartContext.Provider value={{ itemCount, addToCart, refreshCart }}>
      {children}
    </CartContext.Provider>
  );
}

/** Consume cart count and actions in any component. */
// eslint-disable-next-line react-refresh/only-export-components
export function useCart() {
  return useContext(CartContext);
}
