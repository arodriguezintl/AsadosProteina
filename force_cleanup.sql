-- ============================================================================
-- SOLUCIÓN DRÁSTICA: ELIMINAR CONSTRAINTS Y RECREAR
-- ============================================================================

-- Paso 1: Eliminar el constraint problemático
ALTER TABLE IF EXISTS public.categories DROP CONSTRAINT IF EXISTS categories_pkey CASCADE;
ALTER TABLE IF EXISTS public.products DROP CONSTRAINT IF EXISTS products_pkey CASCADE;
ALTER TABLE IF EXISTS inventory.categories DROP CONSTRAINT IF EXISTS categories_pkey CASCADE;
ALTER TABLE IF EXISTS inventory.products DROP CONSTRAINT IF EXISTS products_pkey CASCADE;

-- Paso 2: Eliminar tablas duplicadas en public
DROP TABLE IF EXISTS public.categories CASCADE;
DROP TABLE IF EXISTS public.products CASCADE;

-- Paso 3: Renombrar tablas en inventory
ALTER TABLE IF EXISTS inventory.categories RENAME TO inventory_categories;
ALTER TABLE IF EXISTS inventory.products RENAME TO inventory_products;

-- Paso 4: Mover a public
ALTER TABLE IF EXISTS inventory.inventory_categories SET SCHEMA public;
ALTER TABLE IF EXISTS inventory.inventory_products SET SCHEMA public;
ALTER TABLE IF EXISTS crm.customers SET SCHEMA public;
ALTER TABLE IF EXISTS sales.orders SET SCHEMA public;
ALTER TABLE IF EXISTS sales.order_items SET SCHEMA public;
ALTER TABLE IF EXISTS recipes.recipes SET SCHEMA public;
ALTER TABLE IF EXISTS recipes.recipe_ingredients SET SCHEMA public;

-- Finanzas
ALTER TABLE IF EXISTS finance.categories RENAME TO finance_categories;
ALTER TABLE IF EXISTS finance.finance_categories SET SCHEMA public;
ALTER TABLE IF EXISTS finance.transactions SET SCHEMA public;

-- Paso 5: Deshabilitar RLS
ALTER TABLE IF EXISTS public.inventory_products DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.inventory_categories DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.customers DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.orders DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.order_items DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.recipes DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.recipe_ingredients DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.finance_categories DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.transactions DISABLE ROW LEVEL SECURITY;

-- Paso 6: Verificar
SELECT table_schema, table_name
FROM information_schema.tables
WHERE table_schema = 'public'
  AND table_name LIKE '%categor%' OR table_name LIKE '%product%'
ORDER BY table_name;
