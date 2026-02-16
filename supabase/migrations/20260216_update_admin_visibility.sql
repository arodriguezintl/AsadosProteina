-- ==============================================================================
-- MIGRATION: Update Admin Visibility
-- Description: Grants 'admin' role global visibility similar to 'super_admin'.
-- ==============================================================================

-- 1. Helper function for clarity (optional, but good for maintenance)
-- Already exists: public.get_my_role()

-- 2. UPDATE INVENTORY POLICIES
DROP POLICY IF EXISTS "View products" ON inventory.products;
CREATE POLICY "View products" ON inventory.products
  FOR SELECT USING (
    store_id = public.get_my_store() 
    OR 
    public.get_my_role() IN ('super_admin', 'admin')
  );

DROP POLICY IF EXISTS "View movements" ON inventory.movements;
CREATE POLICY "View movements" ON inventory.movements
  FOR SELECT USING (
    store_id = public.get_my_store() 
    OR 
    public.get_my_role() IN ('super_admin', 'admin')
  );

-- 3. UPDATE SALES/ORDERS POLICIES
DROP POLICY IF EXISTS "View orders" ON sales.orders;
CREATE POLICY "View orders" ON sales.orders
  FOR SELECT USING (
    store_id = public.get_my_store() 
    OR 
    public.get_my_role() IN ('super_admin', 'admin')
  );

DROP POLICY IF EXISTS "View order items" ON sales.order_items;
CREATE POLICY "View order items" ON sales.order_items
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM sales.orders WHERE id = sales.order_items.order_id AND (
      store_id = public.get_my_store() 
      OR 
      public.get_my_role() IN ('super_admin', 'admin')
    ))
  );

-- 4. UPDATE PROFILE VISIBILITY
DROP POLICY IF EXISTS "Admin/Manager can view profiles in their store" ON public.user_profiles;
CREATE POLICY "Admin/Manager can view profiles in their store" ON public.user_profiles
  FOR SELECT USING (
    id != auth.uid() -- Prevent recursion
    AND
    (
      (public.get_my_role() IN ('manager') AND store_id = public.get_my_store())
      OR
      public.get_my_role() IN ('super_admin', 'admin')
    )
  );

-- Fix potential recursion in Super Admin policy from previous migration
DROP POLICY IF EXISTS "super_admin_manage_all_profiles" ON public.user_profiles;
CREATE POLICY "super_admin_manage_all_profiles" ON public.user_profiles
  FOR ALL USING (
    id != auth.uid() -- Prevent recursion
    AND
    public.get_my_role() = 'super_admin'
  );

-- 5. UPDATE HR/EMPLOYEES VISIBILITY
DROP POLICY IF EXISTS "View employees" ON hr.employees;
CREATE POLICY "View employees" ON hr.employees
  FOR SELECT USING (
    (public.get_my_role() IN ('manager', 'accountant') AND store_id = public.get_my_store())
    OR
    public.get_my_role() IN ('super_admin', 'admin')
  );

-- 6. UPDATE FINANCE VISIBILITY
DROP POLICY IF EXISTS "View transactions" ON finance.transactions;
CREATE POLICY "View transactions" ON finance.transactions
  FOR SELECT USING (
    (public.get_my_role() IN ('manager', 'accountant') AND store_id = public.get_my_store())
    OR
    public.get_my_role() IN ('super_admin', 'admin')
  );

-- 7. UPDATE STORES MANAGMENT
DROP POLICY IF EXISTS "Super Admin manages stores" ON public.stores;
DROP POLICY IF EXISTS "Admins manage stores" ON public.stores;
CREATE POLICY "Admins manage stores" ON public.stores
  FOR ALL USING (public.get_my_role() IN ('super_admin', 'admin'));
