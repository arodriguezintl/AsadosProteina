-- ============================================================================
-- SOLUCIÓN RÁPIDA: REMOVER TODOS LOS SCHEMAS Y USAR PUBLIC
-- ============================================================================
-- Esta es la solución más rápida - mover todas las tablas al schema public
-- para que el código funcione sin especificar schemas
-- ============================================================================

-- ADVERTENCIA: Esto eliminará y recreará las tablas
-- Asegúrate de hacer backup de tus datos primero si tienes datos importantes

-- 1. Deshabilitar RLS temporalmente
ALTER TABLE IF EXISTS inventory.products DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS inventory.categories DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS crm.customers DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS sales.orders DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS sales.order_items DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS recipes.recipes DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS recipes.recipe_ingredients DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS finance.categories DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS finance.transactions DISABLE ROW LEVEL SECURITY;

-- 2. Mover tablas a public schema
-- Productos
ALTER TABLE IF EXISTS inventory.products SET SCHEMA public;
ALTER TABLE IF EXISTS inventory.categories SET SCHEMA public;

-- Renombrar categories de inventory a inventory_categories
ALTER TABLE IF EXISTS public.categories RENAME TO inventory_categories;

-- Clientes
ALTER TABLE IF EXISTS crm.customers SET SCHEMA public;

-- Ventas
ALTER TABLE IF EXISTS sales.orders SET SCHEMA public;
ALTER TABLE IF EXISTS sales.order_items SET SCHEMA public;

-- Recetas
ALTER TABLE IF EXISTS recipes.recipes SET SCHEMA public;
ALTER TABLE IF EXISTS recipes.recipe_ingredients SET SCHEMA public;

-- Finanzas - renombrar categories a finance_categories
ALTER TABLE IF EXISTS finance.categories RENAME TO finance_categories;
ALTER TABLE IF EXISTS finance.finance_categories SET SCHEMA public;
ALTER TABLE IF EXISTS finance.transactions SET SCHEMA public;

-- 3. Verificar que todo se movió correctamente
SELECT 
    table_schema,
    table_name
FROM information_schema.tables
WHERE table_schema = 'public'
  AND table_name IN (
    'products', 
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
