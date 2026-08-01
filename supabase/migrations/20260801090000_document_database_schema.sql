-- Database documentation comments for Binzo.
-- These comments live in PostgreSQL metadata and can be viewed from tools that
-- inspect table/column descriptions. They do not change data or constraints.

COMMENT ON TABLE public.categories IS
  'Top-level grocery catalog groups shown on the homepage, such as Dairy or Fruits.';
COMMENT ON COLUMN public.categories.slug IS
  'Stable URL/API identifier for the category; enforced unique by the database.';
COMMENT ON COLUMN public.categories.image_url IS
  'Public image URL used by the frontend category grid.';

COMMENT ON TABLE public.products IS
  'Catalog products such as Amul Gold Milk; each product belongs to one category.';
COMMENT ON COLUMN public.products.category_id IS
  'Foreign key to categories.id. Deleting a category cascades to its products.';
COMMENT ON COLUMN public.products.brand IS
  'Optional brand/manufacturer label displayed or filtered by the product catalog.';

COMMENT ON TABLE public.product_variants IS
  'Purchasable units of a product, such as 500ml, 1L, or 1kg, with price and stock.';
COMMENT ON COLUMN public.product_variants.product_id IS
  'Foreign key to products.id. Deleting a product cascades to its variants.';
COMMENT ON COLUMN public.product_variants.unit IS
  'Human-readable unit size displayed on product cards and detail pages.';
COMMENT ON COLUMN public.product_variants.price IS
  'Current selling price for this specific variant.';
COMMENT ON COLUMN public.product_variants.stock IS
  'Available inventory count for this variant.';
COMMENT ON COLUMN public.product_variants.image_url IS
  'Variant image URL used by product cards and gallery thumbnails.';

COMMENT ON TABLE public.users IS
  'Application user profile rows linked to Supabase auth.users.';
COMMENT ON COLUMN public.users.id IS
  'Matches auth.users.id and cascades when the Supabase auth user is deleted.';
COMMENT ON COLUMN public.users.phone IS
  'Optional phone number for delivery/contact workflows.';

COMMENT ON TABLE public.addresses IS
  'Saved delivery addresses owned by users.';
COMMENT ON COLUMN public.addresses.user_id IS
  'Owner of the address. Controllers must only use addresses belonging to req.user.userId.';
COMMENT ON COLUMN public.addresses.is_default IS
  'Marks the preferred address. A trigger keeps only one default address per user.';

COMMENT ON TABLE public.cart_items IS
  'Current shopping cart rows: one user, one product variant, and a positive quantity.';
COMMENT ON COLUMN public.cart_items.user_id IS
  'Cart owner. All cart routes filter by this value from the JWT.';
COMMENT ON COLUMN public.cart_items.variant_id IS
  'Selected product_variants.id. Unique together with user_id to avoid duplicates.';
COMMENT ON COLUMN public.cart_items.quantity IS
  'Positive number of units the user wants to buy.';

COMMENT ON TABLE public.orders IS
  'Checkout records created from cart_items.';
COMMENT ON COLUMN public.orders.user_id IS
  'Owner of the order. All order reads filter by this value from the JWT.';
COMMENT ON COLUMN public.orders.address_id IS
  'Delivery address used for the order, kept nullable if the address is deleted.';
COMMENT ON COLUMN public.orders.status IS
  'Lifecycle state: pending, confirmed, preparing, out_for_delivery, delivered, or cancelled.';
COMMENT ON COLUMN public.orders.total_amount IS
  'Total price captured at checkout time.';

COMMENT ON TABLE public.order_items IS
  'Line items captured for an order at checkout time.';
COMMENT ON COLUMN public.order_items.variant_id IS
  'Purchased product variant. ON DELETE RESTRICT protects order history.';
COMMENT ON COLUMN public.order_items.price_at_purchase IS
  'Variant price copied at checkout so old orders do not change when catalog prices change.';
