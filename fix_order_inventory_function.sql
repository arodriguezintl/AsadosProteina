-- ============================================================================
-- ACTUALIZAR FUNCIÓN process_order_inventory PARA USAR SCHEMA PUBLIC
-- ============================================================================

-- Primero, eliminar la función antigua
DROP FUNCTION IF EXISTS sales.process_order_inventory() CASCADE;

-- Recrear la función en el schema public con las referencias correctas
CREATE OR REPLACE FUNCTION public.process_order_inventory()
RETURNS TRIGGER AS $$
BEGIN
  -- Actualizar stock de productos
  UPDATE public.inventory_products p
  SET current_stock = current_stock - oi.quantity
  FROM public.order_items oi
  WHERE oi.order_id = NEW.id AND oi.product_id = p.id;
  
  -- Registrar movimientos de inventario (solo si la tabla existe)
  INSERT INTO public.inventory_movements (store_id, product_id, type, quantity, previous_stock, new_stock, reference_id, created_by)
  SELECT 
    NEW.store_id,
    oi.product_id,
    'sale'::movement_type,
    -oi.quantity,
    p.current_stock + oi.quantity,
    p.current_stock,
    NEW.id,
    NEW.created_by
  FROM public.order_items oi
  JOIN public.inventory_products p ON oi.product_id = p.id
  WHERE oi.order_id = NEW.id;
  
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
