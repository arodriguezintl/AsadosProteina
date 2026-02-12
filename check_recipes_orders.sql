-- ============================================================================
-- VERIFICAR ESTRUCTURA DE TABLAS RECIPES Y ORDERS
-- ============================================================================

-- Ver columnas de recipes
SELECT 
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name = 'recipes'
ORDER BY ordinal_position;

-- Ver columnas de orders
SELECT 
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name = 'orders'
ORDER BY ordinal_position;

-- Ver columnas de order_items
SELECT 
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name = 'order_items'
ORDER BY ordinal_position;

-- Ver datos de ejemplo
SELECT * FROM public.recipes LIMIT 3;
SELECT * FROM public.orders LIMIT 3;
