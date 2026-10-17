-- Add three promoted categories and demo catalog items for their category modals.
-- Prices and stock are illustrative seed data; product image URLs are blank.
INSERT INTO public.categories (name, slug, image_url)
VALUES
  ('Electronics', 'electronics', NULL),
  ('Pet Care', 'pet-care', NULL),
  ('Pharmacy', 'pharmacy', NULL)
ON CONFLICT (slug) DO UPDATE
SET name = EXCLUDED.name;

DO $$
DECLARE
  item RECORD;
  resolved_category_id UUID;
  resolved_product_id UUID;
BEGIN
  FOR item IN
    SELECT * FROM (VALUES
      ('electronics', 'USB-C Charging Cable', 'USB-C charging and data cable.', 'Binzo Essentials', '1m', 199.00::NUMERIC),
      ('electronics', '20W USB-C Wall Charger', 'Compact USB-C wall charger.', 'Binzo Essentials', '20W', 899.00::NUMERIC),
      ('electronics', 'Wired Earphones with Mic', 'Wired earphones with an inline microphone.', 'Soundcore', '1 pc', 299.00::NUMERIC),
      ('electronics', 'Wireless Optical Mouse', 'Wireless optical mouse with USB receiver.', 'Logitech', '1 pc', 499.00::NUMERIC),
      ('electronics', '10,000 mAh Power Bank', 'Portable power bank with 10,000 mAh capacity.', 'Ambrane', '10,000mAh', 1299.00::NUMERIC),
      ('pet-care', 'Adult Dry Dog Food', 'Complete dry food for adult dogs.', 'Pedigree', '1kg', 220.00::NUMERIC),
      ('pet-care', 'Ocean Fish Cat Food', 'Dry cat food with an ocean fish flavour.', 'Whiskas', '1kg', 260.00::NUMERIC),
      ('pet-care', 'Clumping Cat Litter', 'Clumping litter for everyday litter tray use.', 'Purrfeto', '5kg', 299.00::NUMERIC),
      ('pet-care', 'Gentle Pet Shampoo', 'Pet shampoo for routine grooming.', 'Himalaya', '200ml', 149.00::NUMERIC),
      ('pet-care', 'Chicken Dog Treats', 'Chicken-flavoured dog treats.', 'Pedigree', '100g', 89.00::NUMERIC),
      ('pharmacy', 'Digital Thermometer', 'Digital thermometer for home health supplies.', 'Dr. Morepen', '1 pc', 199.00::NUMERIC),
      ('pharmacy', 'Adhesive Bandage Strips', 'Pack of adhesive first-aid bandage strips.', 'Hansaplast', '10 pcs', 45.00::NUMERIC),
      ('pharmacy', 'Antiseptic Liquid', 'Antiseptic liquid for household first-aid supplies.', 'Dettol', '100ml', 85.00::NUMERIC),
      ('pharmacy', 'Hand Sanitizer', 'Hand sanitizer for personal hygiene.', 'Savlon', '200ml', 99.00::NUMERIC),
      ('pharmacy', 'Oral Rehydration Salts Sachets', 'Pack of oral rehydration salts sachets.', 'Electral', '5 sachets', 45.00::NUMERIC)
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
