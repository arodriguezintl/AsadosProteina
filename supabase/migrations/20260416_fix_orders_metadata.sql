-- Migration: Fix missing metadata column in public.orders
-- This column was added to sales.orders in a previous migration but the app uses public.orders.

ALTER TABLE public.orders 
ADD COLUMN IF NOT EXISTS metadata JSONB DEFAULT '{}'::jsonb;

COMMENT ON COLUMN public.orders.metadata IS 'Metadata for order origin tracking (e.g. source: city-ex)';

-- Also ensure RLS is correctly updated for external clients if needed
-- (The policy for manage orders might already cover it, but let's double check common permissions)
