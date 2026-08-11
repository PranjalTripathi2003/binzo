-- Store the promised delivery duration on each order so the order details and
-- order list can show the same countdown as the checkout navbar.

ALTER TABLE public.orders
  ADD COLUMN IF NOT EXISTS delivery_eta_minutes integer NOT NULL DEFAULT 15;

ALTER TABLE public.orders
  ADD CONSTRAINT orders_delivery_eta_minutes_range
  CHECK (delivery_eta_minutes BETWEEN 5 AND 30)
  NOT VALID;

ALTER TABLE public.orders
  VALIDATE CONSTRAINT orders_delivery_eta_minutes_range;

COMMENT ON COLUMN public.orders.delivery_eta_minutes IS
  'Promised delivery duration in minutes, copied from the storefront delivery estimate at checkout.';
