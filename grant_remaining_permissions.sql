-- ============================================================================
-- OTORGAR PERMISOS A TABLAS EXISTENTES
-- ============================================================================

-- Otorgar permisos completos a usuarios autenticados
GRANT ALL ON public.orders TO authenticated;
GRANT ALL ON public.order_items TO authenticated;
GRANT ALL ON public.recipes TO authenticated;
GRANT ALL ON public.recipe_ingredients TO authenticated;
GRANT ALL ON public.user_profiles TO authenticated;

-- Deshabilitar RLS
ALTER TABLE IF EXISTS public.orders DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.order_items DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.recipes DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.recipe_ingredients DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.user_profiles DISABLE ROW LEVEL SECURITY;

-- Verificar permisos
SELECT 
    grantee, 
    table_name, 
    privilege_type
FROM information_schema.role_table_grants
WHERE table_schema = 'public'
  AND table_name IN ('orders', 'order_items', 'recipes', 'recipe_ingredients', 'user_profiles')
  AND grantee = 'authenticated'
ORDER BY table_name, privilege_type;
