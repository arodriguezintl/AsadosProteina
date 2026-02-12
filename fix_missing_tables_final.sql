-- ============================================================================
-- RECREAR TABLAS FALTANTES (EMPLOYEES, DELIVERY, MOVEMENTS)
-- ============================================================================

-- 1. Asegurar tipos ENUM
DO $$ BEGIN
    CREATE TYPE public.salary_type AS ENUM ('weekly', 'biweekly', 'monthly');
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
    CREATE TYPE public.delivery_status AS ENUM ('assigned', 'picked_up', 'in_transit', 'delivered', 'failed');
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
    CREATE TYPE public.movement_type AS ENUM ('in', 'out', 'adjustment', 'sale', 'return');
EXCEPTION WHEN duplicate_object THEN null; END $$;

-- 2. Crear tabla EMPLOYEES en public (si no existe)
CREATE TABLE IF NOT EXISTS public.employees (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES public.user_profiles(id),
  employee_number TEXT UNIQUE NOT NULL,
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  position TEXT NOT NULL,
  store_id UUID REFERENCES public.stores(id),
  hire_date DATE NOT NULL DEFAULT CURRENT_DATE,
  salary_type public.salary_type NOT NULL DEFAULT 'weekly',
  base_salary NUMERIC(10,2) NOT NULL DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. Crear tabla DELIVERY_ORDERS en public (si no existe)
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

-- 4. Crear tabla INVENTORY_MOVEMENTS en public (si no existe)
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

-- 5. Habilitar permisos y deshabilitar RLS temporalmente
GRANT ALL ON public.employees TO authenticated;
GRANT ALL ON public.delivery_orders TO authenticated;
GRANT ALL ON public.inventory_movements TO authenticated;

ALTER TABLE public.employees DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.delivery_orders DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.inventory_movements DISABLE ROW LEVEL SECURITY;

-- 6. Insertar empleado de prueba para repartos (si no existe)
INSERT INTO public.employees (id, employee_number, first_name, last_name, position, base_salary)
VALUES 
  ('00000000-0000-0000-0000-000000000001', 'EMP-001', 'Juan', 'Repartidor', 'Repartidor', 1500.00)
ON CONFLICT (employee_number) DO NOTHING;

-- Índices básicos
CREATE INDEX IF NOT EXISTS idx_employees_store ON public.employees(store_id);
CREATE INDEX IF NOT EXISTS idx_delivery_order ON public.delivery_orders(order_id);
