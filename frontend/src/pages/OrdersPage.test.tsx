import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { apiFetch } from '../services/api';
import { getCurrentUser } from '../services/auth';
import OrdersPage from './OrdersPage';

vi.mock('../components/Navbar/Navbar', () => ({ default: () => <nav>Navigation</nav> }));
vi.mock('../components/Navbar/LocationMap', () => ({ default: () => <div>Map</div> }));
vi.mock('../services/api', () => ({ apiFetch: vi.fn() }));
vi.mock('../services/auth', () => ({ getCurrentUser: vi.fn(), logout: vi.fn() }));

const apiFetchMock = vi.mocked(apiFetch);
const getCurrentUserMock = vi.mocked(getCurrentUser);
const sampleOrder = {
  id: 'order-12345678', status: 'cancelled', total_amount: '68',
  created_at: '2026-10-17T10:00:00.000Z', order_items: [],
};

function renderOrdersPage(path = '/orders') {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false, gcTime: 0 } },
  });
  return render(
    <MemoryRouter initialEntries={[path]}>
      <QueryClientProvider client={queryClient}>
        <Routes>
          <Route path="/orders/:section?" element={<OrdersPage />} />
          <Route path="/order/:id" element={<p>Order details route</p>} />
          <Route path="/" element={<p>Home route</p>} />
        </Routes>
      </QueryClientProvider>
    </MemoryRouter>,
  );
}

describe('OrdersPage integration', () => {
  beforeEach(() => {
    localStorage.clear();
    localStorage.setItem('access_token', 'test-token');
    getCurrentUserMock.mockReset().mockResolvedValue({ email: 'shopper@example.com' });
    apiFetchMock.mockReset();
  });

  it('renders the empty orders state for an authenticated customer without orders', async () => {
    apiFetchMock.mockResolvedValue([]);
    renderOrdersPage();

    expect(await screen.findByText('No orders yet')).toBeInTheDocument();
    expect(apiFetchMock).toHaveBeenCalledWith('/orders');
  });

  it('renders order status and navigates to its detail route when selected', async () => {
    apiFetchMock.mockResolvedValue([sampleOrder]);
    renderOrdersPage();

    const status = await screen.findByText('Order Cancelled');
    expect(screen.getByText(/₹68/)).toBeInTheDocument();
    fireEvent.click(status.closest('article')!);
    expect(await screen.findByText('Order details route')).toBeInTheDocument();
  });

  it('loads addresses and removes an address through the service then refreshes the list', async () => {
    let addresses = [{
      id: 'address-1', label: 'Home', address: '10 Market Road', is_default: true,
      created_at: '2026-10-17T10:00:00.000Z',
    }];
    apiFetchMock.mockImplementation(async (endpoint: string, options?: RequestInit) => {
      if (endpoint === '/addresses/address-1' && options?.method === 'DELETE') {
        addresses = [];
        return null as never;
      }
      if (endpoint === '/addresses') return addresses as never;
      return [] as never;
    });
    renderOrdersPage('/orders/addresses');

    expect(await screen.findByText('10 Market Road')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Delete Home address' }));

    await waitFor(() => expect(screen.queryByText('10 Market Road')).not.toBeInTheDocument());
    expect(apiFetchMock).toHaveBeenCalledWith('/addresses/address-1', { method: 'DELETE' });
  });

  it('validates required address details and saves a complete default address', async () => {
    const user = userEvent.setup();
    let addresses: { id: string; label: string; address: string; is_default: boolean; created_at: string }[] = [];
    apiFetchMock.mockImplementation(async (endpoint: string, options?: RequestInit) => {
      if (endpoint === '/addresses' && options?.method === 'POST') {
        const payload = JSON.parse(String(options.body)) as { label: string; address: string; is_default: boolean };
        const newAddress = { id: 'address-new', ...payload, created_at: '2026-10-17T10:00:00.000Z' };
        addresses = [newAddress];
        return newAddress as never;
      }
      if (endpoint === '/addresses') return addresses as never;
      return null as never;
    });
    renderOrdersPage('/orders/addresses');

    await screen.findByText('No saved addresses yet. Add one to get started.');
    await user.click(screen.getByRole('button', { name: 'Add new address' }));
    await user.click(screen.getByRole('button', { name: 'Save Address' }));
    expect(screen.getByText('House/Flat details and Receiver Name are required.')).toBeInTheDocument();

    await user.type(screen.getByPlaceholderText('Flat / House no / Building name *'), '12 Blue Apt');
    await user.type(screen.getByPlaceholderText('Floor (optional)'), '2');
    await user.type(screen.getByPlaceholderText('Nearby landmark (optional)'), 'Park');
    await user.type(screen.getByPlaceholderText('Your name *'), 'Shopper');
    await user.click(screen.getByRole('button', { name: 'Save Address' }));

    expect(await screen.findByText('12 Blue Apt, Floor 2, Locating..., Near Park')).toBeInTheDocument();
    expect(apiFetchMock).toHaveBeenCalledWith('/addresses', {
      method: 'POST',
      body: JSON.stringify({
        label: 'Home', address: '12 Blue Apt, Floor 2, Locating..., Near Park', is_default: true,
      }),
    });
  });
});
