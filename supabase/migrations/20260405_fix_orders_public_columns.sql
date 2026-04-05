-- Migration: Add missing payment detail columns to public.orders
-- Created: 2026-04-05

-- Ensure we target the public schema which is used by the frontend
ALTER TABLE public.orders 
ADD COLUMN IF NOT EXISTS referencia_pago TEXT,
ADD COLUMN IF NOT EXISTS monto_recibido NUMERIC(10,2);

COMMENT ON COLUMN public.orders.referencia_pago IS 'Para tarjeta (últimos 4 dígitos) o referencia de transferencia (SPEI/Folio)';
COMMENT ON COLUMN public.orders.monto_recibido IS 'Monto recibido en efectivo para cálculo de cambio';

-- Also ensure order_items is correctly linked in public if it exists
-- (Based on existing code, public.order_items is used)
ALTER TABLE public.order_items
ADD COLUMN IF NOT EXISTS notes TEXT;
