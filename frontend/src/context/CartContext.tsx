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
  /** Call this from product UI. */
  addToCart: (
    variantId: string,
    quantity?: number,
    productDetails?: {
      name: string;
      unit: string;
      price: number;
      image_url: string;
    },
  ) => Promise<void>;
  /** Sets quantity for an existing variant, or removes it at zero. */
  setVariantQuantity: (variantId: string, quantity: number) => Promise<void>;
  /** Returns the quantity currently in cart for a variant. */
  getVariantQuantity: (variantId: string) => number;
  /** Re-fetches cart from the backend. Call when opening the cart overlay. */
  refreshCart: () => Promise<void>;
  /** Merge local cart items into backend cart after login/signup. */
  mergeLocalCart: () => Promise<void>;
};

const LOCAL_CART_KEY = "binzo_local_cart";

const CartContext = createContext<CartContextValue>({
  itemCount: 0,
  totalAmount: 0,
  items: [],
  addToCart: async () => {},
  setVariantQuantity: async () => {},
  getVariantQuantity: () => 0,
  refreshCart: async () => {},
  mergeLocalCart: async () => {},
});

const loadLocalCart = (): CartItem[] => {
  const saved = localStorage.getItem(LOCAL_CART_KEY);
  if (!saved) return [];
  try {
    return JSON.parse(saved) as CartItem[];
  } catch {
    return [];
  }
};

const saveLocalCart = (nextItems: CartItem[]) => {
  localStorage.setItem(LOCAL_CART_KEY, JSON.stringify(nextItems));
};

const createLocalItem = (
  variantId: string,
  quantity: number,
  productDetails: {
    name: string;
    unit: string;
    price: number;
    image_url: string;
  },
): CartItem => ({
  id: `local-${variantId}`,
  variant_id: variantId,
  quantity,
  product_variants: {
    unit: productDetails.unit,
    price: productDetails.price,
    image_url: productDetails.image_url,
    products: { name: productDetails.name },
  },
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
      const localItems = loadLocalCart();
      setItems(localItems);
      return;
    }

    try {
      const nextItems = await getCart();
      setItems(nextItems);
    } catch (error) {
      if (error instanceof Error && error.message === "unauthenticated") {
        localStorage.removeItem("access_token");
        localStorage.removeItem("refresh_token");
      }
      const localItems = loadLocalCart();
      setItems(localItems);
    }
  }, []);

  const mergeLocalCart = useCallback(async () => {
    const token = localStorage.getItem("access_token");
    if (!token) return;

    const localItems = loadLocalCart();
    if (localItems.length === 0) {
      await refreshCart();
      return;
    }

    for (const item of localItems) {
      await apiAddToCart({
        variant_id: item.variant_id,
        quantity: item.quantity,
      });
    }

    localStorage.removeItem(LOCAL_CART_KEY);
    await refreshCart();
  }, [refreshCart]);

  // Load count on mount (e.g. after page refresh)
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    refreshCart();
  }, [refreshCart]);

  const addToCart = useCallback(
    async (
      variantId: string,
      quantity = 1,
      productDetails?: {
        name: string;
        unit: string;
        price: number;
        image_url: string;
      },
    ) => {
      const token = localStorage.getItem("access_token");
      const existingItem = items.find((item) => item.variant_id === variantId);

      if (!token) {
        if (!productDetails) {
          throw new Error(
            "Product details are required for offline cart storage.",
          );
        }

        const nextItems = existingItem
          ? items.map((item) =>
              item.variant_id === variantId
                ? { ...item, quantity: item.quantity + quantity }
                : item,
            )
          : [...items, createLocalItem(variantId, quantity, productDetails)];

        setItems(nextItems);
        saveLocalCart(nextItems);
        return;
      }

      try {
        await apiAddToCart({ variant_id: variantId, quantity });
        await refreshCart();
      } catch (error) {
        if (error instanceof Error && error.message === "unauthenticated") {
          const nextItems = existingItem
            ? items.map((item) =>
                item.variant_id === variantId
                  ? { ...item, quantity: item.quantity + quantity }
                  : item,
              )
            : [...items, createLocalItem(variantId, quantity, productDetails!)];
          setItems(nextItems);
          saveLocalCart(nextItems);
          return;
        }
        throw error;
      }
    },
    [items, refreshCart],
  );

  const setVariantQuantity = useCallback(
    async (variantId: string, quantity: number) => {
      const token = localStorage.getItem("access_token");

      const existingItem = items.find((item) => item.variant_id === variantId);
      if (!token) {
        if (!existingItem) {
          return;
        }

        const nextItems =
          quantity <= 0
            ? items.filter((item) => item.variant_id !== variantId)
            : items.map((item) =>
                item.variant_id === variantId ? { ...item, quantity } : item,
              );

        setItems(nextItems);
        saveLocalCart(nextItems);
        return;
      }

      if (!existingItem) {
        if (quantity > 0) {
          try {
            await apiAddToCart({ variant_id: variantId, quantity });
            await refreshCart();
            return;
          } catch (error) {
            if (error instanceof Error && error.message === "unauthenticated") {
              saveLocalCart(items);
              return;
            }
            throw error;
          }
        }
        return;
      }

      try {
        if (quantity <= 0) {
          await removeCartItem(existingItem.id);
        } else {
          await updateCartItemQuantity(existingItem.id, quantity);
        }
        await refreshCart();
      } catch (error) {
        if (error instanceof Error && error.message === "unauthenticated") {
          const nextItems =
            quantity <= 0
              ? items.filter((item) => item.variant_id !== variantId)
              : items.map((item) =>
                  item.variant_id === variantId ? { ...item, quantity } : item,
                );
          setItems(nextItems);
          saveLocalCart(nextItems);
          return;
        }
        throw error;
      }
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
        mergeLocalCart,
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
