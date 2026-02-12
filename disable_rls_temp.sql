-- ============================================================================
-- DESHABILITAR RLS TEMPORALMENTE (SOLO PARA DESARROLLO)
-- ============================================================================
-- ADVERTENCIA: Esto deshabilita la seguridad a nivel de fila
-- Solo usar en desarrollo/pruebas
-- ============================================================================

-- Deshabilitar RLS en todas las tablas principales
ALTER TABLE inventory.products DISABLE ROW LEVEL SECURITY;
ALTER TABLE inventory.categories DISABLE ROW LEVEL SECURITY;
ALTER TABLE crm.customers DISABLE ROW LEVEL SECURITY;
ALTER TABLE sales.orders DISABLE ROW LEVEL SECURITY;
ALTER TABLE sales.order_items DISABLE ROW LEVEL SECURITY;
ALTER TABLE recipes.recipes DISABLE ROW LEVEL SECURITY;
ALTER TABLE recipes.recipe_ingredients DISABLE ROW LEVEL SECURITY;

-- Verificar que RLS está deshabilitado
SELECT 
    schemaname,
    tablename,
    rowsecurity as rls_enabled
FROM pg_tables 
WHERE schemaname IN ('inventory', 'crm', 'sales', 'recipes')
ORDER BY schemaname, tablename;
