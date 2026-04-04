-- Migration: Add payment details to orders
-- Created: 2026-03-23

ALTER TABLE sales.orders 
ADD COLUMN IF NOT EXISTS referencia_pago TEXT,
ADD COLUMN IF NOT EXISTS monto_recibido NUMERIC(10,2);

COMMENT ON COLUMN sales.orders.referencia_pago IS 'Para tarjeta (últimos 4 dígitos) o referencia de transferencia (SPEI/Folio)';
COMMENT ON COLUMN sales.orders.monto_recibido IS 'Monto recibido en efectivo para cálculo de cambio';
