-- ============================================================================
-- VERIFICAR ESTRUCTURA DE LA BASE DE DATOS
-- ============================================================================
-- Este script te mostrará qué schemas y tablas existen realmente
-- ============================================================================

-- 1. Ver todos los schemas
SELECT schema_name 
FROM information_schema.schemata 
WHERE schema_name NOT IN ('information_schema', 'pg_catalog', 'pg_toast')
ORDER BY schema_name;

-- 2. Ver todas las tablas y sus schemas
SELECT 
    table_schema,
    table_name
FROM information_schema.tables
WHERE table_schema NOT IN ('information_schema', 'pg_catalog', 'pg_toast')
ORDER BY table_schema, table_name;

-- 3. Ver columnas de la tabla customers (para saber en qué schema está)
SELECT 
    table_schema,
    table_name,
    column_name,
    data_type
FROM information_schema.columns
WHERE table_name = 'customers'
ORDER BY ordinal_position;

-- 4. Ver columnas de la tabla products
SELECT 
    table_schema,
    table_name,
    column_name,
    data_type
FROM information_schema.columns
WHERE table_name = 'products'
ORDER BY ordinal_position;

-- 5. Ver columnas de la tabla categories
SELECT 
    table_schema,
    table_name,
    column_name,
    data_type
FROM information_schema.columns
WHERE table_name = 'categories'
ORDER BY ordinal_position;
