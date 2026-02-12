-- ============================================================================
-- SOLUCIÓN DEFINITIVA: RENOMBRAR Y MOVER TABLAS SIN CONFLICTOS
-- ============================================================================

-- Paso 1: Renombrar tablas en schemas específicos para evitar conflictos
ALTER TABLE IF EXISTS inventory.categories RENAME TO inventory_categories;
ALTER TABLE IF EXISTS inventory.products RENAME TO inventory_products;

-- Paso 2: Mover tablas renombradas a public
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

-- Paso 3: Deshabilitar RLS en todas las tablas
ALTER TABLE IF EXISTS public.inventory_products DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.inventory_categories DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.customers DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.orders DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.order_items DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.recipes DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.recipe_ingredients DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.finance_categories DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.transactions DISABLE ROW LEVEL SECURITY;

-- Paso 4: Verificar resultado
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
