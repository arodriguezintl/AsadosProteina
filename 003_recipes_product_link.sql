-- Add product_id to recipes to link with inventory.products
ALTER TABLE recipes.recipes 
ADD COLUMN IF NOT EXISTS product_id UUID REFERENCES inventory.products(id);

CREATE INDEX IF NOT EXISTS idx_recipes_product ON recipes.recipes(product_id);

-- Add unique constraint to ensure one recipe per product (optional but good practice for now)
-- ALTER TABLE recipes.recipes ADD CONSTRAINT unique_product_recipe UNIQUE (product_id);
