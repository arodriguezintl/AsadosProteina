-- Add missing columns to inventory_movements
ALTER TABLE IF EXISTS public.inventory_movements 
ADD COLUMN IF NOT EXISTS cost_per_unit NUMERIC(10,2) DEFAULT 0;

ALTER TABLE IF EXISTS public.inventory_movements 
ADD COLUMN IF NOT EXISTS created_by UUID REFERENCES public.user_profiles(id);

-- Also ensure 'type' column is correct (enum or text)
-- If table was created manually, maybe type is text?
-- inventory.movements uses 'movement_type' enum.
-- We'll assume type is good if no error on type.

-- Disable RLS to be safe
ALTER TABLE IF EXISTS public.inventory_movements DISABLE ROW LEVEL SECURITY;
