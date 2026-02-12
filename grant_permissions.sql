-- ============================================================================
-- OTORGAR PERMISOS A TODAS LAS TABLAS
-- ============================================================================

-- Otorgar permisos completos a usuarios autenticados
GRANT ALL ON public.inventory_products TO authenticated;
GRANT ALL ON public.inventory_categories TO authenticated;
GRANT ALL ON public.customers TO authenticated;
GRANT ALL ON public.orders TO authenticated;
GRANT ALL ON public.order_items TO authenticated;
GRANT ALL ON public.recipes TO authenticated;
GRANT ALL ON public.recipe_ingredients TO authenticated;
GRANT ALL ON public.finance_categories TO authenticated;
GRANT ALL ON public.transactions TO authenticated;

-- Otorgar permisos a anon (para operaciones públicas si las hay)
GRANT SELECT ON public.inventory_products TO anon;
GRANT SELECT ON public.inventory_categories TO anon;

-- Verificar permisos
SELECT 
    grantee, 
    table_schema, 
    table_name, 
    privilege_type
FROM information_schema.role_table_grants
WHERE table_schema = 'public'
  AND table_name IN (
    'inventory_products',
    'inventory_categories',
    'customers',
    'orders',
    'recipes',
    'finance_categories',
    'transactions'
  )
ORDER BY table_name, grantee;
