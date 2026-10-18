import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { apiFetch } from '../services/api';
import { getCurrentUser } from '../services/auth';
import AdminPage from './AdminPage';

vi.mock('../services/api', () => ({ apiFetch: vi.fn() }));
vi.mock('../services/auth', () => ({ getCurrentUser: vi.fn() }));

const apiFetchMock = vi.mocked(apiFetch);
const getCurrentUserMock = vi.mocked(getCurrentUser);
const categories = [{
  id: 'dairy', name: 'Dairy', slug: 'dairy', created_at: '2026-10-17T10:00:00.000Z',
}];
const products = [{
  id: 'milk', category_id: 'dairy', name: 'Fresh Milk', brand: 'Binzo Farms',
  created_at: '2026-10-17T10:00:00.000Z', updated_at: '2026-10-17T10:00:00.000Z',
  product_variants: [{ id: 'milk-500', product_id: 'milk', unit: '500ml', price: 34, stock: 3 }],
}];

function renderAdminPage() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false, gcTime: 0 } },
  });
  return render(
    <MemoryRouter initialEntries={['/admin']}>
      <QueryClientProvider client={queryClient}>
        <Routes>
          <Route path="/admin" element={<AdminPage />} />
          <Route path="/" element={<p>Store home</p>} />
        </Routes>
      </QueryClientProvider>
    </MemoryRouter>,
  );
}

describe('AdminPage integration', () => {
  beforeEach(() => {
    localStorage.clear();
    localStorage.setItem('access_token', 'admin-token');
    getCurrentUserMock.mockReset().mockResolvedValue({
      email: 'admin@example.com', name: 'Binzo Admin', role: 'admin',
    });
    apiFetchMock.mockReset().mockImplementation(async (endpoint: string, options?: RequestInit) => {
      if (endpoint === '/categories' && options?.method === 'POST') {
        const input = JSON.parse(String(options.body)) as { name: string; slug: string };
        return { id: 'bakery', ...input, created_at: '2026-10-17T10:00:00.000Z' } as never;
      }
      if (endpoint === '/products' && options?.method === 'POST') {
        const input = JSON.parse(String(options.body)) as { name: string; category_id: string; variants: { unit: string; price: number; stock: number }[] };
        return {
          ...products[0], id: 'new-product', name: input.name, category_id: input.category_id,
          product_variants: input.variants.map((variant, index) => ({
            ...variant, id: `new-variant-${index}`, product_id: 'new-product',
          })),
        } as never;
      }
      if (endpoint === '/products/milk' && options?.method === 'PATCH') {
        const input = JSON.parse(String(options.body)) as { name?: string };
        return { ...products[0], ...input } as never;
      }
      if (endpoint === '/categories') return categories as never;
      if (endpoint === '/products') return products as never;
      return null as never;
    });
  });

  it('requires a signed-in user and sends unauthenticated admins back to the store', async () => {
    localStorage.clear();
    renderAdminPage();
    expect(await screen.findByText('Store home')).toBeInTheDocument();
    expect(getCurrentUserMock).not.toHaveBeenCalled();
  });

  it('sends authenticated non-admin users back to the store', async () => {
    getCurrentUserMock.mockResolvedValue({ email: 'customer@example.com', role: 'customer' });
    renderAdminPage();

    expect(await screen.findByText('Store home')).toBeInTheDocument();
  });

  it('loads dashboard data and filters products by search text', async () => {
    const user = userEvent.setup();
    renderAdminPage();

    expect(await screen.findByText(/Welcome back, Binzo Admin/)).toBeInTheDocument();
    await waitFor(() => expect(screen.getAllByText('1').length).toBeGreaterThan(0));
    await user.click(screen.getByRole('button', { name: 'Products' }));
    expect(await screen.findByText('Fresh Milk')).toBeInTheDocument();

    await user.type(screen.getByRole('searchbox', { name: 'Search products' }), 'oat');
    expect(screen.getByText('No products match your search.')).toBeInTheDocument();
    await user.clear(screen.getByRole('searchbox', { name: 'Search products' }));
    expect(screen.getByText('Fresh Milk')).toBeInTheDocument();
  });

  it('creates a category and updates the visible query-backed category list', async () => {
    const user = userEvent.setup();
    renderAdminPage();
    await screen.findByText(/Welcome back, Binzo Admin/);
    await user.click(screen.getByRole('button', { name: 'Categories' }));
    await screen.findByText('Dairy');
    await user.type(screen.getByLabelText('Category Name'), 'Bakery & Biscuits');
    expect(screen.getByLabelText('Slug')).toHaveValue('bakery-biscuits');
    await user.click(screen.getByRole('button', { name: 'Create Category' }));

    expect(await screen.findByText('Bakery & Biscuits')).toBeInTheDocument();
    await waitFor(() => expect(apiFetchMock).toHaveBeenCalledWith('/categories', {
      method: 'POST', body: JSON.stringify({ name: 'Bakery & Biscuits', slug: 'bakery-biscuits' }),
    }));
  });

  it('validates required product fields before sending a create request', async () => {
    const user = userEvent.setup();
    renderAdminPage();
    await screen.findByText(/Welcome back, Binzo Admin/);
    await user.click(screen.getAllByRole('button', { name: 'Add Product' })[0]);
    fireEvent.submit(screen.getByRole('button', { name: 'Save Product' }).closest('form')!);

    expect(await screen.findByRole('alert')).toHaveTextContent('Name, category, and at least one variant are required.');
    expect(apiFetchMock).not.toHaveBeenCalledWith('/products', expect.objectContaining({ method: 'POST' }));
  });

  it('creates a product with its first variant and shows it in the updated product list', async () => {
    const user = userEvent.setup();
    renderAdminPage();
    await screen.findByText(/Welcome back, Binzo Admin/);
    await user.click(screen.getAllByRole('button', { name: 'Add Product' })[0]);
    await user.type(screen.getByLabelText(/Product Name/), 'Oat Milk');
    await user.selectOptions(screen.getByLabelText(/Category/), 'dairy');
    await user.type(screen.getByLabelText(/Unit/), '1L');
    await user.type(screen.getByLabelText(/Price/), '72');
    await user.click(screen.getByRole('button', { name: 'Save Product' }));

    expect(await screen.findByText('Oat Milk')).toBeInTheDocument();
    expect(apiFetchMock).toHaveBeenCalledWith('/products', expect.objectContaining({ method: 'POST' }));
  });

  it('updates and deletes products from the query-backed product list', async () => {
    const user = userEvent.setup();
    const confirmSpy = vi.spyOn(window, 'confirm').mockReturnValue(true);
    renderAdminPage();
    await screen.findByText(/Welcome back, Binzo Admin/);
    await user.click(screen.getByRole('button', { name: 'Products' }));
    await screen.findByText('Fresh Milk');

    await user.click(screen.getByRole('button', { name: 'Edit product Fresh Milk' }));
    const nameInput = screen.getByLabelText(/Product Name/);
    await user.clear(nameInput);
    await user.type(nameInput, 'Updated Milk');
    await user.click(screen.getByRole('button', { name: 'Update Product' }));
    expect(await screen.findByText('Updated Milk')).toBeInTheDocument();
    expect(apiFetchMock).toHaveBeenCalledWith('/products/milk', expect.objectContaining({ method: 'PATCH' }));

    await user.click(screen.getByRole('button', { name: 'Delete product Updated Milk' }));
    await waitFor(() => expect(screen.queryByText('Updated Milk')).not.toBeInTheDocument());
    expect(confirmSpy).toHaveBeenCalledWith('Delete product "Updated Milk"?');
    expect(apiFetchMock).toHaveBeenCalledWith('/products/milk', { method: 'DELETE' });
  });
});
