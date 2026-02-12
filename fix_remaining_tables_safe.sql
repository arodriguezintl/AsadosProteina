-- ============================================================================
-- VERIFICAR Y MOVER SOLO TABLAS EXISTENTES
-- ============================================================================

-- Paso 1: Ver qué tablas existen y en qué schemas
SELECT table_schema, table_name
FROM information_schema.tables
WHERE table_name IN ('orders', 'order_items', 'recipes', 'recipe_ingredients', 'employees', 'user_profiles', 'delivery_orders')
ORDER BY table_schema, table_name;

-- Paso 2: Mover solo las que existen (ejecuta solo las líneas que correspondan a tablas que viste arriba)
-- Si la tabla está en sales schema:
ALTER TABLE IF EXISTS sales.orders SET SCHEMA public;
ALTER TABLE IF EXISTS sales.order_items SET SCHEMA public;

-- Si la tabla está en recipes schema:
ALTER TABLE IF EXISTS recipes.recipes SET SCHEMA public;
ALTER TABLE IF EXISTS recipes.recipe_ingredients SET SCHEMA public;

-- Si la tabla está en hr schema:
ALTER TABLE IF EXISTS hr.employees SET SCHEMA public;

-- Si la tabla está en auth schema:
ALTER TABLE IF EXISTS auth.user_profiles SET SCHEMA public;

-- Si la tabla está en delivery schema:
ALTER TABLE IF EXISTS delivery.delivery_orders SET SCHEMA public;

-- Paso 3: Otorgar permisos a las tablas que SÍ existen en public
GRANT ALL ON public.orders TO authenticated;
GRANT ALL ON public.order_items TO authenticated;
GRANT ALL ON public.recipes TO authenticated;
GRANT ALL ON public.recipe_ingredients TO authenticated;

-- Solo si employees existe:
-- GRANT ALL ON public.employees TO authenticated;

-- Solo si user_profiles existe:
-- GRANT ALL ON public.user_profiles TO authenticated;

-- Solo si delivery_orders existe:
-- GRANT ALL ON public.delivery_orders TO authenticated;

-- Paso 4: Deshabilitar RLS
ALTER TABLE IF EXISTS public.orders DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.order_items DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.recipes DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.recipe_ingredients DISABLE ROW LEVEL SECURITY;

-- Paso 5: Verificar resultado
SELECT table_schema, table_name
FROM information_schema.tables
WHERE table_schema = 'public'
  AND table_name IN ('orders', 'order_items', 'recipes', 'recipe_ingredients', 'employees', 'user_profiles', 'delivery_orders')
ORDER BY table_name;
