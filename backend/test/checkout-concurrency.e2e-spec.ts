import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { randomUUID } from 'node:crypto';

describe('local Postgres checkout concurrency', () => {
  let db: SupabaseClient;
  const userIds = Array.from({ length: 20 }, () => randomUUID());
  const categoryId = randomUUID();
  const productId = randomUUID();
  const variantId = randomUUID();

  beforeAll(() => {
    const url = process.env.SUPABASE_URL;
    const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (!url || !key) throw new Error('Set local SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY');
    db = createClient(url, key, { auth: { persistSession: false } });
  });

  async function seed(stock: number): Promise<void> {
    const { error: userError } = await db.from('users').insert(userIds.map((id, index) => ({
      id, email: `checkout-test-${id}@example.test`, name: `Checkout ${index}`,
    })));
    if (userError) throw userError;
    const { error: categoryError } = await db.from('categories').insert({ id: categoryId, name: 'Concurrency test', slug: `concurrency-${categoryId}` });
    if (categoryError) throw categoryError;
    const { error: productError } = await db.from('products').insert({ id: productId, category_id: categoryId, name: 'Concurrency test product' });
    if (productError) throw productError;
    const { error: variantError } = await db.from('product_variants').insert({ id: variantId, product_id: productId, unit: 'each', price: 10, stock });
    if (variantError) throw variantError;
    await seedCarts();
  }

  async function seedCarts(): Promise<void> {
    const { error } = await db.from('cart_items').insert(userIds.map((user_id) => ({ user_id, variant_id: variantId, quantity: 1 })));
    if (error) throw error;
  }

  async function cleanup(): Promise<void> {
    await db.from('orders').delete().in('user_id', userIds);
    await db.from('users').delete().in('id', userIds);
    await db.from('product_variants').delete().eq('id', variantId);
    await db.from('products').delete().eq('id', productId);
    await db.from('categories').delete().eq('id', categoryId);
  }

  beforeAll(async () => {
    await cleanup();
    await seed(5);
  });

  afterAll(async () => cleanup());

  it('records the pre-fix checkout race, then allows only five atomic reservations', async () => {
    // This sequence matches the prior service flow: read cart, insert order/items, clear cart; it never decrements stock.
    const legacyResults = await Promise.allSettled(userIds.map(async (userId) => {
      const { data: cart, error: cartError } = await db.from('cart_items')
        .select('variant_id, quantity, note, product_variants(price)')
        .eq('user_id', userId).single();
      if (cartError || !cart) throw cartError ?? new Error('Missing cart');
      const relation = Array.isArray(cart.product_variants) ? cart.product_variants[0] : cart.product_variants;
      const price = Number((relation as { price: number | string }).price);
      const { data: order, error: orderError } = await db.from('orders').insert({
        user_id: userId, total_amount: price * cart.quantity, delivery_eta_minutes: 15,
      }).select('id').single();
      if (orderError || !order) throw orderError ?? new Error('Order insert failed');
      const { error: itemError } = await db.from('order_items').insert({
        order_id: order.id, variant_id: cart.variant_id, quantity: cart.quantity, price_at_purchase: price,
      });
      if (itemError) throw itemError;
      const { error: clearError } = await db.from('cart_items').delete().eq('user_id', userId);
      if (clearError) throw clearError;
      return order.id;
    }));
    expect(legacyResults.filter((result) => result.status === 'fulfilled')).toHaveLength(20);
    const { data: legacyVariant, error: legacyStockError } = await db.from('product_variants').select('stock').eq('id', variantId).single();
    if (legacyStockError) throw legacyStockError;
    expect(legacyVariant.stock).toBe(5);

    await db.from('orders').delete().in('user_id', userIds);
    await seedCarts();
    const fixedResults = await Promise.allSettled(userIds.map(async (p_user_id) => {
      const { data, error } = await db.rpc('checkout_order', {
        p_user_id, p_address_id: null, p_delivery_eta_minutes: 15,
      });
      if (error) throw error;
      return data;
    }));
    expect(fixedResults.filter((result) => result.status === 'fulfilled').length).toBe(5);
    expect(fixedResults.filter((result) => result.status === 'rejected').length).toBe(15);
    const { data: fixedVariant, error: fixedStockError } = await db.from('product_variants').select('stock').eq('id', variantId).single();
    if (fixedStockError) throw fixedStockError;
    expect(fixedVariant.stock).toBe(0);

    const { data: orders, error: ordersError } = await db.from('orders').select('id, user_id').in('user_id', userIds);
    if (ordersError) throw ordersError;
    expect(orders).toHaveLength(5);
    const captured = await db.rpc('process_razorpay_payment', {
      p_event_id: `capture-${orders[0].id}`, p_order_id: orders[0].id,
      p_signature_valid: true, p_event_type: 'payment.captured',
    });
    expect(captured.error).toBeNull();
    expect(captured.data).toBe(true);
    const duplicateCapture = await db.rpc('process_razorpay_payment', {
      p_event_id: `capture-${orders[0].id}`, p_order_id: orders[0].id,
      p_signature_valid: true, p_event_type: 'payment.captured',
    });
    expect(duplicateCapture.error).toBeNull();
    expect(duplicateCapture.data).toBe(false);

    const failed = await db.rpc('process_razorpay_payment', {
      p_event_id: `failure-${orders[1].id}`, p_order_id: orders[1].id,
      p_signature_valid: true, p_event_type: 'payment.failed',
    });
    expect(failed.error).toBeNull();
    expect(failed.data).toBe(true);
    const duplicateFailure = await db.rpc('process_razorpay_payment', {
      p_event_id: `failure-${orders[1].id}`, p_order_id: orders[1].id,
      p_signature_valid: true, p_event_type: 'payment.failed',
    });
    expect(duplicateFailure.data).toBe(false);
    const { data: restored, error: restoreError } = await db.from('product_variants').select('stock').eq('id', variantId).single();
    if (restoreError) throw restoreError;
    expect(restored.stock).toBe(1);

    const { data: remainingCart, error: remainingCartError } = await db.from('cart_items')
      .select('user_id').eq('variant_id', variantId).limit(1).single();
    if (remainingCartError) throw remainingCartError;
    const { error: invalidQuantityError } = await db.from('cart_items')
      .update({ quantity: 0 }).eq('user_id', remainingCart.user_id).eq('variant_id', variantId);
    expect(invalidQuantityError).not.toBeNull();
    const emptyCart = await db.rpc('checkout_order', {
      p_user_id: orders[0].user_id, p_address_id: null, p_delivery_eta_minutes: 15,
    });
    expect(emptyCart.error?.message).toContain('Cart is empty');

    const deletedProductId = randomUUID();
    const deletedVariantId = randomUUID();
    const deletedCategoryId = randomUUID();
    const testUser = userIds[11];
    await db.from('cart_items').delete().eq('user_id', testUser);
    await db.from('categories').insert({ id: deletedCategoryId, name: 'Deletion test', slug: `deletion-${deletedCategoryId}` });
    await db.from('products').insert({ id: deletedProductId, category_id: deletedCategoryId, name: 'Deleted mid-checkout' });
    await db.from('product_variants').insert({ id: deletedVariantId, product_id: deletedProductId, unit: 'each', price: 1, stock: 1 });
    await db.from('cart_items').insert({ user_id: testUser, variant_id: deletedVariantId, quantity: 1 });
    await db.from('products').delete().eq('id', deletedProductId);
    const deletedCheckout = await db.rpc('checkout_order', {
      p_user_id: testUser, p_address_id: null, p_delivery_eta_minutes: 15,
    });
    expect(deletedCheckout.error?.message).toContain('Cart is empty');
    await db.from('categories').delete().eq('id', deletedCategoryId);
  });
});
