-- =====================================================================
-- FIX: Create public.inventory_global_products and update inventory
-- 
-- Root cause: The code queries inventory_products → inventory_global_products
-- → inventory_categories but public.inventory_global_products did not exist.
-- public.inventory_categories had no PRIMARY KEY constraint either.
-- =====================================================================

-- STEP 1: Add missing PRIMARY KEY to public.inventory_categories
ALTER TABLE public.inventory_categories ADD PRIMARY KEY (id);

-- STEP 2: Fix public.inventory_products - add missing PK if it lacks one
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints
        WHERE table_schema = 'public'
          AND table_name = 'inventory_products'
          AND constraint_type = 'PRIMARY KEY'
    ) THEN
        ALTER TABLE public.inventory_products ADD PRIMARY KEY (id);
    END IF;
END $$;

-- STEP 3: Create public.inventory_global_products (the global product catalog)
CREATE TABLE IF NOT EXISTS public.inventory_global_products (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    sku TEXT UNIQUE,
    name TEXT NOT NULL,
    description TEXT,
    image_url TEXT,
    category_id UUID REFERENCES public.inventory_categories(id),
    unit_of_measure TEXT NOT NULL DEFAULT 'pza',
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- STEP 4: Enable RLS + Policies
ALTER TABLE public.inventory_global_products ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Authenticated can view global products" ON public.inventory_global_products;
CREATE POLICY "Authenticated can view global products"
    ON public.inventory_global_products
    FOR SELECT TO authenticated
    USING (true);

DROP POLICY IF EXISTS "Admins/Managers can create global products" ON public.inventory_global_products;
CREATE POLICY "Admins/Managers can create global products"
    ON public.inventory_global_products
    FOR INSERT
    WITH CHECK (public.get_my_role() IN ('super_admin', 'admin', 'manager'));

DROP POLICY IF EXISTS "Admins/Managers can update global products" ON public.inventory_global_products;
CREATE POLICY "Admins/Managers can update global products"
    ON public.inventory_global_products
    FOR UPDATE
    USING (public.get_my_role() IN ('super_admin', 'admin', 'manager'));

DROP POLICY IF EXISTS "Admins/Managers can delete global products" ON public.inventory_global_products;
CREATE POLICY "Admins/Managers can delete global products"
    ON public.inventory_global_products
    FOR DELETE
    USING (public.get_my_role() IN ('super_admin', 'admin'));

-- STEP 5: Migrate existing inventory_products rows to global catalog (safety net)
INSERT INTO public.inventory_global_products (
    id, sku, name, description, image_url, category_id, unit_of_measure, is_active, created_at, updated_at
)
SELECT
    uuid_generate_v4(),
    COALESCE(NULLIF(sku, ''), gen_random_uuid()::text),
    name,
    description,
    image_url,
    category_id,
    unit_of_measure,
    is_active,
    created_at,
    updated_at
FROM public.inventory_products
ON CONFLICT (sku) DO NOTHING;

-- STEP 6: Add global_product_id FK column to inventory_products
ALTER TABLE public.inventory_products
    ADD COLUMN IF NOT EXISTS global_product_id UUID REFERENCES public.inventory_global_products(id);

-- Link existing rows to their global product
UPDATE public.inventory_products p
SET global_product_id = gp.id
FROM public.inventory_global_products gp
WHERE p.global_product_id IS NULL AND p.name = gp.name;

-- STEP 7: Grant permissions
GRANT ALL ON public.inventory_global_products TO authenticated;
GRANT ALL ON public.inventory_global_products TO service_role;

-- STEP 8: Reload PostgREST schema cache
NOTIFY pgrst, 'reload schema';
