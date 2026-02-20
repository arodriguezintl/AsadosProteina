-- Migration: Split inventory.products into global_products and store products

-- 1. Create Global Products Table
CREATE TABLE IF NOT EXISTS inventory.global_products (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    sku TEXT UNIQUE,
    name TEXT NOT NULL,
    description TEXT,
    image_url TEXT,
    category_id UUID REFERENCES inventory.categories(id),
    unit_of_measure TEXT NOT NULL,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS on global products
ALTER TABLE inventory.global_products ENABLE ROW LEVEL SECURITY;

-- 2. Migrate existing products to global catalog
-- Insert unique SKUs. Since SKU was unique in inventory.products, this is straightforward.
INSERT INTO inventory.global_products (sku, name, description, image_url, category_id, unit_of_measure, is_active, created_at, updated_at)
SELECT 
    sku, 
    name, 
    description, 
    image_url, 
    category_id, 
    unit_of_measure, 
    true, -- All migrated products exist in the catalog
    created_at,
    updated_at
FROM inventory.products;

-- 3. Link Store Products to Global Products
ALTER TABLE inventory.products ADD COLUMN IF NOT EXISTS global_product_id UUID REFERENCES inventory.global_products(id);

-- Update the link
UPDATE inventory.products p
SET global_product_id = gp.id
FROM inventory.global_products gp
WHERE p.sku = gp.sku;

-- Enforce Not Null after migration (optional but recommended if data integrity allows)
-- ALTER TABLE inventory.products ALTER COLUMN global_product_id SET NOT NULL; 

-- 4. RLS for Global Products
-- Authenticated users can view global products (needed for searching catalog)
CREATE POLICY "Authenticated can view global products" ON inventory.global_products
    FOR SELECT TO authenticated USING (true);

-- Only Super Admin or maybe Admin can CREATE global products (or maybe allow managers to create NEW global items?)
-- For now, let's allow Admins/Managers to create global products if they don't exist
CREATE POLICY "Admins/Managers can create global products" ON inventory.global_products
    FOR INSERT WITH CHECK (public.get_my_role() IN ('super_admin', 'admin', 'manager'));
    
CREATE POLICY "Admins/Managers can update global products" ON inventory.global_products
    FOR UPDATE USING (public.get_my_role() IN ('super_admin', 'admin', 'manager'));

-- 5. Drop redundant columns from inventory.products
-- WARN: This is destructive. We run this after verifying migration logic.
ALTER TABLE inventory.products DROP COLUMN name;
ALTER TABLE inventory.products DROP COLUMN sku;
ALTER TABLE inventory.products DROP COLUMN description;
ALTER TABLE inventory.products DROP COLUMN image_url;
ALTER TABLE inventory.products DROP COLUMN category_id;
ALTER TABLE inventory.products DROP COLUMN unit_of_measure;

-- Now inventory.products is effectively "inventory.store_stocks"
