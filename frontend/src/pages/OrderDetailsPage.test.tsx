import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { cancelOrder, updateOrderStatus, useOrderQuery, type Order } from '../services/orders';
import OrderDetailsPage from './OrderDetailsPage';

vi.mock('../services/orders', () => ({
  cancelOrder: vi.fn(),
  updateOrderStatus: vi.fn(),
  useOrderQuery: vi.fn(),
  orderQueryKeys: {
    all: ['orders'], lists: () => ['orders', 'list'], detail: (id: string) => ['orders', 'detail', id],
  },
}));
vi.mock('leaflet', () => ({ default: { divIcon: vi.fn(() => ({})) } }));
vi.mock('react-leaflet', () => ({
  MapContainer: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  TileLayer: () => <div />, Marker: () => <div />, Polyline: () => <div />,
  useMap: () => ({ setView: vi.fn() }),
}));

const useOrderQueryMock = vi.mocked(useOrderQuery);
const cancelOrderMock = vi.mocked(cancelOrder);
const updateOrderStatusMock = vi.mocked(updateOrderStatus);
const currentOrder: Order = {
  id: 'order-12345678', status: 'pending', total_amount: 68,
  created_at: new Date().toISOString(), delivery_eta_minutes: 15,
  addresses: { label: 'Home', address: '10 Market Road' },
  order_items: [{
    id: 'item-1', quantity: 2,
    product_variants: { products: { name: 'Fresh Milk' } },
  }],
};

function renderOrderDetails(
  order = currentOrder,
  queryResult: { data?: Order; isPending: boolean; isError: boolean } = {
    data: order, isPending: false, isError: false,
  },
) {
  useOrderQueryMock.mockReturnValue(queryResult as never);
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  queryClient.setQueryData(['orders', 'detail', order.id], order);
  return render(
    <MemoryRouter initialEntries={[`/order/${order.id}`]}>
      <QueryClientProvider client={queryClient}>
        <Routes><Route path="/order/:id" element={<OrderDetailsPage />} /></Routes>
      </QueryClientProvider>
    </MemoryRouter>,
  );
}

describe('OrderDetailsPage integration', () => {
  beforeEach(() => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: true, json: async () => [] }));
    cancelOrderMock.mockReset().mockResolvedValue(currentOrder);
    updateOrderStatusMock.mockReset().mockResolvedValue(currentOrder);
  });

  afterEach(() => vi.unstubAllGlobals());

  it('renders order items, address, delivery status, and selectable tip totals', async () => {
    const user = userEvent.setup();
    renderOrderDetails();

    expect(screen.getByRole('heading', { name: 'Order #ORDER-12' })).toBeInTheDocument();
    expect(screen.getByText('Fresh Milk')).toBeInTheDocument();
    expect(screen.getByText('10 Market Road')).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: '₹20' }));
    expect(screen.getByText('₹98')).toBeInTheDocument();
  });

  it('confirms cancellation and updates the order cache through the cancel service', async () => {
    const user = userEvent.setup();
    renderOrderDetails();

    await user.click(screen.getByRole('button', { name: 'Cancel Order' }));
    expect(screen.getByRole('dialog', { name: 'Cancel this order?' })).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Yes, Cancel' }));

    await waitFor(() => expect(cancelOrderMock).toHaveBeenCalledWith(currentOrder.id));
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('does not offer cancellation after an order is packed', () => {
    renderOrderDetails({ ...currentOrder, status: 'packed' });
    expect(screen.getByRole('button', { name: 'Cancellation unavailable' })).toBeDisabled();
  });

  it('shows loading and not-found states for pending and failed order queries', () => {
    const { rerender } = renderOrderDetails(currentOrder, { isPending: true, isError: false });
    expect(screen.getByText('Locating delivery partner...')).toBeInTheDocument();

    useOrderQueryMock.mockReturnValue({ isPending: false, isError: true } as never);
    rerender(
      <MemoryRouter initialEntries={[`/order/${currentOrder.id}`]}>
        <QueryClientProvider client={new QueryClient()}>
          <Routes><Route path="/order/:id" element={<OrderDetailsPage />} /></Routes>
        </QueryClientProvider>
      </MemoryRouter>,
    );
    expect(screen.getByText('Order Not Found')).toBeInTheDocument();
  });

  it('keeps the cancellation confirmation open and reports API failure', async () => {
    const user = userEvent.setup();
    cancelOrderMock.mockRejectedValueOnce(new Error('Unable to cancel order'));
    renderOrderDetails();
    await user.click(screen.getByRole('button', { name: 'Cancel Order' }));
    await user.click(screen.getByRole('button', { name: 'Yes, Cancel' }));

    expect(await screen.findByText('Unable to cancel order')).toBeInTheDocument();
    expect(screen.getByRole('dialog', { name: 'Cancel this order?' })).toBeInTheDocument();
  });
});
