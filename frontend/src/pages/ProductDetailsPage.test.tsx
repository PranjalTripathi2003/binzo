import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { Product } from '../data/products';
import { useCart } from '../context/CartContext';
import { useProductQuery } from '../services/catalog';
import ProductDetailsPage from './ProductDetailsPage';

vi.mock('../components/Navbar/Navbar', () => ({ default: () => <nav>Navigation</nav> }));
vi.mock('../context/CartContext', () => ({ useCart: vi.fn() }));
vi.mock('../services/catalog', () => ({ useProductQuery: vi.fn() }));

const product: Product = {
  id: 'milk',
  categoryId: 'dairy',
  title: 'Fresh Milk',
  description: 'Creamy milk',
  image: '/milk.png',
  images: ['/milk.png', '/milk-back.png'],
  units: [
    { id: '500ml', label: 'Unit 1', size: '500ml', price: 34, images: ['/milk.png', '/milk-back.png'] },
    { id: '1l', label: 'Unit 2', size: '1L', price: 62, images: ['/milk-1l.png'] },
  ],
};
const useProductQueryMock = vi.mocked(useProductQuery);
const useCartMock = vi.mocked(useCart);
const addToCart = vi.fn();
const setVariantQuantity = vi.fn();
const getVariantQuantity = vi.fn(() => 0);

function renderProductPage() {
  return render(
    <MemoryRouter initialEntries={['/product/milk']}>
      <Routes>
        <Route path="/product/:id" element={<ProductDetailsPage />} />
      </Routes>
    </MemoryRouter>,
  );
}

describe('ProductDetailsPage integration', () => {
  beforeEach(() => {
    useProductQueryMock.mockReset();
    addToCart.mockReset();
    setVariantQuantity.mockReset();
    getVariantQuantity.mockReset().mockReturnValue(0);
    useCartMock.mockReturnValue({
      addToCart,
      setVariantQuantity,
      getVariantQuantity,
    } as never);
  });

  it('shows a loading state while the product query is pending', () => {
    useProductQueryMock.mockReturnValue({ isPending: true } as never);
    renderProductPage();
    expect(screen.getByText('Loading product...')).toBeInTheDocument();
  });

  it('shows a not-found message when the requested product is unavailable', () => {
    useProductQueryMock.mockReturnValue({ isPending: false, isError: false } as never);
    renderProductPage();
    expect(screen.getByText('Product not found')).toBeInTheDocument();
  });

  it('updates the selected unit and adds that variant to the cart', async () => {
    useProductQueryMock.mockReturnValue({ data: product, isPending: false, isError: false } as never);
    renderProductPage();

    fireEvent.click(screen.getByRole('radio', { name: /Unit 21L/ }));
    expect(screen.getByText('₹62')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Add to Cart' }));

    expect(addToCart).toHaveBeenCalledWith('1l', 1, {
      name: 'Fresh Milk', unit: '1L', price: 62, image_url: '/milk-1l.png',
    });
  });

  it('changes the main image when a gallery thumbnail is selected', () => {
    useProductQueryMock.mockReturnValue({ data: product, isPending: false, isError: false } as never);
    renderProductPage();

    expect(screen.getByRole('img', { name: 'Fresh Milk' })).toHaveAttribute('src', '/milk.png');
    fireEvent.click(screen.getByRole('button', { name: 'View image 2' }));
    expect(screen.getByRole('img', { name: 'Fresh Milk' })).toHaveAttribute('src', '/milk-back.png');
  });

  it('increments the active cart variant and never decrements below zero', async () => {
    useProductQueryMock.mockReturnValue({ data: product, isPending: false, isError: false } as never);
    getVariantQuantity.mockReturnValue(1);
    renderProductPage();

    fireEvent.click(screen.getByRole('button', { name: 'Decrease quantity' }));
    await waitFor(() => expect(setVariantQuantity).toHaveBeenCalledWith('500ml', 0));
  });
});
