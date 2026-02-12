-- ============================================================================
-- ARREGLAR POLÍTICAS RLS - VERSIÓN SIMPLIFICADA
-- ============================================================================
-- Este script crea políticas permisivas para super_admin en las tablas principales
-- ============================================================================

-- 1. PRODUCTOS (inventory.products)
DROP POLICY IF EXISTS "super_admin_products_all" ON inventory.products;
CREATE POLICY "super_admin_products_all" ON inventory.products
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.user_profiles
      WHERE id = auth.uid() AND role IN ('super_admin', 'admin')
    )
  );

-- 2. CATEGORÍAS (inventory.categories)
DROP POLICY IF EXISTS "super_admin_categories_all" ON inventory.categories;
CREATE POLICY "super_admin_categories_all" ON inventory.categories
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.user_profiles
      WHERE id = auth.uid() AND role IN ('super_admin', 'admin')
    )
  );

-- 3. CLIENTES (crm.customers)
DROP POLICY IF EXISTS "super_admin_customers_all" ON crm.customers;
CREATE POLICY "super_admin_customers_all" ON crm.customers
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.user_profiles
      WHERE id = auth.uid() AND role IN ('super_admin', 'admin', 'cashier')
    )
  );

-- 4. ÓRDENES (sales.orders)
DROP POLICY IF EXISTS "super_admin_orders_all" ON sales.orders;
CREATE POLICY "super_admin_orders_all" ON sales.orders
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.user_profiles
      WHERE id = auth.uid() AND role IN ('super_admin', 'admin', 'cashier')
    )
  );

-- 5. ITEMS DE ÓRDENES (sales.order_items)
DROP POLICY IF EXISTS "super_admin_order_items_all" ON sales.order_items;
CREATE POLICY "super_admin_order_items_all" ON sales.order_items
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.user_profiles
      WHERE id = auth.uid() AND role IN ('super_admin', 'admin', 'cashier')
    )
  );

-- 6. RECETAS (recipes.recipes)
DROP POLICY IF EXISTS "super_admin_recipes_all" ON recipes.recipes;
CREATE POLICY "super_admin_recipes_all" ON recipes.recipes
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.user_profiles
      WHERE id = auth.uid() AND role IN ('super_admin', 'admin', 'cook')
    )
  );

-- 7. INGREDIENTES DE RECETAS (recipes.recipe_ingredients)
DROP POLICY IF EXISTS "super_admin_recipe_ingredients_all" ON recipes.recipe_ingredients;
CREATE POLICY "super_admin_recipe_ingredients_all" ON recipes.recipe_ingredients
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.user_profiles
      WHERE id = auth.uid() AND role IN ('super_admin', 'admin', 'cook')
    )
  );

-- ============================================================================
-- VERIFICACIÓN
-- ============================================================================

-- Verificar que el usuario tiene rol super_admin
SELECT 
    'Tu usuario:' as info,
    up.full_name as nombre,
    up.role as rol,
    au.email as email
FROM public.user_profiles up
JOIN auth.users au ON up.id = au.id
WHERE up.id = auth.uid();

-- Verificar políticas activas
SELECT 
    schemaname as schema,
    tablename as tabla,
    policyname as politica
FROM pg_policies 
WHERE policyname LIKE '%super_admin%'
ORDER BY schemaname, tablename;
