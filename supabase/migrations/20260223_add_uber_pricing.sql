-- Add columns to support channel margin calculation (Uber Eats)
ALTER TABLE public.inventory_products
    ADD COLUMN IF NOT EXISTS uber_price NUMERIC(10, 2),
    ADD COLUMN IF NOT EXISTS uber_commission NUMERIC(5, 4) DEFAULT 0.30;
