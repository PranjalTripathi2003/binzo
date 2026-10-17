import { fireEvent, render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { useProductsQuery } from '../../services/catalog';
import type { Category } from '../../services/catalog';
import CategoryProductsModal from './CategoryProductsModal';

vi.mock('../../services/catalog', () => ({ useProductsQuery: vi.fn() }));

const useProductsQueryMock = vi.mocked(useProductsQuery);
const onClose = vi.fn();
const category: Category = { id: 'dairy', title: 'Dairy', image: '/dairy.png' };

describe('CategoryProductsModal', () => {
  beforeEach(() => {
    useProductsQueryMock.mockReset();
    onClose.mockReset();
    document.body.style.overflow = '';
  });

  it('shows loading, empty, and error query states', () => {
    useProductsQueryMock.mockReturnValue({ isPending: true } as never);
    const { rerender } = render(<CategoryProductsModal category={category} onClose={onClose} />);
    expect(screen.getByText('Loading products…')).toBeInTheDocument();

    useProductsQueryMock.mockReturnValue({ isPending: false, isError: false, data: [] } as never);
    rerender(<CategoryProductsModal category={category} onClose={onClose} />);
    expect(screen.getByText('No products in this category yet.')).toBeInTheDocument();

    useProductsQueryMock.mockReturnValue({ isPending: false, isError: true, data: undefined } as never);
    rerender(<CategoryProductsModal category={category} onClose={onClose} />);
    expect(screen.getByRole('alert')).toHaveTextContent('Products could not be loaded');
  });

  it('dismisses on Escape, locks body scrolling, and restores focus and scrolling', () => {
    const opener = document.createElement('button');
    document.body.append(opener);
    opener.focus();
    useProductsQueryMock.mockReturnValue({ isPending: true } as never);
    const { unmount } = render(<CategoryProductsModal category={category} onClose={onClose} />);

    expect(document.body.style.overflow).toBe('hidden');
    fireEvent.keyDown(window, { key: 'Escape' });
    expect(onClose).toHaveBeenCalledOnce();
    unmount();
    expect(document.body.style.overflow).toBe('');
    expect(document.activeElement).toBe(opener);
    opener.remove();
  });

  it('closes from the close button or backdrop, but not from a click inside the panel', () => {
    useProductsQueryMock.mockReturnValue({ isPending: true } as never);
    const { container } = render(<CategoryProductsModal category={category} onClose={onClose} />);
    fireEvent.mouseDown(screen.getByRole('dialog', { name: 'Dairy' }));
    expect(onClose).not.toHaveBeenCalled();
    fireEvent.mouseDown(container.firstElementChild!);
    expect(onClose).toHaveBeenCalledOnce();
    fireEvent.click(screen.getByRole('button', { name: 'Close category products' }));
    expect(onClose).toHaveBeenCalledTimes(2);
  });
});
