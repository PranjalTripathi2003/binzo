import { beforeEach, describe, expect, it, vi } from 'vitest';
import { apiFetch } from './api';
import { getProducts } from './catalog';

vi.mock('./api', () => ({ apiFetch: vi.fn() }));

const apiFetchMock = vi.mocked(apiFetch);

describe('catalog service', () => {
  beforeEach(() => apiFetchMock.mockReset());

  it('maps variants and sorts variant gallery images by position', async () => {
    apiFetchMock.mockResolvedValueOnce([
      {
        id: 'product-1',
        category_id: 'dairy',
        name: 'Fresh Milk',
        product_variants: [
          {
            id: 'variant-1',
            unit: '500ml',
            price: '34.50',
            product_variant_images: [
              { image_url: '/images/second.png', position: 2 },
              { image_url: '/images/first.png', position: 1 },
            ],
          },
        ],
      },
    ]);

    await expect(getProducts()).resolves.toEqual([
      {
        id: 'product-1',
        categoryId: 'dairy',
        title: 'Fresh Milk',
        description: undefined,
        image: '/images/first.png',
        images: ['/images/first.png', '/images/second.png'],
        units: [
          {
            id: 'variant-1',
            label: 'Unit 1',
            size: '500ml',
            price: 34.5,
            images: ['/images/first.png', '/images/second.png'],
          },
        ],
      },
    ]);
  });

  it('encodes category and trimmed search parameters and omits products without variants', async () => {
    apiFetchMock.mockResolvedValueOnce([
      {
        id: 'without-variants',
        category_id: 'dairy',
        name: 'Unavailable product',
        product_variants: [],
      },
      {
        id: 'with-variant',
        category_id: 'dairy',
        name: 'Milk',
        product_variants: [{ id: 'v1', unit: '1L', price: 60 }],
      },
    ]);

    const products = await getProducts('dairy & eggs', '  whole milk  ');

    expect(apiFetchMock).toHaveBeenCalledWith(
      '/products?categoryId=dairy%20%26%20eggs&search=whole%20milk',
    );
    expect(products.map((product) => product.id)).toEqual(['with-variant']);
  });
});
