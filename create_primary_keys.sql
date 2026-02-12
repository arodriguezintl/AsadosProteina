-- ============================================================================
-- VERIFICAR Y CREAR PRIMARY KEYS FALTANTES
-- ============================================================================

-- Verificar primary keys existentes
SELECT 
    tc.table_name, 
    kcu.column_name
FROM information_schema.table_constraints tc
JOIN information_schema.key_column_usage kcu 
    ON tc.constraint_name = kcu.constraint_name
WHERE tc.constraint_type = 'PRIMARY KEY'
  AND tc.table_schema = 'public'
  AND tc.table_name IN ('inventory_products', 'orders', 'order_items', 'customers', 'recipes', 'recipe_ingredients')
ORDER BY tc.table_name;

-- Agregar primary keys si no existen
ALTER TABLE public.inventory_products 
  DROP CONSTRAINT IF EXISTS inventory_products_pkey CASCADE;
ALTER TABLE public.inventory_products 
  ADD CONSTRAINT inventory_products_pkey PRIMARY KEY (id);

ALTER TABLE public.orders 
  DROP CONSTRAINT IF EXISTS orders_pkey CASCADE;
ALTER TABLE public.orders 
  ADD CONSTRAINT orders_pkey PRIMARY KEY (id);

ALTER TABLE public.order_items 
  DROP CONSTRAINT IF EXISTS order_items_pkey CASCADE;
ALTER TABLE public.order_items 
  ADD CONSTRAINT order_items_pkey PRIMARY KEY (id);

ALTER TABLE public.customers 
  DROP CONSTRAINT IF EXISTS customers_pkey CASCADE;
ALTER TABLE public.customers 
  ADD CONSTRAINT customers_pkey PRIMARY KEY (id);

ALTER TABLE public.recipes 
  DROP CONSTRAINT IF EXISTS recipes_pkey CASCADE;
ALTER TABLE public.recipes 
  ADD CONSTRAINT recipes_pkey PRIMARY KEY (id);

ALTER TABLE public.recipe_ingredients 
  DROP CONSTRAINT IF EXISTS recipe_ingredients_pkey CASCADE;
ALTER TABLE public.recipe_ingredients 
  ADD CONSTRAINT recipe_ingredients_pkey PRIMARY KEY (id);

-- Verificar que se crearon
SELECT 
    tc.table_name, 
    kcu.column_name
FROM information_schema.table_constraints tc
JOIN information_schema.key_column_usage kcu 
    ON tc.constraint_name = kcu.constraint_name
WHERE tc.constraint_type = 'PRIMARY KEY'
  AND tc.table_schema = 'public'
  AND tc.table_name IN ('inventory_products', 'orders', 'order_items', 'customers', 'recipes', 'recipe_ingredients')
ORDER BY tc.table_name;
