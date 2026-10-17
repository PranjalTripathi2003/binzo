-- Add 55 additional products drawn from Blinkit quick-commerce listings.
-- Prices and pack sizes are listing snapshots checked on 2026-10-17; they
-- vary by delivery location and can change. Product images are left empty.
-- Category listing references:
-- Dairy: https://blinkit.com/dc/dairy-bread/milk/?collection_group_id=11591
-- Dairy: https://blinkit.com/dc/dairy-bread/cheese-butter/?collection_group_id=17124
-- Produce: https://blinkit.com/dc/vegetables-fruits/all/?collection_group_id=90651
-- Chicken: https://blinkit.com/dc/chicken-meat-fish/eggs/?collection_group_id=11539
-- Drinks: https://blinkit.com/prn/cocacola-cola-soft-drink-750-ml/prid/283
-- Drinks: https://blinkit.com/prn/tropicana-orange-delight-juice/prid/53220
-- Cleaning: https://blinkit.com/prn/harpic-10x-disinfectant-liquid-toilet-cleaner-original/prid/209178
-- Cleaning: https://blinkit.com/prn/colin-glass-cleaner/prid/402401
-- Snacks: https://blinkit.com/dc/chips-namkeen/chips-wafers/?collection_group_id=11402
-- Snacks: https://blinkit.com/prn/bikaji-mobile-chowpati-bhelpuri/prid/524899
-- Sweets: https://blinkit.com/prn/x/prid/669065
-- Sweets: https://blinkit.com/prn/amul-dark-chocolate-bar/prid/381902
-- Tea & coffee: https://blinkit.com/prn/tata-gold-tea-pouch/prid/10532
-- Tea & coffee: https://blinkit.com/prn/tata-premium-500-g-tea/prid/24739
-- Tea & coffee: https://blinkit.com/prn/nescafe-classic-instant-coffee-jar/prid/72914
-- Pet care: https://blinkit.com/prn/purepet-dry-cat-food-ocean-fish-adult/prid/235777
-- Pet care: https://blinkit.com/prn/pedigree-chicken-biryani-dry-dog-food-1-kg/prid/785171
-- Pharmacy: https://blinkit.com/dc/health-pharma/fever-pain-relief/?collection_group_id=532514
-- Pharmacy: https://blinkit.com/prn/vicks-original-inhaler-instant-relief-from-blocked-nose/prid/111676
-- Electronics: https://blinkit.com/prn/realme-buds-t110-tws-earbuds-navy-blue-1-pair/prid/689508
-- Electronics: https://blinkit.com/prn/portronics-luxcell-b-10k-22.5w-10000mah-power-bank-%28black%29/prid/560837
-- Electronics: https://blinkit.com/prn/duracell-aaa-battery/prid/458335
-- Product listing references used to identify the five sample items:
-- Coca-Cola: https://blinkit.com/prn/coca-cola-soft-drink-750-ml/prid/283
-- Lay's Magic Masala: https://blinkit.com/prn/lays-indias-magic-masala-potato-chips/prid/432779
-- Nescafe Classic: https://blinkit.com/prn/nescafe-classic-instant-coffee-jar/prid/72914
-- Tata Tea Gold: https://blinkit.com/prn/tata-gold-tea-pouch/prid/10532
-- Pedigree Chicken Biryani: https://blinkit.com/prn/pedigree-chicken-biryani-dry-dog-food/prid/785171

DO $$
DECLARE
  item RECORD;
  resolved_category_id UUID;
  resolved_product_id UUID;
BEGIN
  FOR item IN
    SELECT * FROM (VALUES
      ('dairy-bread-eggs', 'Harvest Gold Atta Whole Wheat Bread', 'Whole wheat bread for toast and sandwiches.', 'Harvest Gold', '450g', 65.00::NUMERIC),
      ('dairy-bread-eggs', 'English Oven Milk Bread', 'Soft milk bread loaf.', 'English Oven', '400g', 50.00::NUMERIC),
      ('dairy-bread-eggs', 'Amul Salted Butter', 'Salted table butter.', 'Amul', '100g', 66.00::NUMERIC),
      ('dairy-bread-eggs', 'Amul Cheese Slices', 'Processed cheese slices.', 'Amul', '100g', 82.00::NUMERIC),
      ('dairy-bread-eggs', 'Mother Dairy Ultimate Cup Curd', 'Plain cup curd.', 'Mother Dairy', '400g', 55.00::NUMERIC),

      ('fruits-vegetables', 'Banana', 'Fresh bananas, pack of three.', 'Fresh Produce', '3 pcs', 44.00::NUMERIC),
      ('fruits-vegetables', 'Coriander Bunch (Dhaniya Patta)', 'Fresh coriander leaves.', 'Fresh Produce', '100g', 16.00::NUMERIC),
      ('fruits-vegetables', 'Onion (Pyaz)', 'Fresh onions for everyday cooking.', 'Fresh Produce', '1kg', 65.00::NUMERIC),
      ('fruits-vegetables', 'Potato (Aloo)', 'Fresh potatoes for everyday cooking.', 'Fresh Produce', '1kg', 24.00::NUMERIC),
      ('fruits-vegetables', 'Hybrid Tomato (Tamatar)', 'Fresh hybrid tomatoes.', 'Fresh Produce', '500g', 34.00::NUMERIC),

      ('cold-drinks-juices', 'Coca-Cola Soft Drink', 'Classic cola soft drink.', 'Coca-Cola', '750ml', 39.00::NUMERIC),
      ('cold-drinks-juices', 'Tropicana Orange Delight Juice', 'Ready-to-serve orange fruit beverage.', 'Tropicana', '1L', 120.00::NUMERIC),
      ('cold-drinks-juices', 'Minute Maid Pulpy Orange Fruit Drink', 'Orange fruit drink with pulp.', 'Minute Maid', '1L', 82.00::NUMERIC),
      ('cold-drinks-juices', 'Real Fruit Power Mixed Fruit Juice', 'Mixed fruit juice drink.', 'Real', '1L', 117.00::NUMERIC),
      ('cold-drinks-juices', 'Mogu Mogu Lychee Fruit Drink with Nata De Coco', 'Lychee drink with nata de coco.', 'Mogu Mogu', '320ml', 73.00::NUMERIC),

      ('chicken-meat-fish', 'Licious Chicken Breast - Boneless', 'Fresh boneless chicken breast.', 'Licious', '400g', 365.00::NUMERIC),
      ('chicken-meat-fish', 'Licious Chicken Curry Cut', 'Fresh chicken curry cut pieces.', 'Licious', '450g', 219.00::NUMERIC),
      ('chicken-meat-fish', 'Meatigo Fresh Boneless Chicken Breast', 'Fresh boneless chicken breast.', 'Meatigo', '400g', 269.00::NUMERIC),
      ('chicken-meat-fish', 'Nutrich Fresh Chicken Curry Cut', 'Fresh chicken curry cut pieces.', 'Nutrich', '400g', 144.00::NUMERIC),
      ('chicken-meat-fish', 'Table White White Eggs', 'White eggs, pack of ten.', 'Table White', '10 pcs', 101.00::NUMERIC),

      ('cleaning-essentials', 'Lizol Disinfectant Surface & Floor Cleaner', 'Citrus surface and floor cleaner.', 'Lizol', '1L', 202.00::NUMERIC),
      ('cleaning-essentials', 'Harpic Disinfectant Liquid Toilet Cleaner - Original', 'Original fragrance toilet cleaner.', 'Harpic', '1L', 197.00::NUMERIC),
      ('cleaning-essentials', 'Vim Lemon Dishwash Gel', 'Lemon dishwashing gel.', 'Vim', '500ml', 140.00::NUMERIC),
      ('cleaning-essentials', 'Surf Excel Quick Wash Detergent Powder', 'Quick wash laundry detergent powder.', 'Surf Excel', '500g', 118.00::NUMERIC),
      ('cleaning-essentials', 'Colin Glass Cleaner', 'Glass and mirror cleaner.', 'Colin', '500ml', 120.00::NUMERIC),

      ('snacks-munchies', 'Lay’s India’s Magic Masala Potato Chips', 'Crispy potato chips with masala seasoning.', 'Lay’s', '52.9g', 20.00::NUMERIC),
      ('snacks-munchies', 'Kurkure Green Chutney Crisps', 'Crunchy crisps with green chutney flavour.', 'Kurkure', '78.9g', 20.00::NUMERIC),
      ('snacks-munchies', 'Haldiram’s Classic Salted Potato Chips', 'Classic salted potato chips.', 'Haldiram’s', '89g', 34.00::NUMERIC),
      ('snacks-munchies', 'Pringles South African Peri Peri Chips', 'Peri peri flavoured potato crisps.', 'Pringles', '102g', 116.00::NUMERIC),
      ('snacks-munchies', 'Bikaji Mobile Chowpati Bhelpuri', 'Ready-to-eat bhelpuri snack mix.', 'Bikaji', '110g', 33.00::NUMERIC),

      ('sweet-tooth', 'Cadbury Dairy Milk Chocolate Bar', 'Classic milk chocolate bar.', 'Cadbury', '25g', 25.00::NUMERIC),
      ('sweet-tooth', 'Cadbury Dairy Milk Silk Milk Chocolate Bar', 'Smooth milk chocolate bar.', 'Cadbury', '60g', 99.00::NUMERIC),
      ('sweet-tooth', 'Amul Dark Chocolate Bar', 'Dark chocolate bar.', 'Amul', '35g', 45.00::NUMERIC),
      ('sweet-tooth', 'Cadbury 5 Star Chocolate Filled Bar', 'Chocolate bar with caramel and nougat centre.', 'Cadbury', '35.2g', 20.00::NUMERIC),
      ('sweet-tooth', 'Bournvita Biscuit', 'Chocolate-flavoured crunchy biscuits.', 'Bournvita', '111.6g', 29.00::NUMERIC),

      ('tea-coffee-milk-drinks', 'Tata Tea Gold', 'Assam black tea blend.', 'Tata Tea', '250g', 185.00::NUMERIC),
      ('tea-coffee-milk-drinks', 'Nescafe Classic Instant Coffee Powder', 'Instant coffee powder.', 'Nescafe', '45g', 240.00::NUMERIC),
      ('tea-coffee-milk-drinks', 'Nescafe Classic Pure Instant Coffee Sachets', 'Instant coffee sachets.', 'Nescafe', '30 x 2.2g', 150.00::NUMERIC),
      ('tea-coffee-milk-drinks', 'Tata Tea Premium Tea', 'Assam black tea blend.', 'Tata Tea', '500g', 242.00::NUMERIC),
      ('tea-coffee-milk-drinks', 'Bournvita Chocolate Nutrition Drink Mix', 'Chocolate malt nutrition drink mix.', 'Bournvita', '500g', 249.00::NUMERIC),

      ('pet-care', 'Pedigree Dry Dog Food - Chicken Biryani', 'Adult dry dog food with chicken biryani flavour.', 'Pedigree', '1kg', 239.00::NUMERIC),
      ('pet-care', 'Whiskas Adult Dry Cat Food - Rohu Fish', 'Adult dry cat food with rohu fish flavour.', 'Whiskas', '450g', 176.00::NUMERIC),
      ('pet-care', 'Super Pet Best Cat Litter', 'Clumping cat litter.', 'Super Pet', '5kg', 328.00::NUMERIC),
      ('pet-care', 'PurePet Lickable Crab & Chicken Creamy Cat Treat', 'Creamy lickable cat treats.', 'PurePet', '5 x 15g', 79.00::NUMERIC),
      ('pet-care', 'PurePet Dry Cat Food (Ocean Fish, Adult)', 'Adult dry cat food with ocean fish flavour.', 'PurePet', '1kg', 178.00::NUMERIC),

      ('pharmacy', 'Crocin 650 Tablets', 'Paracetamol 650 mg tablets, over-the-counter listing.', 'Crocin', '15 tabs', 32.00::NUMERIC),
      ('pharmacy', 'Crocin Advance 500mg Tablets', 'Paracetamol 500 mg tablets, over-the-counter listing.', 'Crocin', '20 tabs', 19.00::NUMERIC),
      ('pharmacy', 'Vicks Original Inhaler', 'Portable menthol nasal inhaler.', 'Vicks', '0.5ml', 69.00::NUMERIC),
      ('pharmacy', 'Vicks Vaporub Xtra Strong Chest Rub & Balm', 'Topical chest rub balm.', 'Vicks', '25ml', 125.00::NUMERIC),
      ('pharmacy', 'Volini Pain Relief Spray', 'Topical pain relief spray.', 'Volini', '15g', 77.00::NUMERIC),

      ('electronics', 'Realme Buds T110 TWS Earbuds (Navy Blue)', 'True wireless earbuds with charging case.', 'Realme', '1 pair', 1699.00::NUMERIC),
      ('electronics', 'Portronics Luxcell B 10K 22.5W Power Bank', '10,000 mAh power bank.', 'Portronics', '1 unit', 879.00::NUMERIC),
      ('electronics', 'Duracell AAA Alkaline Battery', 'AAA alkaline batteries.', 'Duracell', '2 pcs', 47.00::NUMERIC),
      ('electronics', 'boAt Bassheads 100 Wired Earphones (Black)', 'Wired in-ear earphones.', 'boAt', '1 unit', 449.00::NUMERIC),
      ('electronics', 'Portronics Luxcell Wireless Mini Magsafe 10K Power Bank', '10,000 mAh magnetic wireless power bank.', 'Portronics', '1 unit', 1199.00::NUMERIC)
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
    ELSE
      UPDATE public.products
      SET description = item.product_description,
          brand = item.product_brand
      WHERE id = resolved_product_id;
    END IF;

    IF NOT EXISTS (
      SELECT 1
      FROM public.product_variants
      WHERE product_id = resolved_product_id
        AND unit = item.unit
    ) THEN
      INSERT INTO public.product_variants (product_id, unit, price, stock, image_url)
      VALUES (resolved_product_id, item.unit, item.price, 100, NULL);
    ELSE
      UPDATE public.product_variants
      SET price = item.price
      WHERE product_id = resolved_product_id
        AND unit = item.unit;
    END IF;
  END LOOP;
END $$;

-- Add five downloaded pack images uploaded to the local Supabase products
-- bucket; all other new items remain image-free for the catalog owner to add.
UPDATE public.product_variants AS variant
SET image_url = 'http://127.0.0.1:50321/storage/v1/object/public/products/coca-cola-750ml.jpg'
FROM public.products AS product
JOIN public.categories AS category ON category.id = product.category_id
WHERE variant.product_id = product.id
  AND category.slug = 'cold-drinks-juices'
  AND product.name = 'Coca-Cola Soft Drink'
  AND variant.unit = '750ml';

UPDATE public.product_variants AS variant
SET image_url = 'http://127.0.0.1:50321/storage/v1/object/public/products/lays-magic-masala.png'
FROM public.products AS product
JOIN public.categories AS category ON category.id = product.category_id
WHERE variant.product_id = product.id
  AND category.slug = 'snacks-munchies'
  AND product.name = 'Lay’s India’s Magic Masala Potato Chips'
  AND variant.unit = '52.9g';

UPDATE public.product_variants AS variant
SET image_url = 'http://127.0.0.1:50321/storage/v1/object/public/products/nescafe-classic-45g.jpg'
FROM public.products AS product
JOIN public.categories AS category ON category.id = product.category_id
WHERE variant.product_id = product.id
  AND category.slug = 'tea-coffee-milk-drinks'
  AND product.name = 'Nescafe Classic Instant Coffee Powder'
  AND variant.unit = '45g';

UPDATE public.product_variants AS variant
SET image_url = 'http://127.0.0.1:50321/storage/v1/object/public/products/tata-tea-gold-250g.jpg'
FROM public.products AS product
JOIN public.categories AS category ON category.id = product.category_id
WHERE variant.product_id = product.id
  AND category.slug = 'tea-coffee-milk-drinks'
  AND product.name = 'Tata Tea Gold'
  AND variant.unit = '250g';

UPDATE public.product_variants AS variant
SET image_url = 'http://127.0.0.1:50321/storage/v1/object/public/products/pedigree-chicken-biryani-1kg.png'
FROM public.products AS product
JOIN public.categories AS category ON category.id = product.category_id
WHERE variant.product_id = product.id
  AND category.slug = 'pet-care'
  AND product.name = 'Pedigree Dry Dog Food - Chicken Biryani'
  AND variant.unit = '1kg';
