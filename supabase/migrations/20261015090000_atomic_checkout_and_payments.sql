ALTER TABLE public.product_variants
  ADD CONSTRAINT product_variants_stock_nonnegative CHECK (stock >= 0);

COMMENT ON CONSTRAINT product_variants_stock_nonnegative ON public.product_variants IS
  'Prevents inventory from becoming negative, including writes outside checkout.';

CREATE TABLE public.payment_webhook_events (
  event_id text PRIMARY KEY,
  received_at timestamptz NOT NULL DEFAULT now()
);

COMMENT ON TABLE public.payment_webhook_events IS
  'Razorpay webhook event IDs recorded once to make payment processing idempotent.';
COMMENT ON COLUMN public.payment_webhook_events.event_id IS
  'Unique Razorpay event identifier used to reject duplicate webhook deliveries.';

CREATE OR REPLACE FUNCTION public.checkout_order(
  p_user_id uuid,
  p_address_id uuid DEFAULT NULL,
  p_delivery_eta_minutes integer DEFAULT 15
) RETURNS public.orders
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_item record;
  v_order public.orders;
  v_count integer := 0;
  v_cart_count integer;
  v_total numeric(10,2) := 0;
BEGIN
  IF p_delivery_eta_minutes NOT BETWEEN 5 AND 30 THEN
    RAISE EXCEPTION 'Invalid delivery ETA';
  END IF;
  IF p_address_id IS NOT NULL AND NOT EXISTS (
    SELECT 1 FROM addresses WHERE id = p_address_id AND user_id = p_user_id
  ) THEN
    RAISE EXCEPTION 'Address not found';
  END IF;
  SELECT count(*) INTO v_cart_count FROM cart_items WHERE user_id = p_user_id;
  IF v_cart_count = 0 THEN
    RAISE EXCEPTION 'Cart is empty';
  END IF;

  -- Lock and validate every variant in deterministic order before writing any order rows.
  FOR v_item IN
    SELECT ci.id, ci.variant_id, ci.quantity, ci.note, pv.price
    FROM cart_items ci JOIN product_variants pv ON pv.id = ci.variant_id
    WHERE ci.user_id = p_user_id ORDER BY ci.variant_id FOR UPDATE OF pv
  LOOP
    IF v_item.quantity <= 0 THEN RAISE EXCEPTION 'Invalid quantity'; END IF;
    IF v_item.price IS NULL THEN RAISE EXCEPTION 'Product unavailable'; END IF;
    IF NOT EXISTS (
      SELECT 1 FROM product_variants WHERE id = v_item.variant_id AND stock >= v_item.quantity
    ) THEN RAISE EXCEPTION 'Insufficient stock'; END IF;
    v_count := v_count + 1;
    v_total := v_total + v_item.price * v_item.quantity;
  END LOOP;
  IF v_count <> v_cart_count THEN RAISE EXCEPTION 'Product unavailable'; END IF;

  INSERT INTO orders (user_id, address_id, total_amount, delivery_eta_minutes)
  VALUES (p_user_id, p_address_id, v_total, p_delivery_eta_minutes) RETURNING * INTO v_order;
  INSERT INTO order_items (order_id, variant_id, quantity, price_at_purchase, note)
  SELECT v_order.id, ci.variant_id, ci.quantity, pv.price, ci.note
  FROM cart_items ci JOIN product_variants pv ON pv.id = ci.variant_id
  WHERE ci.user_id = p_user_id;
  UPDATE product_variants pv SET stock = pv.stock - ci.quantity
  FROM cart_items ci WHERE ci.user_id = p_user_id AND pv.id = ci.variant_id
    AND pv.stock >= ci.quantity;
  GET DIAGNOSTICS v_count = ROW_COUNT;
  IF v_count <> (SELECT count(*) FROM cart_items WHERE user_id = p_user_id) THEN
    RAISE EXCEPTION 'Insufficient stock';
  END IF;
  DELETE FROM cart_items WHERE user_id = p_user_id;
  RETURN v_order;
END;
$$;

REVOKE ALL ON FUNCTION public.checkout_order(uuid, uuid, integer) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.checkout_order(uuid, uuid, integer) TO service_role;

COMMENT ON FUNCTION public.checkout_order(uuid, uuid, integer) IS
  'Atomically validates cart, reserves stock with guarded updates, creates order/items, and clears cart.';

CREATE OR REPLACE FUNCTION public.process_razorpay_payment(
  p_event_id text,
  p_order_id uuid,
  p_signature_valid boolean,
  p_event_type text
) RETURNS boolean
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NOT p_signature_valid THEN RAISE EXCEPTION 'Invalid webhook signature'; END IF;
  INSERT INTO payment_webhook_events(event_id) VALUES (p_event_id)
    ON CONFLICT DO NOTHING;
  IF NOT FOUND THEN RETURN false; END IF;
  IF p_event_type = 'payment.captured' THEN
    UPDATE orders SET status = 'confirmed' WHERE id = p_order_id AND status = 'pending';
  ELSIF p_event_type = 'payment.failed' THEN
    UPDATE product_variants pv SET stock = pv.stock + oi.quantity
    FROM order_items oi WHERE oi.order_id = p_order_id AND pv.id = oi.variant_id
      AND EXISTS (SELECT 1 FROM orders WHERE id = p_order_id AND status = 'pending');
    UPDATE orders SET status = 'cancelled' WHERE id = p_order_id AND status = 'pending';
  ELSE
    RAISE EXCEPTION 'Unsupported payment event';
  END IF;
  IF NOT FOUND THEN RAISE EXCEPTION 'Order is not awaiting payment'; END IF;
  RETURN true;
END;
$$;

COMMENT ON FUNCTION public.process_razorpay_payment(text, uuid, boolean, text) IS
  'Records a verified Razorpay event once, confirms captured payments, and restores reserved stock after a failed payment.';

REVOKE ALL ON FUNCTION public.process_razorpay_payment(text, uuid, boolean, text) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.process_razorpay_payment(text, uuid, boolean, text) TO service_role;
