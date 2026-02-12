-- ==============================================================================
-- SETUP COMPLETO DE PRODUCCIÓN (Esquema + Permisos + Datos Iniciales)
-- ==============================================================================
-- Ejecuta este script ÚNICAMENTE si estás configurando una base de datos VACÍA.
-- Si ya tienes datos, usa los scripts individuales con cuidado.
-- ==============================================================================

-- 1. EXTENSIONES
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "postgis"; 

-- 2. ENUMS & TIPOS
-- NOTA: Usamos DROP ... CASCADE para asegurar que si el tipo existe incompleto, se recree bien.
-- Esto es seguro en una instalación limpia.
DROP TYPE IF EXISTS user_role CASCADE; 
CREATE TYPE user_role AS ENUM ('super_admin', 'admin', 'cashier', 'cook', 'delivery', 'accountant', 'manager');

-- Otros tipos pueden crearse con IF NOT EXISTS si no son conflictivos
DO $$ BEGIN
    CREATE TYPE module_name AS ENUM ('dashboard', 'pos', 'inventory', 'recipes', 'delivery', 'crm', 'hr', 'payroll', 'finance', 'stores', 'users', 'orders', 'reports');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- 3. TABLAS PRINCIPALES

-- Stores
CREATE TABLE IF NOT EXISTS public.stores (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  code TEXT UNIQUE NOT NULL,
  address TEXT NOT NULL,
  phone TEXT,
  manager_id UUID,
  is_active BOOLEAN DEFAULT true,
  opening_time TIME,
  closing_time TIME,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Profiles
-- IMPORTANTE: Borramos la tabla para evitar conflictos con columnas perdidas por el DROP TYPE CASCADE anterior
DROP TABLE IF EXISTS public.user_profiles CASCADE;

CREATE TABLE IF NOT EXISTS public.user_profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT NOT NULL,
  role user_role NOT NULL DEFAULT 'cashier',
  phone TEXT,
  store_id UUID REFERENCES public.stores(id),
  is_active BOOLEAN DEFAULT true,
  avatar_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Permissions
CREATE TABLE IF NOT EXISTS public.user_module_permissions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.user_profiles(id) ON DELETE CASCADE,
  module_name module_name NOT NULL,
  can_view BOOLEAN DEFAULT false,
  can_create BOOLEAN DEFAULT false,
  can_edit BOOLEAN DEFAULT false,
  can_delete BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, module_name)
);

-- Inventory Headers
CREATE SCHEMA IF NOT EXISTS inventory;

CREATE TABLE IF NOT EXISTS inventory.categories (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  type product_type NOT NULL,
  description TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS inventory.products (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  store_id UUID NOT NULL REFERENCES public.stores(id),
  category_id UUID REFERENCES inventory.categories(id),
  name TEXT NOT NULL,
  sku TEXT UNIQUE NOT NULL,
  description TEXT,
  unit_of_measure TEXT NOT NULL,
  min_stock NUMERIC(10,2) DEFAULT 0,
  current_stock NUMERIC(10,2) DEFAULT 0,
  unit_cost NUMERIC(10,2) DEFAULT 0,
  sale_price NUMERIC(10,2),
  is_active BOOLEAN DEFAULT true,
  image_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS inventory.movements (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  store_id UUID NOT NULL REFERENCES public.stores(id),
  product_id UUID NOT NULL REFERENCES inventory.products(id),
  type movement_type NOT NULL,
  quantity NUMERIC(10,2) NOT NULL,
  previous_stock NUMERIC(10,2) NOT NULL,
  new_stock NUMERIC(10,2) NOT NULL,
  cost_per_unit NUMERIC(10,2),
  reference_id UUID,
  notes TEXT,
  created_by UUID REFERENCES public.user_profiles(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Recipes
CREATE SCHEMA IF NOT EXISTS recipes;

CREATE TABLE IF NOT EXISTS recipes.recipes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  description TEXT,
  category_id UUID REFERENCES inventory.categories(id),
  portions INTEGER DEFAULT 1,
  preparation_time_minutes INTEGER,
  instructions TEXT,
  image_url TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS recipes.recipe_ingredients (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  recipe_id UUID NOT NULL REFERENCES recipes.recipes(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES inventory.products(id),
  quantity NUMERIC(10,2) NOT NULL,
  unit TEXT NOT NULL,
  UNIQUE(recipe_id, product_id)
);

-- CRM
CREATE SCHEMA IF NOT EXISTS crm;

CREATE TABLE IF NOT EXISTS crm.customers (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  full_name TEXT NOT NULL,
  phone TEXT UNIQUE NOT NULL,
  email TEXT,
  total_orders INTEGER DEFAULT 0,
  total_spent NUMERIC(10,2) DEFAULT 0,
  loyalty_points INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Sales
CREATE SCHEMA IF NOT EXISTS sales;

CREATE TABLE IF NOT EXISTS sales.orders (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  store_id UUID NOT NULL REFERENCES public.stores(id),
  order_number TEXT UNIQUE NOT NULL,
  customer_id UUID REFERENCES crm.customers(id),
  order_type order_type NOT NULL DEFAULT 'delivery',
  status order_status NOT NULL DEFAULT 'pending',
  subtotal NUMERIC(10,2) NOT NULL DEFAULT 0,
  discount NUMERIC(10,2) DEFAULT 0,
  tax NUMERIC(10,2) DEFAULT 0,
  total NUMERIC(10,2) NOT NULL DEFAULT 0,
  payment_method payment_method NOT NULL,
  payment_status payment_status NOT NULL DEFAULT 'pending',
  notes TEXT,
  created_by UUID REFERENCES public.user_profiles(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS sales.order_items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  order_id UUID NOT NULL REFERENCES sales.orders(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES inventory.products(id),
  quantity INTEGER NOT NULL,
  unit_price NUMERIC(10,2) NOT NULL,
  subtotal NUMERIC(10,2) NOT NULL,
  notes TEXT
);

-- HR & Finance Tables (Simplified for brevity but essential structure)
CREATE SCHEMA IF NOT EXISTS hr;
CREATE TABLE IF NOT EXISTS hr.employees (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES public.user_profiles(id),
  employee_number TEXT UNIQUE NOT NULL,
  full_name TEXT NOT NULL,
  position TEXT NOT NULL,
  store_id UUID REFERENCES public.stores(id),
  hire_date DATE NOT NULL,
  salary_type salary_type NOT NULL DEFAULT 'weekly',
  base_salary NUMERIC(10,2) NOT NULL,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE SCHEMA IF NOT EXISTS finance;
CREATE TABLE IF NOT EXISTS finance.transactions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  store_id UUID REFERENCES public.stores(id),
  type transaction_type NOT NULL,
  category TEXT NOT NULL,
  amount NUMERIC(10,2) NOT NULL,
  description TEXT,
  transaction_date DATE NOT NULL,
  created_by UUID REFERENCES public.user_profiles(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. SEGURIDAD Y PERMISOS (RBAC FIXES)

ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.stores ENABLE ROW LEVEL SECURITY;
ALTER TABLE inventory.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE sales.orders ENABLE ROW LEVEL SECURITY;

-- Helper function
CREATE OR REPLACE FUNCTION public.get_my_role()
RETURNS user_role AS $$
  SELECT role FROM public.user_profiles WHERE id = auth.uid();
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- Drop old policies to ensure clean slate
DROP POLICY IF EXISTS "super_admin_all_access" ON public.user_profiles;
DROP POLICY IF EXISTS "read_own_profile" ON public.user_profiles;
DROP POLICY IF EXISTS "view_products_permissions" ON inventory.products;
DROP POLICY IF EXISTS "manage_store_products" ON inventory.products;

-- Policies for Profiles
CREATE POLICY "read_own_profile" ON public.user_profiles
  FOR SELECT USING (
    id = auth.uid()
  );

CREATE POLICY "super_admin_manage_all_profiles" ON public.user_profiles
  FOR ALL USING (
    public.get_my_role() = 'super_admin'
  );

-- Policies for Products
CREATE POLICY "view_products_permissions" ON inventory.products
  FOR SELECT USING (
    store_id IN (SELECT store_id FROM public.user_profiles WHERE id = auth.uid())
    OR
    public.get_my_role() = 'super_admin'
  );

CREATE POLICY "manage_store_products" ON inventory.products
  FOR ALL USING (
    (public.get_my_role() IN ('super_admin'))
    OR
    (
      public.get_my_role() IN ('admin', 'manager') 
      AND 
      store_id IN (SELECT store_id FROM public.user_profiles WHERE id = auth.uid())
    )
  );
  
-- Grant execute
GRANT EXECUTE ON FUNCTION public.get_my_role TO authenticated;

-- 5. DATOS SEMILLA (Iniciales)

-- Tienda Default
INSERT INTO public.stores (id, name, code, address, is_active)
VALUES (
  '00000000-0000-0000-0000-000000000001',
  'Asados Proteína - Matriz',
  'GTO-01',
  'Dirección Principal',
  true
) ON CONFLICT (id) DO NOTHING;

-- Categorías Base
INSERT INTO inventory.categories (name, type, description) VALUES
  ('Lunches', 'finished_product', 'Platillos principales para venta'),
  ('Bebidas', 'finished_product', 'Bebidas para venta'),
  ('Carnes', 'raw_material', 'Insumos de carne'),
  ('Verduras', 'raw_material', 'Vegetales para recetas'),
  ('Desechables', 'consumable', 'Empaques y cubiertos')
ON CONFLICT DO NOTHING;

-- Trigger para updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_user_profiles_updated_at ON public.user_profiles;
CREATE TRIGGER update_user_profiles_updated_at BEFORE UPDATE ON public.user_profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
