import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { fireEvent, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { CartProvider, useCart } from './CartContext';
import { afterEach, describe, expect, it, beforeEach, vi } from 'vitest';
import { apiFetch } from '../services/api';

vi.mock('../services/api', () => ({ apiFetch: vi.fn() }));

const LOCAL_CART_KEY = 'binzo_local_cart';
const apiFetchMock = vi.mocked(apiFetch);
let serverItems: {
  id: string; variant_id: string; quantity: number;
  product_variants: { price: number; unit: string; products: { name: string } };
}[] = [];

function CartProbe() {
  const cart = useCart();
  return (
    <div>
      <p>Items: {cart.itemCount}</p>
      <p>Total: {cart.totalAmount}</p>
      <button type="button" onClick={() => cart.addToCart('milk-500', 2, {
        name: 'Fresh Milk', unit: '500ml', price: 34, image_url: '/milk.png',
      })}>Add milk</button>
      <button type="button" onClick={() => cart.setVariantQuantity('milk-500', 1)}>Set one</button>
      <button type="button" onClick={() => cart.setVariantQuantity('milk-500', 0)}>Remove milk</button>
      <button type="button" onClick={() => cart.mergeLocalCart()}>Merge local cart</button>
    </div>
  );
}

function renderCart() {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <QueryClientProvider client={queryClient}>
      <CartProvider>
        <CartProbe />
      </CartProvider>
    </QueryClientProvider>,
  );
}

describe('CartProvider local cart', () => {
  beforeEach(() => {
    localStorage.clear();
    sessionStorage.clear();
    serverItems = [];
    apiFetchMock.mockReset().mockImplementation(async (endpoint: string, options?: RequestInit) => {
      if (endpoint === '/cart' && options?.method === 'POST') {
        const input = JSON.parse(String(options.body)) as { variant_id: string; quantity: number };
        const existing = serverItems.find((item) => item.variant_id === input.variant_id);
        if (existing) {
          serverItems = serverItems.map((item) => item.variant_id === input.variant_id
            ? { ...item, quantity: item.quantity + input.quantity }
            : item);
        } else {
          serverItems = [...serverItems, {
            id: 'cart-item-1', variant_id: input.variant_id, quantity: input.quantity,
            product_variants: { price: 34, unit: '500ml', products: { name: 'Fresh Milk' } },
          }];
        }
        return serverItems[serverItems.length - 1] as never;
      }
      if (endpoint.startsWith('/cart/')) {
        const id = endpoint.split('/').at(-1);
        if (options?.method === 'DELETE') serverItems = serverItems.filter((item) => item.id !== id);
        if (options?.method === 'PATCH') {
          const input = JSON.parse(String(options.body)) as { quantity: number };
          serverItems = serverItems.map((item) => item.id === id ? { ...item, quantity: input.quantity } : item);
        }
        return null as never;
      }
      if (endpoint === '/cart') return serverItems as never;
      return [] as never;
    });
  });

  afterEach(() => vi.unstubAllGlobals());

  it('adds items, updates quantity and totals, and persists changes locally', () => {
    renderCart();

    fireEvent.click(screen.getByRole('button', { name: 'Add milk' }));
    expect(screen.getByText('Items: 2')).toBeInTheDocument();
    expect(screen.getByText('Total: 68')).toBeInTheDocument();
    expect(JSON.parse(localStorage.getItem(LOCAL_CART_KEY) ?? '[]')).toHaveLength(1);

    fireEvent.click(screen.getByRole('button', { name: 'Set one' }));
    expect(screen.getByText('Items: 1')).toBeInTheDocument();
    expect(screen.getByText('Total: 34')).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'Remove milk' }));
    expect(screen.getByText('Items: 0')).toBeInTheDocument();
    expect(JSON.parse(localStorage.getItem(LOCAL_CART_KEY) ?? '[]')).toEqual([]);
  });

  it('restores saved local cart rows on mount', () => {
    localStorage.setItem(LOCAL_CART_KEY, JSON.stringify([{
      id: 'local-milk-500', variant_id: 'milk-500', quantity: 3,
      product_variants: { price: '34', products: { name: 'Fresh Milk' } },
    }]));

    renderCart();

    expect(screen.getByText('Items: 3')).toBeInTheDocument();
    expect(screen.getByText('Total: 102')).toBeInTheDocument();
  });

  it('loads a signed-in cart and persists quantity changes through the API', async () => {
    const user = userEvent.setup();
    localStorage.setItem('access_token', 'access-token');
    serverItems = [{
      id: 'cart-item-1', variant_id: 'milk-500', quantity: 1,
      product_variants: { price: 34, unit: '500ml', products: { name: 'Fresh Milk' } },
    }];
    renderCart();
    expect(await screen.findByText('Items: 1')).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Set one' }));
    expect(apiFetchMock).toHaveBeenCalledWith('/cart/cart-item-1', {
      method: 'PATCH', body: JSON.stringify({ quantity: 1 }),
    });
  });

  it('merges a persisted local cart after login and removes the local copy', async () => {
    const user = userEvent.setup();
    localStorage.setItem('access_token', 'access-token');
    localStorage.setItem(LOCAL_CART_KEY, JSON.stringify([{
      id: 'local-milk-500', variant_id: 'milk-500', quantity: 2,
      product_variants: { price: 34, unit: '500ml', products: { name: 'Fresh Milk' } },
    }]));
    renderCart();

    expect(await screen.findByText('Items: 0')).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Merge local cart' }));
    expect(apiFetchMock).toHaveBeenCalledWith('/cart', {
      method: 'POST', body: JSON.stringify({ variant_id: 'milk-500', quantity: 2 }),
    });
    expect(await screen.findByText('Items: 2')).toBeInTheDocument();
    expect(localStorage.getItem(LOCAL_CART_KEY)).toBeNull();
  });
});
