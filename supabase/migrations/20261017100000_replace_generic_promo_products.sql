-- Replace the initial demo entries with named products listed on Blinkit.
-- Prices are listing snapshots checked on 2026-10-17 and vary by location.
-- Existing product and variant IDs are retained, along with any images and
-- order/cart references that may already use those IDs.
-- Source listings:
-- https://blinkit.com/prn/reliable-type-c-to-type-c-cable-black/prid/703722
-- https://blinkit.com/prn/reliable-type-c-fast-charging-adapter-45-w/prid/703727
-- https://blinkit.com/prn/boat-airdopes-joy-tws-earbuds-jet-black/prid/650326
-- https://blinkit.com/prn/product/prid/601710
-- https://blinkit.com/prn/portronics-luxcell-bind-20k-22.5w-20000mah-power-bank-with-inbuilt-type-c-8-pin-cable-black/prid/560844
-- https://blinkit.com/prn/pedigree-adult-puppy-dry-dog-food-1-kg/prid/571744
-- https://blinkit.com/prn/whiskas-adult-dry-cat-food-tuna/prid/793506
-- https://blinkit.com/prn/petoska-classic-unscented-cat-litter/prid/780780
-- https://blinkit.com/prn/dr-vet-dry-bath-pet-shampoo/prid/692439
-- https://blinkit.com/prn/drools-chicken-chunks-in-gravy-adult-wet-dog-food/prid/430510
-- https://blinkit.com/prn/product/prid/480465
-- https://blinkit.com/prn/product/prid/620921
-- https://blinkit.com/prn/savlon-disinfectant-antiseptic-liquid/prid/330348
-- https://blinkit.com/prn/dettol-multipurpose-antiseptic-liquid/prid/19608
-- https://blinkit.com/prn/electral-ors/prid/475170

DO $$
DECLARE
  item RECORD;
  resolved_category_id UUID;
  resolved_product_id UUID;
  resolved_variant_id UUID;
BEGIN
  FOR item IN
    SELECT * FROM (VALUES
      ('electronics', 'USB-C Charging Cable', 'Reliable Type C to Type C Cable', 'Reliable Type C to Type C Cable.', 'Reliable', '1 unit', 179.00::NUMERIC),
      ('electronics', '20W USB-C Wall Charger', 'Reliable Type C Fast Charging Adapter (45 W)', 'Reliable Type C fast charging adapter.', 'Reliable', '1 unit', 299.00::NUMERIC),
      ('electronics', 'Wired Earphones with Mic', 'boAt Airdopes Joy TWS Earbuds (Jet Black)', 'True wireless earbuds with charging case.', 'boAt', '1 unit', 899.00::NUMERIC),
      ('electronics', 'Wireless Optical Mouse', 'Portronics Wireless Mouse (Transparent)', 'Wireless mouse with USB nano receiver.', 'Portronics', '1 unit', 579.00::NUMERIC),
      ('electronics', '10,000 mAh Power Bank', 'Portronics Luxcell Bind 20K 22.5W Power Bank', '20,000 mAh power bank with built-in Type-C and 8-pin cables.', 'Portronics', '1 unit', 1330.00::NUMERIC),
      ('pet-care', 'Adult Dry Dog Food', 'Pedigree Adult & Puppy Dry Dog Food', 'Pedigree adult and puppy dry dog food.', 'Pedigree', '1kg', 306.00::NUMERIC),
      ('pet-care', 'Ocean Fish Cat Food', 'Whiskas Adult Dry Cat Food - Tuna', 'Whiskas adult dry cat food with tuna flavour.', 'Whiskas', '480g', 200.00::NUMERIC),
      ('pet-care', 'Clumping Cat Litter', 'Petoska Classic Unscented Cat Litter', 'Unscented cat litter.', 'Petoska', '5kg', 235.00::NUMERIC),
      ('pet-care', 'Gentle Pet Shampoo', 'Dr. Vet Dry Bath Pet Shampoo', 'Dry bath pet shampoo.', 'Dr. Vet', '200ml', 199.00::NUMERIC),
      ('pet-care', 'Chicken Dog Treats', 'Drools Chicken Chunks in Gravy Adult Wet Dog Food', 'Adult wet dog food with chicken chunks in gravy.', 'Drools', '150g', 50.00::NUMERIC),
      ('pharmacy', 'Digital Thermometer', 'Omron MC-246 Digital Thermometer', 'Omron MC-246 digital thermometer.', 'Omron', '1 pc', 240.00::NUMERIC),
      ('pharmacy', 'Adhesive Bandage Strips', 'Hansaplast Washproof Anti-Septic Adhesive Bandage', 'Washproof antiseptic adhesive bandages.', 'Hansaplast', '20 pcs', 55.00::NUMERIC),
      ('pharmacy', 'Antiseptic Liquid', 'Savlon Disinfectant Antiseptic Liquid', 'Savlon disinfectant antiseptic liquid.', 'Savlon', '200ml', 97.00::NUMERIC),
      ('pharmacy', 'Hand Sanitizer', 'Dettol Original Instant Hand Sanitizer', 'Dettol instant hand sanitizer.', 'Dettol', '50ml', 34.00::NUMERIC),
      ('pharmacy', 'Oral Rehydration Salts Sachets', 'Electral ORS', 'Electral oral rehydration salts sachet.', 'Electral', '21.8g', 23.00::NUMERIC)
    ) AS seed(category_slug, old_product_name, product_name, product_description, product_brand, unit, price)
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
      AND name IN (item.old_product_name, item.product_name)
    ORDER BY CASE WHEN name = item.product_name THEN 0 ELSE 1 END
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
    ELSE
      UPDATE public.products
      SET name = item.product_name,
          description = item.product_description,
          brand = item.product_brand
      WHERE id = resolved_product_id;
    END IF;

    SELECT id INTO resolved_variant_id
    FROM public.product_variants
    WHERE product_id = resolved_product_id
    ORDER BY created_at, id
    LIMIT 1;

    IF resolved_variant_id IS NULL THEN
      INSERT INTO public.product_variants (product_id, unit, price, stock, image_url)
      VALUES (resolved_product_id, item.unit, item.price, 100, NULL);
    ELSE
      UPDATE public.product_variants
      SET unit = item.unit,
          price = item.price
      WHERE id = resolved_variant_id;
    END IF;
  END LOOP;
END $$;
