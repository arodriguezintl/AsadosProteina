-- ============================================================================
-- VERIFICAR TRIGGERS Y FUNCIONES QUE ACCEDEN AL SCHEMA INVENTORY
-- ============================================================================

-- Ver todos los triggers
SELECT 
    trigger_schema,
    trigger_name,
    event_object_table,
    action_statement
FROM information_schema.triggers
WHERE event_object_table IN ('orders', 'order_items')
ORDER BY trigger_name;

-- Ver funciones que mencionan 'inventory'
SELECT 
    routine_schema,
    routine_name,
    routine_definition
FROM information_schema.routines
WHERE routine_definition LIKE '%inventory%'
ORDER BY routine_name;
