-- ============================================================================
-- DATOS DE PRUEBA PARA ASADOS PROTEÍNA
-- ============================================================================
-- Ejecuta este script en Supabase SQL Editor para crear datos de ejemplo
-- ============================================================================

-- Productos Terminados (Finished Products)
INSERT INTO inventory.products (store_id, category_id, name, sku, unit_of_measure, min_stock, current_stock, unit_cost, sale_price, is_active)
SELECT 
    '00000000-0000-0000-0000-000000000001',
    (SELECT id FROM inventory.categories WHERE name = 'Lunches' LIMIT 1),
    'Hamburguesa Clásica',
    'LUNCH-001',
    'pza',
    5,
    20,
    35.00,
    85.00,
    true
WHERE NOT EXISTS (SELECT 1 FROM inventory.products WHERE sku = 'LUNCH-001');

INSERT INTO inventory.products (store_id, category_id, name, sku, unit_of_measure, min_stock, current_stock, unit_cost, sale_price, is_active)
SELECT 
    '00000000-0000-0000-0000-000000000001',
    (SELECT id FROM inventory.categories WHERE name = 'Lunches' LIMIT 1),
    'Ensalada César',
    'LUNCH-002',
    'pza',
    5,
    15,
    25.00,
    70.00,
    true
WHERE NOT EXISTS (SELECT 1 FROM inventory.products WHERE sku = 'LUNCH-002');

INSERT INTO inventory.products (store_id, category_id, name, sku, unit_of_measure, min_stock, current_stock, unit_cost, sale_price, is_active)
SELECT 
    '00000000-0000-0000-0000-000000000001',
    (SELECT id FROM inventory.categories WHERE name = 'Bebidas' LIMIT 1),
    'Agua Natural 600ml',
    'BEB-001',
    'pza',
    10,
    50,
    8.00,
    15.00,
    true
WHERE NOT EXISTS (SELECT 1 FROM inventory.products WHERE sku = 'BEB-001');

-- Materias Primas (Raw Materials)
INSERT INTO inventory.products (store_id, category_id, name, sku, unit_of_measure, min_stock, current_stock, unit_cost, sale_price, is_active)
SELECT 
    '00000000-0000-0000-0000-000000000001',
    (SELECT id FROM inventory.categories WHERE name = 'Carnes' LIMIT 1),
    'Carne Molida de Res',
    'MAT-001',
    'kg',
    10,
    50,
    120.00,
    NULL,
    true
WHERE NOT EXISTS (SELECT 1 FROM inventory.products WHERE sku = 'MAT-001');

INSERT INTO inventory.products (store_id, category_id, name, sku, unit_of_measure, min_stock, current_stock, unit_cost, sale_price, is_active)
SELECT 
    '00000000-0000-0000-0000-000000000001',
    (SELECT id FROM inventory.categories WHERE name = 'Abarrotes' LIMIT 1),
    'Pan para Hamburguesa',
    'MAT-002',
    'pza',
    20,
    100,
    5.00,
    NULL,
    true
WHERE NOT EXISTS (SELECT 1 FROM inventory.products WHERE sku = 'MAT-002');

INSERT INTO inventory.products (store_id, category_id, name, sku, unit_of_measure, min_stock, current_stock, unit_cost, sale_price, is_active)
SELECT 
    '00000000-0000-0000-0000-000000000001',
    (SELECT id FROM inventory.categories WHERE name = 'Vegetales' LIMIT 1),
    'Lechuga Romana',
    'MAT-003',
    'kg',
    5,
    15,
    25.00,
    NULL,
    true
WHERE NOT EXISTS (SELECT 1 FROM inventory.products WHERE sku = 'MAT-003');

-- Clientes de Prueba
INSERT INTO crm.customers (full_name, phone, email, loyalty_points, is_active)
SELECT 'Juan Pérez', '4771234567', 'juan.perez@example.com', 150, true
WHERE NOT EXISTS (SELECT 1 FROM crm.customers WHERE phone = '4771234567');

INSERT INTO crm.customers (full_name, phone, email, loyalty_points, is_active)
SELECT 'María González', '4779876543', 'maria.gonzalez@example.com', 200, true
WHERE NOT EXISTS (SELECT 1 FROM crm.customers WHERE phone = '4779876543');

INSERT INTO crm.customers (full_name, phone, email, loyalty_points, is_active)
SELECT 'Carlos Ramírez', '4775551234', 'carlos.ramirez@example.com', 75, true
WHERE NOT EXISTS (SELECT 1 FROM crm.customers WHERE phone = '4775551234');

-- Verificar datos creados
SELECT 'Productos Terminados' as tipo, COUNT(*) as cantidad FROM inventory.products WHERE sale_price IS NOT NULL
UNION ALL
SELECT 'Materias Primas', COUNT(*) FROM inventory.products WHERE sale_price IS NULL
UNION ALL
SELECT 'Clientes', COUNT(*) FROM crm.customers;
