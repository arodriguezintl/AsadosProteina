-- ============================================================================
-- EXPONER SCHEMAS EN LA API DE SUPABASE
-- ============================================================================
-- Supabase solo expone el schema 'public' por defecto
-- Necesitamos agregar los otros schemas a la API
-- ============================================================================

-- 1. Verificar qué schemas están expuestos actualmente
SELECT schema_name 
FROM information_schema.schemata 
WHERE schema_name IN ('public', 'inventory', 'crm', 'sales', 'recipes', 'finance', 'hr', 'delivery')
ORDER BY schema_name;

-- 2. SOLUCIÓN: Necesitas ir a Supabase Dashboard y hacer esto:
-- 
-- A) Ve a: Settings → API → Exposed schemas
-- B) Agrega estos schemas a la lista:
--    - inventory
--    - crm
--    - sales
--    - recipes
--    - finance
--    - hr
--    - delivery
--
-- C) Guarda los cambios
--
-- ESTO ES CRÍTICO: Sin exponer los schemas, Supabase no puede acceder a las tablas

-- ============================================================================
-- ALTERNATIVA: MOVER TODO AL SCHEMA PUBLIC
-- ============================================================================
-- Si no puedes exponer los schemas, esta es la solución más rápida:

-- Deshabilitar RLS primero
ALTER TABLE IF EXISTS inventory.products DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS inventory.categories DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS crm.customers DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS sales.orders DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS sales.order_items DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS recipes.recipes DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS recipes.recipe_ingredients DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS finance.categories DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS finance.transactions DISABLE ROW LEVEL SECURITY;

-- Mover tablas a public
ALTER TABLE IF EXISTS inventory.products SET SCHEMA public;
ALTER TABLE IF EXISTS inventory.categories SET SCHEMA public;
ALTER TABLE IF EXISTS crm.customers SET SCHEMA public;
ALTER TABLE IF EXISTS sales.orders SET SCHEMA public;
ALTER TABLE IF EXISTS sales.order_items SET SCHEMA public;
ALTER TABLE IF EXISTS recipes.recipes SET SCHEMA public;
ALTER TABLE IF EXISTS recipes.recipe_ingredients SET SCHEMA public;

-- Renombrar categories de finance para evitar conflicto
ALTER TABLE IF EXISTS finance.categories RENAME TO finance_categories;
ALTER TABLE IF EXISTS finance.finance_categories SET SCHEMA public;
ALTER TABLE IF EXISTS finance.transactions SET SCHEMA public;

-- Verificar que todo se movió
SELECT 
    table_schema,
    table_name
FROM information_schema.tables
WHERE table_name IN (
    'products', 
    'categories',
    'customers', 
    'orders', 
    'order_items',
    'recipes',
    'recipe_ingredients',
    'finance_categories',
    'transactions'
)
ORDER BY table_schema, table_name;
