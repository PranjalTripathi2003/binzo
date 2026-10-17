import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, screen } from '@testing-library/react';
import { userEvent } from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { apiFetch } from '../services/api';
import HomePage from './HomePage';

vi.mock('../services/api', () => ({ apiFetch: vi.fn() }));
vi.mock('../components/Navbar/Navbar', () => ({ default: () => <nav>Binzo navigation</nav> }));

const apiFetchMock = vi.mocked(apiFetch);
const categories = [
  { id: 'dairy', name: 'Dairy, Bread & Eggs' },
  { id: 'snacks', name: 'Snacks & Munchies' },
];
const products = [
  {
    id: 'milk',
    category_id: 'dairy',
    name: 'Fresh Milk',
    product_variants: [{ id: 'milk-500', unit: '500ml', price: 34 }],
  },
];

function renderHomePage() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false, gcTime: 0 } },
  });
  return render(
    <MemoryRouter>
      <QueryClientProvider client={queryClient}>
        <HomePage />
      </QueryClientProvider>
    </MemoryRouter>,
  );
}

describe('HomePage catalog integration', () => {
  beforeEach(() => apiFetchMock.mockReset());

  it('shows a loading state and then renders products returned by catalog queries', async () => {
    apiFetchMock.mockImplementation(async (endpoint: string) => {
      if (endpoint === '/categories') return categories as never;
      return products as never;
    });

    renderHomePage();

    expect(screen.getByText('Loading product catalog...')).toBeInTheDocument();
    expect(await screen.findByText('Fresh Milk')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Dairy, Bread & Eggs/ })).toBeInTheDocument();
    expect(apiFetchMock).toHaveBeenCalledWith('/categories');
    expect(apiFetchMock).toHaveBeenCalledWith('/products');
  });

  it('opens a category product dialog and loads that category through its query', async () => {
    const user = userEvent.setup();
    apiFetchMock.mockImplementation(async (endpoint: string) => {
      if (endpoint === '/categories') return categories as never;
      if (endpoint === '/products?categoryId=dairy') return products as never;
      return products as never;
    });

    renderHomePage();
    await screen.findByText('Fresh Milk');
    await user.click(screen.getByRole('button', { name: /Dairy, Bread & Eggs/ }));

    expect(await screen.findByRole('dialog', { name: 'Dairy, Bread & Eggs' }))
      .toBeInTheDocument();
    expect(apiFetchMock).toHaveBeenCalledWith('/products?categoryId=dairy');
  });
});
