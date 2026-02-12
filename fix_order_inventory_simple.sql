-- ============================================================================
-- SIMPLIFICAR FUNCIÓN process_order_inventory (SIN MOVEMENTS)
-- ============================================================================

-- Eliminar la función antigua
DROP FUNCTION IF EXISTS sales.process_order_inventory() CASCADE;
DROP FUNCTION IF EXISTS public.process_order_inventory() CASCADE;

-- Recrear la función SIMPLIFICADA (solo actualiza stock, no registra movimientos)
CREATE OR REPLACE FUNCTION public.process_order_inventory()
RETURNS TRIGGER AS $$
BEGIN
  -- Solo actualizar stock de productos
  UPDATE public.inventory_products p
  SET current_stock = current_stock - oi.quantity
  FROM public.order_items oi
  WHERE oi.order_id = NEW.id AND oi.product_id = p.id;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Recrear el trigger en la tabla orders
DROP TRIGGER IF EXISTS process_order_inventory_trigger ON public.orders;

CREATE TRIGGER process_order_inventory_trigger
  AFTER INSERT ON public.orders
  FOR EACH ROW
  EXECUTE FUNCTION public.process_order_inventory();

-- Verificar que el trigger se creó correctamente
SELECT 
    trigger_schema,
    trigger_name,
    event_object_table,
    action_statement
FROM information_schema.triggers
WHERE event_object_table = 'orders'
ORDER BY trigger_name;
