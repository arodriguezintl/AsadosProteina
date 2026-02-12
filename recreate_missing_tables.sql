-- ============================================================================
-- RECREAR TABLA delivery_orders Y TIPOS NECESARIOS
-- ============================================================================

-- Asegurar que el tipo enum existe (si no existe, lo creamos)
DO $$ BEGIN
    CREATE TYPE public.delivery_status AS ENUM ('assigned', 'picked_up', 'in_transit', 'delivered', 'failed');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Crear tabla delivery_orders en public
CREATE TABLE IF NOT EXISTS public.delivery_orders (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  order_id UUID NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
  delivery_person_id UUID REFERENCES public.employees(id),
  delivery_address TEXT NOT NULL,
  delivery_coordinates GEOGRAPHY(POINT, 4326),
  estimated_time_minutes INTEGER,
  actual_delivery_time TIMESTAMP WITH TIME ZONE,
  delivery_fee NUMERIC(10,2) DEFAULT 0,
  status public.delivery_status NOT NULL DEFAULT 'assigned',
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Habilitar permisos
GRANT ALL ON public.delivery_orders TO authenticated;
GRANT ALL ON public.delivery_orders TO anon;

-- Deshabilitar RLS temporalmente para facilitar pruebas
ALTER TABLE public.delivery_orders DISABLE ROW LEVEL SECURITY;

-- Crear índices
CREATE INDEX IF NOT EXISTS idx_delivery_order ON public.delivery_orders(order_id);
CREATE INDEX IF NOT EXISTS idx_delivery_person ON public.delivery_orders(delivery_person_id);
CREATE INDEX IF NOT EXISTS idx_delivery_status ON public.delivery_orders(status);

-- También recrear inventory_movements si falta (vi error antes)
DO $$ BEGIN
    CREATE TYPE public.movement_type AS ENUM ('in', 'out', 'adjustment', 'sale', 'return');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

CREATE TABLE IF NOT EXISTS public.inventory_movements (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  store_id UUID,
  product_id UUID NOT NULL REFERENCES public.inventory_products(id),
  type public.movement_type NOT NULL,
  quantity NUMERIC(10,2) NOT NULL,
  previous_stock NUMERIC(10,2),
  new_stock NUMERIC(10,2),
  reference_id UUID,
  notes TEXT,
  created_by UUID,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

GRANT ALL ON public.inventory_movements TO authenticated;
ALTER TABLE public.inventory_movements DISABLE ROW LEVEL SECURITY;
