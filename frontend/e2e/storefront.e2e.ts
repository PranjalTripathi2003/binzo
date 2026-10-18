import { expect, test, type Page } from '@playwright/test';

const product = {
  id: 'amul-gold-milk',
  category_id: 'dairy',
  name: 'Amul Gold Milk',
  description: 'Full cream milk, rich in calcium and nutrients.',
  product_variants: [
    { id: 'milk-500ml', unit: '500ml', price: 34, image_url: '/images/milk.png' },
    { id: 'milk-1l', unit: '1L', price: 62, image_url: '/images/milk.png' },
  ],
  product_images: [],
};
const orderId = 'order-12345678';
const order = {
  id: orderId,
  status: 'pending',
  total_amount: 96,
  created_at: new Date().toISOString(),
  delivery_eta_minutes: 15,
  addresses: null,
  order_items: [{
    id: 'item-1',
    quantity: 2,
    price_at_purchase: 48,
    product_variants: { products: { name: 'Amul Gold Milk' } },
  }],
};

async function mockCatalog(page: Page) {
  await page.route('**/api/**', async (route) => {
    const url = new URL(route.request().url());
    let data: unknown = [];

    if (url.pathname.endsWith('/categories') && route.request().method() === 'POST') {
      const payload = route.request().postDataJSON() as { name: string; slug: string };
      data = { id: 'category-created', ...payload, created_at: new Date().toISOString() };
    } else if (url.pathname.endsWith('/categories')) {
      data = [{ id: 'dairy', name: 'Dairy, Bread & Eggs', image_url: '/images/dairy-bread-eggs.png' }];
    } else if (url.pathname.endsWith('/products/amul-gold-milk')) {
      data = product;
    } else if (url.pathname.endsWith('/products')) {
      data = [product];
    } else if (url.pathname.endsWith('/auth/login')) {
      await route.fulfill({
        status: 401,
        contentType: 'application/json',
        body: JSON.stringify({ success: false, message: 'Invalid email or password.' }),
      });
      return;
    } else if (url.pathname.endsWith('/auth/me')) {
      data = {
        id: 'test-user',
        email: 'customer@example.test',
        name: 'Test Customer',
        role: route.request().headers().authorization?.includes('admin') ? 'admin' : 'customer',
      };
    } else if (url.pathname.endsWith('/auth/register')) {
      data = { user: { id: 'test-user', email: 'customer@example.test' }, access_token: 'access-test', refresh_token: 'refresh-test' };
    } else if (url.pathname.endsWith('/auth/logout')) {
      data = null;
    } else if (url.pathname.endsWith(`/orders/${orderId}/cancel`)) {
      data = { ...order, status: 'cancelled' };
    } else if (url.pathname.endsWith(`/orders/${orderId}`)) {
      data = { ...order, created_at: new Date().toISOString(), delivery_eta_minutes: 30 };
    } else {
      await route.fulfill({
        contentType: 'application/json',
        body: JSON.stringify({ success: true, data }),
      });
      return;
    }

    await route.fulfill({
      contentType: 'application/json',
      body: JSON.stringify({ success: true, data }),
    });
  });
}

test.beforeEach(async ({ page }) => {
  await mockCatalog(page);
});

test('home page loads catalog and navigates to a product', async ({ page }) => {
  await page.goto('/');

  await expect(page.getByRole('heading', { name: 'Amul Gold Milk' }).first()).toBeVisible();
  await page.getByRole('link', { name: /Amul Gold Milk/i }).click();
  await expect(page).toHaveURL(/\/product\/amul-gold-milk$/);
  await expect(page.getByRole('heading', { name: 'Amul Gold Milk' }).last()).toBeVisible();
});

test('customer can select a unit, add it to cart, and change cart quantity', async ({ page }) => {
  await page.goto('/product/amul-gold-milk');
  await expect(page.getByRole('heading', { name: 'Amul Gold Milk' })).toBeVisible();

  await page.getByRole('radio', { name: /1L/ }).click();
  await expect(page.getByText('₹62')).toBeVisible();
  await page.getByRole('button', { name: 'Add to Cart' }).click();

  await page.getByRole('button', { name: /1 item/i }).click();
  const cart = page.getByRole('dialog', { name: 'Shopping cart' });
  await expect(cart.getByRole('heading', { name: 'Amul Gold Milk' })).toBeVisible();
  await expect(cart.getByText('1L')).toBeVisible();
  await cart.getByRole('button', { name: 'Increase quantity' }).click();
  await expect(cart.getByText('2', { exact: true })).toBeVisible();
});

test('login displays a useful message when credentials are rejected', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('button', { name: 'Login / Signup' }).click();
  await page.getByPlaceholder('Email').fill('customer@example.com');
  await page.getByPlaceholder('Password').fill('wrong-password');
  await page.getByRole('button', { name: 'Login', exact: true }).click();

  await expect(page.getByRole('alert')).toContainText('Invalid email or password');
});

test('registration creates an account and opens the authenticated account menu', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('button', { name: 'Login / Signup' }).click();
  await page.getByRole('button', { name: 'Register', exact: true }).click();
  await page.getByPlaceholder('Name').fill('Test Customer');
  await page.getByPlaceholder('Email').fill('customer@example.test');
  await page.getByPlaceholder('Phone').fill('9999999999');
  await page.getByPlaceholder('Password').fill('DisposablePassword123!');
  await page.getByRole('button', { name: 'Signup', exact: true }).click();

  await expect(page.getByRole('button', { name: 'Account' })).toBeVisible();
  await page.getByRole('button', { name: 'Account' }).click();
  await expect(page.getByRole('menu').getByText('customer@example.test')).toBeVisible();
});

test('authenticated session survives a reload and can be logged out', async ({ page }) => {
  await page.route('**/api/auth/login', (route) => route.fulfill({
    contentType: 'application/json',
    body: JSON.stringify({
      success: true,
      data: { user: { email: 'customer@example.test' }, access_token: 'access-test', refresh_token: 'refresh-test' },
    }),
  }));
  await page.goto('/');
  await page.getByRole('button', { name: 'Login / Signup' }).click();
  await page.getByPlaceholder('Email').fill('customer@example.test');
  await page.getByPlaceholder('Password').fill('DisposablePassword123!');
  await page.getByRole('button', { name: 'Login', exact: true }).click();
  await expect(page.getByRole('button', { name: 'Account' })).toBeVisible();

  await page.reload();
  await expect(page.getByRole('button', { name: 'Account' })).toBeVisible();
  await page.getByRole('button', { name: 'Account' }).click();
  await page.getByRole('menuitem', { name: 'Log Out' }).click();
  await expect(page.getByRole('button', { name: 'Login / Signup' })).toBeVisible();
});

test('search finds a product and opens its details', async ({ page }) => {
  await page.goto('/');
  await page.getByPlaceholder('Search for Grocery...').fill('Amul');
  await page.getByRole('button', { name: /Amul Gold Milk/ }).click();

  await expect(page).toHaveURL(/\/product\/amul-gold-milk$/);
  await expect(page.getByRole('heading', { name: 'Amul Gold Milk' })).toBeVisible();
});

test('authenticated customer can add and remove a saved address', async ({ page }) => {
  const savedAddresses: { id: string; label: string; address: string; is_default: boolean; created_at: string }[] = [];
  await page.route('**/api/addresses', async (route) => {
    if (route.request().method() === 'POST') {
      const payload = route.request().postDataJSON() as { label: string; address: string; is_default: boolean };
      const created = { ...payload, id: 'address-test', created_at: new Date().toISOString() };
      savedAddresses.push(created);
      await route.fulfill({ contentType: 'application/json', body: JSON.stringify({ success: true, data: created }) });
      return;
    }
    await route.fulfill({ contentType: 'application/json', body: JSON.stringify({ success: true, data: savedAddresses }) });
  });
  await page.route('**/api/addresses/address-test', async (route) => {
    savedAddresses.splice(0, savedAddresses.length);
    await route.fulfill({ contentType: 'application/json', body: JSON.stringify({ success: true, data: null }) });
  });
  await page.addInitScript(() => {
    localStorage.setItem('access_token', 'access-customer');
    localStorage.setItem('refresh_token', 'refresh-customer');
  });
  await page.route('**.tile.openstreetmap.org/**', (route) => route.abort());
  await page.goto('/orders/addresses');
  await expect(page.getByRole('heading', { name: 'Delivery address book' })).toBeVisible();
  await page.getByRole('button', { name: 'Add new address' }).click();
  await page.getByPlaceholder('Search delivery location...').fill('123 Sample Street');
  await page.getByPlaceholder('Flat / House no / Building name *').fill('Apartment 4');
  await page.getByPlaceholder('Your name *').fill('Test Customer');
  await page.getByRole('button', { name: 'Save Address' }).click();

  await expect(page.getByText('Home', { exact: true })).toBeVisible();
  await expect(page.getByText(/Apartment 4, Floor|Apartment 4, 123 Sample Street/)).toBeVisible();
  await page.getByRole('button', { name: 'Delete Home address' }).click();
  await expect(page.getByText('No saved addresses yet. Add one to get started.')).toBeVisible();
});

test('non-admin users cannot open the admin dashboard', async ({ page }) => {
  await page.addInitScript(() => {
    localStorage.setItem('access_token', 'access-customer');
    localStorage.setItem('refresh_token', 'refresh-customer');
  });
  await page.goto('/admin');

  await expect(page).toHaveURL('/');
  await expect(page.getByRole('button', { name: 'Account' })).toBeVisible();
});

test('admin can create a category', async ({ page }) => {
  await page.addInitScript(() => {
    localStorage.setItem('access_token', 'access-admin');
    localStorage.setItem('refresh_token', 'refresh-admin');
  });
  await page.goto('/admin');
  await page.getByRole('button', { name: 'Categories', exact: true }).click();
  await page.getByLabel('Category Name').fill('E2E Pantry');
  await page.getByLabel('Slug').fill('e2e-pantry');
  await page.getByRole('button', { name: 'Create Category' }).click();

  await expect(page.getByRole('cell', { name: 'E2E Pantry', exact: true })).toBeVisible();
  await expect(page.getByRole('cell', { name: 'e2e-pantry', exact: true })).toBeVisible();
});

test('customer can place a cart order through the payment test double', async ({ page }) => {
  let cartItems = [{
    id: 'cart-item-1',
    variant_id: 'milk-500ml',
    quantity: 1,
    product_variants: { unit: '500ml', price: 34, products: { name: 'Amul Gold Milk' } },
  }];
  const deliveryAddress = {
    id: 'address-1', label: 'Home', address: 'Apartment 4, Sample Street',
    is_default: true, created_at: new Date().toISOString(),
  };
  await page.addInitScript(() => {
    localStorage.setItem('access_token', 'access-customer');
    localStorage.setItem('refresh_token', 'refresh-customer');
    class RazorpayMock {
      constructor(private options: { handler: (payment: object) => void }) {}
      open() { this.options.handler({ razorpay_payment_id: 'pay_test' }); }
    }
    (window as Window & { Razorpay?: typeof RazorpayMock }).Razorpay = RazorpayMock;
  });
  await page.route('**/api/cart', async (route) => route.fulfill({
    contentType: 'application/json',
    body: JSON.stringify({ success: true, data: cartItems }),
  }));
  await page.route('**/api/addresses', (route) => route.fulfill({
    contentType: 'application/json',
    body: JSON.stringify({ success: true, data: [deliveryAddress] }),
  }));
  await page.route('**/api/orders', async (route) => {
    if (route.request().method() === 'POST') {
      cartItems = [];
      await route.fulfill({
        contentType: 'application/json',
        body: JSON.stringify({ success: true, data: { ...order, created_at: new Date().toISOString() } }),
      });
      return;
    }
    await route.fulfill({ contentType: 'application/json', body: JSON.stringify({ success: true, data: [] }) });
  });
  await page.route('**.tile.openstreetmap.org/**', (route) => route.abort());
  await page.goto('/');
  await page.getByRole('button', { name: /1 item/i }).click();
  await page.getByRole('button', { name: 'Pay Now' }).click();

  await expect(page).toHaveURL(new RegExp(`/order/${orderId}$`));
  await expect(page.getByRole('heading', { name: `Order #${orderId.slice(0, 8).toUpperCase()}` })).toBeVisible();
});

test('customer can open an order from order history', async ({ page }) => {
  await page.addInitScript(() => {
    localStorage.setItem('access_token', 'access-customer');
    localStorage.setItem('refresh_token', 'refresh-customer');
  });
  await page.route('**/api/orders', (route) => route.fulfill({
    contentType: 'application/json',
    body: JSON.stringify({ success: true, data: [order] }),
  }));
  await page.route('**.tile.openstreetmap.org/**', (route) => route.abort());
  await page.goto('/orders');
  await expect(page.getByText(/Arriving in/)).toBeVisible();
  await page.locator('article').filter({ hasText: /Arriving in/ }).click();

  await expect(page).toHaveURL(new RegExp(`/order/${orderId}$`));
  await expect(page.getByRole('heading', { name: 'Order Summary' })).toBeVisible();
});

test('customer can review and cancel an order that is still pending', async ({ page }) => {
  await page.route('**.tile.openstreetmap.org/**', (route) => route.abort());
  await page.goto(`/order/${orderId}`);

  await expect(page.getByRole('heading', { name: `Order #${orderId.slice(0, 8).toUpperCase()}` })).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Order Summary' })).toBeVisible();
  await page.getByRole('button', { name: 'Cancel Order' }).click();

  const confirmation = page.getByRole('dialog', { name: 'Cancel this order?' });
  await expect(confirmation).toBeVisible();
  await confirmation.getByRole('button', { name: 'Yes, Cancel' }).click();
  await expect(page.getByRole('heading', { name: 'Order Cancelled' })).toBeVisible();
});
