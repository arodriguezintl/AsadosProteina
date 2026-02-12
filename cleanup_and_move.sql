-- ============================================================================
-- LIMPIAR Y REORGANIZAR TABLAS - SOLUCIÓN DEFINITIVA
-- ============================================================================

-- Paso 1: Verificar qué tablas existen y en qué schemas
SELECT 
    table_schema,
    table_name
FROM information_schema.tables
WHERE table_name IN ('products', 'categories', 'inventory_products', 'inventory_categories', 'customers', 'orders', 'recipes', 'transactions')
ORDER BY table_schema, table_name;

-- Paso 2: Eliminar tablas duplicadas en public (si existen)
DROP TABLE IF EXISTS public.categories CASCADE;
DROP TABLE IF EXISTS public.products CASCADE;

-- Paso 3: Ahora sí, renombrar y mover
ALTER TABLE IF EXISTS inventory.categories RENAME TO inventory_categories;
ALTER TABLE IF EXISTS inventory.products RENAME TO inventory_products;
ALTER TABLE IF EXISTS inventory.inventory_categories SET SCHEMA public;
ALTER TABLE IF EXISTS inventory.inventory_products SET SCHEMA public;

-- Mover otras tablas
ALTER TABLE IF EXISTS crm.customers SET SCHEMA public;
ALTER TABLE IF EXISTS sales.orders SET SCHEMA public;
ALTER TABLE IF EXISTS sales.order_items SET SCHEMA public;
ALTER TABLE IF EXISTS recipes.recipes SET SCHEMA public;
ALTER TABLE IF EXISTS recipes.recipe_ingredients SET SCHEMA public;

-- Finanzas
ALTER TABLE IF EXISTS finance.categories RENAME TO finance_categories;
ALTER TABLE IF EXISTS finance.finance_categories SET SCHEMA public;
ALTER TABLE IF EXISTS finance.transactions SET SCHEMA public;

-- Paso 4: Deshabilitar RLS
ALTER TABLE IF EXISTS public.inventory_products DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.inventory_categories DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.customers DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.orders DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.order_items DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.recipes DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.recipe_ingredients DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.finance_categories DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.transactions DISABLE ROW LEVEL SECURITY;

-- Paso 5: Verificar resultado final
SELECT 
    table_schema,
    table_name
FROM information_schema.tables
WHERE table_schema = 'public'
  AND table_name IN (
    'inventory_products',
    'inventory_categories',
    'customers', 
    'orders', 
    'order_items',
    'recipes',
    'recipe_ingredients',
    'finance_categories',
    'transactions'
  )
ORDER BY table_name;
