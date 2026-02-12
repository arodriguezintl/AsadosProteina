-- ============================================================================
-- RECREAR FOREIGN KEYS PERDIDAS
-- ============================================================================

-- Foreign keys para order_items
ALTER TABLE public.order_items
  DROP CONSTRAINT IF EXISTS order_items_order_id_fkey,
  DROP CONSTRAINT IF EXISTS order_items_product_id_fkey;

ALTER TABLE public.order_items
  ADD CONSTRAINT order_items_order_id_fkey 
    FOREIGN KEY (order_id) REFERENCES public.orders(id) ON DELETE CASCADE,
  ADD CONSTRAINT order_items_product_id_fkey 
    FOREIGN KEY (product_id) REFERENCES public.inventory_products(id) ON DELETE RESTRICT;

-- Foreign keys para orders
ALTER TABLE public.orders
  DROP CONSTRAINT IF EXISTS orders_customer_id_fkey;

ALTER TABLE public.orders
  ADD CONSTRAINT orders_customer_id_fkey 
    FOREIGN KEY (customer_id) REFERENCES public.customers(id) ON DELETE SET NULL;

-- Foreign keys para recipe_ingredients
ALTER TABLE public.recipe_ingredients
  DROP CONSTRAINT IF EXISTS recipe_ingredients_recipe_id_fkey,
  DROP CONSTRAINT IF EXISTS recipe_ingredients_product_id_fkey;

ALTER TABLE public.recipe_ingredients
  ADD CONSTRAINT recipe_ingredients_recipe_id_fkey 
    FOREIGN KEY (recipe_id) REFERENCES public.recipes(id) ON DELETE CASCADE,
  ADD CONSTRAINT recipe_ingredients_product_id_fkey 
    FOREIGN KEY (product_id) REFERENCES public.inventory_products(id) ON DELETE RESTRICT;

-- Foreign keys para recipes
ALTER TABLE public.recipes
  DROP CONSTRAINT IF EXISTS recipes_product_id_fkey;

ALTER TABLE public.recipes
  ADD CONSTRAINT recipes_product_id_fkey 
    FOREIGN KEY (product_id) REFERENCES public.inventory_products(id) ON DELETE RESTRICT;

-- Verificar que se crearon
SELECT
    tc.table_name, 
    kcu.column_name, 
    ccu.table_name AS foreign_table_name,
    ccu.column_name AS foreign_column_name 
FROM information_schema.table_constraints AS tc 
JOIN information_schema.key_column_usage AS kcu
  ON tc.constraint_name = kcu.constraint_name
  AND tc.table_schema = kcu.table_schema
JOIN information_schema.constraint_column_usage AS ccu
  ON ccu.constraint_name = tc.constraint_name
WHERE tc.constraint_type = 'FOREIGN KEY' 
  AND tc.table_schema = 'public'
  AND tc.table_name IN ('order_items', 'orders', 'recipe_ingredients', 'recipes')
ORDER BY tc.table_name, kcu.column_name;
