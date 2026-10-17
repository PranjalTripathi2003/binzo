-- Add image-free catalog items from the approved categories so the homepage
-- product carousels have enough cards to show their next buttons.
-- Prices are demo values based on Blinkit listings checked on 2026-10-15;
-- local prices can vary by delivery location and change over time.
-- References:
-- https://blinkit.com/prn/britannia-multigrain-bread-400-g/prid/111463
-- https://blinkit.com/sector-24/prn/mother-dairy-curd/prid/86446
-- https://blinkit.com/prn/amul-fresh-malai-paneer/prid/329500
-- https://blinkit.com/cn/dairy-bread-eggs/eggs/cid/14/1200
-- https://blinkit.com/prn/product/prid/57435
-- https://blinkit.com/prn/x/prid/436909
-- https://blinkit.com/prn/haldirams-aloo-bhujia-namkeen/prid/91252
-- https://blinkit.com/prn/oreo-chocolate-flavour-sandwich-cream-biscuits/prid/524797
DO $$
DECLARE
  item RECORD;
  resolved_category_id UUID;
  resolved_product_id UUID;
BEGIN
  FOR item IN
    SELECT * FROM (VALUES
      ('dairy-bread-eggs', 'Britannia Multigrain Bread', 'Soft multigrain bread for everyday toast and sandwiches.', 'Britannia', '400g', 63.00::NUMERIC),
      ('dairy-bread-eggs', 'Mother Dairy Classic Curd', 'Classic plain curd made with cultured milk.', 'Mother Dairy', '390g', 35.00::NUMERIC),
      ('dairy-bread-eggs', 'Amul Fresh Malai Paneer', 'Fresh malai paneer for curries, grills, and snacks.', 'Amul', '200g', 95.00::NUMERIC),
      ('dairy-bread-eggs', 'Table White Eggs', 'Farm fresh white eggs, pack of ten.', 'Table White', '10 pcs', 95.00::NUMERIC),
      ('snacks-munchies', 'Lays Classic Salted Potato Chips', 'Crispy potato chips with classic salted flavour.', 'Lays', '51g', 20.00::NUMERIC),
      ('snacks-munchies', 'Kurkure Masala Munch Crisps', 'Crunchy corn and rice snack with a bold masala flavour.', 'Kurkure', '103.6g', 30.00::NUMERIC),
      ('snacks-munchies', 'Haldirams Aloo Bhujia', 'Crispy potato and gram flour namkeen with Indian spices.', 'Haldirams', '210g', 55.00::NUMERIC),
      ('snacks-munchies', 'Oreo Chocolate Flavour Sandwich Biscuits', 'Chocolate cream sandwich biscuits.', 'Oreo', '125.25g', 38.00::NUMERIC),
      ('snacks-munchies', 'Hide & Seek Choco Chip Cookies', 'Crunchy chocolate chip cookies for tea-time snacking.', 'Sunfeast', '100g', 29.00::NUMERIC)
    ) AS seed(category_slug, product_name, product_description, product_brand, unit, price)
  LOOP
    SELECT id INTO resolved_category_id
    FROM public.categories
    WHERE slug = item.category_slug;

    IF resolved_category_id IS NULL THEN
      RAISE EXCEPTION 'Required category % was not found', item.category_slug;
    END IF;

    SELECT id INTO resolved_product_id
    FROM public.products
    WHERE category_id = resolved_category_id
      AND name = item.product_name
    LIMIT 1;

    IF resolved_product_id IS NULL THEN
      INSERT INTO public.products (category_id, name, description, brand)
      VALUES (
        resolved_category_id,
        item.product_name,
        item.product_description,
        item.product_brand
      )
      RETURNING id INTO resolved_product_id;
    END IF;

    IF NOT EXISTS (
      SELECT 1
      FROM public.product_variants
      WHERE product_id = resolved_product_id
        AND unit = item.unit
    ) THEN
      INSERT INTO public.product_variants (product_id, unit, price, stock, image_url)
      VALUES (resolved_product_id, item.unit, item.price, 100, NULL);
    END IF;
  END LOOP;
END $$;
