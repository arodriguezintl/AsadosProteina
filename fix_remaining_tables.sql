-- ============================================================================
-- MOVER TABLAS RESTANTES Y OTORGAR PERMISOS
-- ============================================================================

-- Verificar qué tablas faltan
SELECT table_schema, table_name
FROM information_schema.tables
WHERE table_name IN ('orders', 'order_items', 'recipes', 'recipe_ingredients', 'employees', 'user_profiles', 'delivery_orders')
ORDER BY table_schema, table_name;

-- Mover tablas a public si no están ahí
ALTER TABLE IF EXISTS sales.orders SET SCHEMA public;
ALTER TABLE IF EXISTS sales.order_items SET SCHEMA public;
ALTER TABLE IF EXISTS recipes.recipes SET SCHEMA public;
ALTER TABLE IF EXISTS recipes.recipe_ingredients SET SCHEMA public;
ALTER TABLE IF EXISTS hr.employees SET SCHEMA public;
ALTER TABLE IF EXISTS auth.user_profiles SET SCHEMA public;
ALTER TABLE IF EXISTS delivery.delivery_orders SET SCHEMA public;

-- Otorgar permisos a TODAS las tablas
GRANT ALL ON public.orders TO authenticated;
GRANT ALL ON public.order_items TO authenticated;
GRANT ALL ON public.recipes TO authenticated;
GRANT ALL ON public.recipe_ingredients TO authenticated;
GRANT ALL ON public.employees TO authenticated;
GRANT ALL ON public.user_profiles TO authenticated;
GRANT ALL ON public.delivery_orders TO authenticated;

-- Deshabilitar RLS en todas
ALTER TABLE IF EXISTS public.orders DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.order_items DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.recipes DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.recipe_ingredients DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.employees DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.user_profiles DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.delivery_orders DISABLE ROW LEVEL SECURITY;

-- Verificar resultado
SELECT table_schema, table_name
FROM information_schema.tables
WHERE table_schema = 'public'
  AND table_name IN ('orders', 'order_items', 'recipes', 'recipe_ingredients', 'employees', 'user_profiles', 'delivery_orders')
ORDER BY table_name;
