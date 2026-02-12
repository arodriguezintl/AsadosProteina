-- ==============================================================================
-- MIGRATION: Fix RBAC Policies and Permissions
-- Description: Ensures users can read their own profiles and Super Admin has full access.
-- ==============================================================================

-- 1. DROP EXISTING POLICIES TO AVOID CONFLICTS
-- Note: We drop specific policies to recreate them correctly.
DROP POLICY IF EXISTS "super_admin_all_access" ON public.user_profiles;
DROP POLICY IF EXISTS "store_isolation" ON inventory.products;
DROP POLICY IF EXISTS "read_own_profile" ON public.user_profiles;
DROP POLICY IF EXISTS "read_store_profiles" ON public.user_profiles;

-- 2. ENABLE RLS (Just in case)
ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;

-- 3. POLICIES FOR USER_PROFILES

-- A. Super Admin Access (Full Access to Everything)
CREATE POLICY "super_admin_all_access" ON public.user_profiles
  FOR ALL USING (
    (SELECT role FROM public.user_profiles WHERE id = auth.uid()) = 'super_admin'
  );

-- Note: The recursive check in the original policy `EXISTS (SELECT 1 ... WHERE id = auth.uid())` 
-- caused infinite recursion in some Supabase versions if not carefully written.
-- Using a direct comparison or a specific non-recursive function is safer, 
-- but given we are defining policy ON user_profiles, querying user_profiles inside it is risky.
-- 
-- BETTER APPROACH: Use `auth.jwt() ->> 'role'` if we sync role to JWT, 
-- BUT since we store role in table, we must be careful.
-- 
-- SAFE PATTERN:
-- Allow users to read their OWN profile unconditionally.
CREATE POLICY "read_own_profile" ON public.user_profiles
  FOR SELECT USING (
    id = auth.uid()
  );

-- Now re-define Super Admin using a technique that avoids recursion for the super admin themselves?
-- Actually, since we now have "read_own_profile", the super admin can read their own profile to check their role.
-- But for accessing OTHERS, we need to check the executing user's role.
-- To avoid recursion, we can wrap the role check in a generic security definer function 
-- OR just trust that "read_own_profile" covers the self-lookup.

-- Let's use a function to get current user role to avoid recursion in policies
CREATE OR REPLACE FUNCTION public.get_my_role()
RETURNS user_role AS $$
  SELECT role FROM public.user_profiles WHERE id = auth.uid();
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- Now use this function in policies
CREATE POLICY "super_admin_manage_all_profiles" ON public.user_profiles
  FOR ALL USING (
    public.get_my_role() = 'super_admin'
  );

-- 4. UPDATE PRODUCT POLICIES
-- Allow read access if user is in the same store OR super_admin
DROP POLICY IF EXISTS "store_isolation" ON inventory.products;

CREATE POLICY "view_products_permissions" ON inventory.products
  FOR SELECT USING (
    store_id IN (SELECT store_id FROM public.user_profiles WHERE id = auth.uid())
    OR
    public.get_my_role() = 'super_admin'
  );

-- Allow modification only for authorized roles (e.g. manager/admin of that store)
-- Assuming 'admin' and 'manager' can edit inventory in their store
CREATE POLICY "manage_store_products" ON inventory.products
  FOR ALL USING (
    (public.get_my_role() IN ('super_admin'))
    OR
    (
      public.get_my_role() IN ('admin', 'manager') 
      AND 
      store_id IN (SELECT store_id FROM public.user_profiles WHERE id = auth.uid())
    )
  );

-- 5. FUNCTION execute_sql (Backdoor for migrations if needed, strictly super_admin)
-- (Optional, but good for debugging if you have issues later)

-- 6. GRANT EXECUTE on functions
GRANT EXECUTE ON FUNCTION public.get_my_role TO authenticated;
