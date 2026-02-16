-- Migration: Add store_id to customers and update RLS policies for segmentation

-- 1. Add store_id column to customers table
ALTER TABLE public.customers 
ADD COLUMN IF NOT EXISTS store_id UUID REFERENCES public.stores(id);

-- 2. Update existing customers to belong to 'Matriz' (ID: 00000000-0000-0000-0000-000000000001)
-- Only update if store_id is NULL
UPDATE public.customers 
SET store_id = '00000000-0000-0000-0000-000000000001' 
WHERE store_id IS NULL;

-- 3. Make store_id NOT NULL after backfilling
ALTER TABLE public.customers 
ALTER COLUMN store_id SET NOT NULL;

-- 4. Drop existing policies
DROP POLICY IF EXISTS "View customers" ON public.customers;
DROP POLICY IF EXISTS "Manage customers" ON public.customers;

-- 5. Create new RLS policies

-- Policy: Admin/Super Admin can view ALL customers
CREATE POLICY "Admins can view all customers"
ON public.customers
FOR SELECT
TO authenticated
USING (
    get_my_role() IN ('super_admin', 'admin')
);

-- Policy: Managers/Cashiers can view ONLY their store's customers
CREATE POLICY "Staff can view own store customers"
ON public.customers
FOR SELECT
TO authenticated
USING (
    get_my_role() IN ('manager', 'cashier') 
    AND 
    store_id = get_my_store()
);

-- Policy: Admin/Super Admin can manage ALL customers
CREATE POLICY "Admins can manage all customers"
ON public.customers
FOR ALL
TO authenticated
USING (
    get_my_role() IN ('super_admin', 'admin')
)
WITH CHECK (
    get_my_role() IN ('super_admin', 'admin')
);

-- Policy: Managers/Cashiers can manage ONLY their store's customers
CREATE POLICY "Staff can manage own store customers"
ON public.customers
FOR ALL
TO authenticated
USING (
    get_my_role() IN ('manager', 'cashier') 
    AND 
    store_id = get_my_store()
)
WITH CHECK (
    get_my_role() IN ('manager', 'cashier') 
    AND 
    store_id = get_my_store()
);
