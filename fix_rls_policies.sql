-- ============================================================================
-- ARREGLAR POLÍTICAS RLS PARA PERMITIR INSERCIONES
-- ============================================================================
-- El problema es que las políticas RLS están bloqueando las inserciones
-- Este script crea políticas permisivas para super_admin
-- ============================================================================

-- Política para super_admin en productos (INSERT)
DROP POLICY IF EXISTS "super_admin_products_insert" ON inventory.products;
CREATE POLICY "super_admin_products_insert" ON inventory.products
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.user_profiles
      WHERE id = auth.uid() AND role = 'super_admin'
    )
  );

-- Política para super_admin en productos (UPDATE)
DROP POLICY IF EXISTS "super_admin_products_update" ON inventory.products;
CREATE POLICY "super_admin_products_update" ON inventory.products
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM public.user_profiles
      WHERE id = auth.uid() AND role = 'super_admin'
    )
  );

-- Política para super_admin en productos (DELETE)
DROP POLICY IF EXISTS "super_admin_products_delete" ON inventory.products;
CREATE POLICY "super_admin_products_delete" ON inventory.products
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM public.user_profiles
      WHERE id = auth.uid() AND role = 'super_admin'
    )
  );

-- Política para super_admin en categorías (ALL)
DROP POLICY IF EXISTS "super_admin_categories_all" ON inventory.categories;
CREATE POLICY "super_admin_categories_all" ON inventory.categories
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.user_profiles
      WHERE id = auth.uid() AND role = 'super_admin'
    )
  );

-- Política para super_admin en clientes (ALL)
DROP POLICY IF EXISTS "super_admin_customers_all" ON crm.customers;
CREATE POLICY "super_admin_customers_all" ON crm.customers
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.user_profiles
      WHERE id = auth.uid() AND role = 'super_admin'
    )
  );

-- Política para super_admin en órdenes (ALL)
DROP POLICY IF EXISTS "super_admin_orders_all" ON sales.orders;
CREATE POLICY "super_admin_orders_all" ON sales.orders
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.user_profiles
      WHERE id = auth.uid() AND role = 'super_admin'
    )
  );

-- Política para super_admin en order_items (ALL)
DROP POLICY IF EXISTS "super_admin_order_items_all" ON sales.order_items;
CREATE POLICY "super_admin_order_items_all" ON sales.order_items
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.user_profiles
      WHERE id = auth.uid() AND role = 'super_admin'
    )
  );

-- Política para super_admin en recetas (ALL)
DROP POLICY IF EXISTS "super_admin_recipes_all" ON recipes.recipes;
CREATE POLICY "super_admin_recipes_all" ON recipes.recipes
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.user_profiles
      WHERE id = auth.uid() AND role = 'super_admin'
    )
  );

-- Política para super_admin en ingredientes de recetas (ALL)
DROP POLICY IF EXISTS "super_admin_recipe_ingredients_all" ON recipes.recipe_ingredients;
CREATE POLICY "super_admin_recipe_ingredients_all" ON recipes.recipe_ingredients
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.user_profiles
      WHERE id = auth.uid() AND role = 'super_admin'
    )
  );

-- Política para super_admin en categorías financieras (ALL)
DROP POLICY IF EXISTS "super_admin_finance_categories_all" ON finance.expense_categories;
CREATE POLICY "super_admin_finance_categories_all" ON finance.expense_categories
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.user_profiles
      WHERE id = auth.uid() AND role = 'super_admin'
    )
  );

-- Política para super_admin en gastos (ALL)
DROP POLICY IF EXISTS "super_admin_expenses_all" ON finance.expenses;
CREATE POLICY "super_admin_expenses_all" ON finance.expenses
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.user_profiles
      WHERE id = auth.uid() AND role = 'super_admin'
    )
  );

-- Verificar que el usuario tiene rol super_admin
SELECT 
    up.id,
    up.full_name,
    up.role,
    au.email
FROM public.user_profiles up
JOIN auth.users au ON up.id = au.id
WHERE up.role = 'super_admin';

-- Verificar políticas activas
SELECT schemaname, tablename, policyname 
FROM pg_policies 
WHERE policyname LIKE '%super_admin%'
ORDER BY schemaname, tablename;
