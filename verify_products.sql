-- ============================================================================
-- VERIFICAR QUE EL PRODUCTO SE CREÓ
-- ============================================================================

-- Ver todos los productos creados
SELECT * FROM public.inventory_products ORDER BY created_at DESC LIMIT 10;

-- Ver todas las categorías
SELECT * FROM public.inventory_categories ORDER BY created_at DESC LIMIT 10;

-- Ver clientes
SELECT * FROM public.customers ORDER BY created_at DESC LIMIT 10;

-- Contar registros
SELECT 
    'inventory_products' as tabla, 
    COUNT(*) as total 
FROM public.inventory_products
UNION ALL
SELECT 
    'inventory_categories' as tabla, 
    COUNT(*) as total 
FROM public.inventory_categories
UNION ALL
SELECT 
    'customers' as tabla, 
    COUNT(*) as total 
FROM public.customers;
