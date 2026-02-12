-- ============================================================================
-- VERIFICAR ESTRUCTURA DE LA TABLA CUSTOMERS
-- ============================================================================

-- Ver todas las columnas de customers
SELECT 
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name = 'customers'
ORDER BY ordinal_position;

-- Ver datos de ejemplo
SELECT * FROM public.customers LIMIT 5;
