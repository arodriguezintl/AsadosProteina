-- ==============================================================================
-- SETUP COMPLETO DE PRODUCCIÓN + RBAC + SUPERADMIN
-- ==============================================================================

-- 1. EXTENSIONES
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto"; -- Necesario para auth

-- 2. ENUMS & TIPOS
DROP TYPE IF EXISTS user_role CASCADE; 
CREATE TYPE user_role AS ENUM ('super_admin', 'admin', 'manager', 'cashier', 'cook', 'delivery', 'accountant');

DROP TYPE IF EXISTS module_name CASCADE;
CREATE TYPE module_name AS ENUM ('dashboard', 'pos', 'inventory', 'recipes', 'delivery', 'crm', 'hr', 'payroll', 'finance', 'stores', 'users', 'orders', 'reports');

DROP TYPE IF EXISTS order_status CASCADE;  -- Ensure this exists for orders
CREATE TYPE order_status AS ENUM ('pending', 'preparing', 'ready', 'in_delivery', 'completed', 'cancelled');

DROP TYPE IF EXISTS payment_method CASCADE;
CREATE TYPE payment_method AS ENUM ('cash', 'transfer', 'card');

DROP TYPE IF EXISTS movement_type CASCADE;
CREATE TYPE movement_type AS ENUM ('in', 'out', 'adjustment', 'sale', 'waste');

DROP TYPE IF EXISTS product_type CASCADE;
CREATE TYPE product_type AS ENUM ('finished_product', 'raw_material', 'consumable');

DROP TYPE IF EXISTS transaction_type CASCADE;
CREATE TYPE transaction_type AS ENUM ('income', 'expense');

DROP TYPE IF EXISTS salary_type CASCADE;
CREATE TYPE salary_type AS ENUM ('weekly', 'biweekly', 'monthly');

-- 3. TABLAS PRINCIPALES

-- CLEANUP (Para evitar errores de "Policy already exists" o tipos parciales)
DROP TABLE IF EXISTS public.user_module_permissions CASCADE;
DROP TABLE IF EXISTS public.user_profiles CASCADE;
DROP TABLE IF EXISTS public.stores CASCADE;

-- Drop schemas to clean up all module tables
DROP SCHEMA IF EXISTS inventory CASCADE;
DROP SCHEMA IF EXISTS recipes CASCADE;
DROP SCHEMA IF EXISTS crm CASCADE;
DROP SCHEMA IF EXISTS sales CASCADE;
DROP SCHEMA IF EXISTS hr CASCADE;
DROP SCHEMA IF EXISTS finance CASCADE;

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
DROP TABLE IF EXISTS public.user_profiles CASCADE;
CREATE TABLE IF NOT EXISTS public.user_profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT NOT NULL,
  email TEXT NOT NULL, 
  role user_role NOT NULL DEFAULT 'cashier',
  phone TEXT,
  store_id UUID REFERENCES public.stores(id),
  is_active BOOLEAN DEFAULT true,
  avatar_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Permissions Override (Optional granular control)
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

-- INVENTORY SCHEMA
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
  sku TEXT UNIQUE, 
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

-- RECIPES SCHEMA
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

-- CRM SCHEMA
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

-- SALES SCHEMA
CREATE SCHEMA IF NOT EXISTS sales;

CREATE TABLE IF NOT EXISTS sales.orders (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  store_id UUID NOT NULL REFERENCES public.stores(id),
  order_number TEXT UNIQUE NOT NULL,
  customer_id UUID REFERENCES crm.customers(id),
  order_type TEXT NOT NULL DEFAULT 'delivery', 
  status order_status NOT NULL DEFAULT 'pending',
  subtotal NUMERIC(10,2) NOT NULL DEFAULT 0,
  discount NUMERIC(10,2) DEFAULT 0,
  tax NUMERIC(10,2) DEFAULT 0,
  total NUMERIC(10,2) NOT NULL DEFAULT 0,
  payment_method payment_method NOT NULL,
  payment_status TEXT NOT NULL DEFAULT 'pending',
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

-- HR SCHEMA
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

-- FINANCE SCHEMA
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

-- 4. SEGURIDAD Y PERMISOS (RBAC COMPLETO)

-- Helper: Get user role
CREATE OR REPLACE FUNCTION public.get_my_role()
RETURNS user_role AS $$
  SELECT role FROM public.user_profiles WHERE id = auth.uid();
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- Helper: Get user store
CREATE OR REPLACE FUNCTION public.get_my_store()
RETURNS UUID AS $$
  SELECT store_id FROM public.user_profiles WHERE id = auth.uid();
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- Enable RLS EVERYWHERE
ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.stores ENABLE ROW LEVEL SECURITY;
ALTER TABLE inventory.categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE inventory.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE inventory.movements ENABLE ROW LEVEL SECURITY;
ALTER TABLE recipes.recipes ENABLE ROW LEVEL SECURITY;
ALTER TABLE recipes.recipe_ingredients ENABLE ROW LEVEL SECURITY;
ALTER TABLE crm.customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE sales.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE sales.order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE hr.employees ENABLE ROW LEVEL SECURITY;
ALTER TABLE finance.transactions ENABLE ROW LEVEL SECURITY;

-- POLICIES ---

-- 1. Profiles
CREATE POLICY "Users can read own profile" ON public.user_profiles
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Super Admin can manage all profiles" ON public.user_profiles
  FOR ALL USING (public.get_my_role() = 'super_admin');

CREATE POLICY "Admin/Manager can view profiles in their store" ON public.user_profiles
  FOR SELECT USING (
    public.get_my_role() IN ('admin', 'manager') AND
    store_id = public.get_my_store()
  );

-- 2. Stores
CREATE POLICY "Authenticated users can view stores" ON public.stores
  FOR SELECT TO authenticated USING (true); -- Often needed for dropdowns

CREATE POLICY "Super Admin manages stores" ON public.stores
  FOR ALL USING (public.get_my_role() = 'super_admin');

-- 3. Inventory (Products, Categories, Movements)
-- Categories: Public read (authenticated), restricted write
CREATE POLICY "View categories" ON inventory.categories FOR SELECT TO authenticated USING (true);
CREATE POLICY "Manage categories" ON inventory.categories FOR ALL USING (public.get_my_role() IN ('super_admin', 'admin'));

-- Products: Store scoped view/edit
CREATE POLICY "View products" ON inventory.products
  FOR SELECT USING (
    store_id = public.get_my_store() OR public.get_my_role() = 'super_admin'
  );

CREATE POLICY "Manage products" ON inventory.products
  FOR ALL USING (
    public.get_my_role() = 'super_admin' OR
    (public.get_my_role() IN ('admin', 'manager') AND store_id = public.get_my_store())
  );

-- Movements: Store scoped
CREATE POLICY "View movements" ON inventory.movements
  FOR SELECT USING (
    store_id = public.get_my_store() OR public.get_my_role() = 'super_admin'
  );

CREATE POLICY "Create movements" ON inventory.movements
  FOR INSERT WITH CHECK (
    store_id = public.get_my_store() AND
    public.get_my_role() IN ('super_admin', 'admin', 'manager', 'cashier', 'cook') -- Cashiers/Cooks might record waste/usage
  );

-- 4. Recipes
CREATE POLICY "View recipes" ON recipes.recipes FOR SELECT TO authenticated USING (true); -- Global recipes usually
CREATE POLICY "Manage recipes" ON recipes.recipes FOR ALL USING (public.get_my_role() IN ('super_admin', 'admin', 'manager'));

CREATE POLICY "View recipe ingredients" ON recipes.recipe_ingredients FOR SELECT TO authenticated USING (true);
CREATE POLICY "Manage recipe ingredients" ON recipes.recipe_ingredients FOR ALL USING (public.get_my_role() IN ('super_admin', 'admin', 'manager'));

-- 5. Sales (Orders)
CREATE POLICY "View orders" ON sales.orders
  FOR SELECT USING (
    store_id = public.get_my_store() OR public.get_my_role() = 'super_admin'
  );

CREATE POLICY "Manage orders" ON sales.orders
  FOR ALL USING (
    public.get_my_role() = 'super_admin' OR
    (store_id = public.get_my_store() AND public.get_my_role() IN ('admin', 'manager', 'cashier', 'delivery', 'cook'))
  );

CREATE POLICY "View order items" ON sales.order_items
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM sales.orders WHERE id = sales.order_items.order_id AND (store_id = public.get_my_store() OR public.get_my_role() = 'super_admin'))
  );

CREATE POLICY "Manage order items" ON sales.order_items
  FOR ALL USING (
    EXISTS (SELECT 1 FROM sales.orders WHERE id = sales.order_items.order_id AND (store_id = public.get_my_store() OR public.get_my_role() = 'super_admin'))
  );

-- 6. CRM (Customers)
CREATE POLICY "View customers" ON crm.customers FOR SELECT TO authenticated USING (true); -- Often shared
CREATE POLICY "Manage customers" ON crm.customers FOR ALL USING (public.get_my_role() IN ('super_admin', 'admin', 'manager', 'cashier'));

-- 7. HR
CREATE POLICY "View employees" ON hr.employees
  FOR SELECT USING (
    public.get_my_role() = 'super_admin' OR
    (public.get_my_role() IN ('admin', 'manager', 'accountant') AND store_id = public.get_my_store())
  );

CREATE POLICY "Manage employees" ON hr.employees
  FOR ALL USING (
    public.get_my_role() = 'super_admin' OR
    (public.get_my_role() = 'admin' AND store_id = public.get_my_store())
  );

-- 8. Finance
CREATE POLICY "View transactions" ON finance.transactions
  FOR SELECT USING (
    public.get_my_role() = 'super_admin' OR
    (public.get_my_role() IN ('admin', 'manager', 'accountant') AND store_id = public.get_my_store())
  );

CREATE POLICY "Manage transactions" ON finance.transactions
  FOR ALL USING (
    public.get_my_role() = 'super_admin' OR
    (public.get_my_role() IN ('admin', 'accountant') AND store_id = public.get_my_store())
  );


-- 5. GRANT PERMISSIONS
GRANT USAGE ON SCHEMA public, inventory, recipes, crm, sales, hr, finance TO authenticated;
GRANT ALL ON ALL TABLES IN SCHEMA public, inventory, recipes, crm, sales, hr, finance TO authenticated; -- RLS controls access
GRANT ALL ON ALL SEQUENCES IN SCHEMA public, inventory, recipes, crm, sales, hr, finance TO authenticated;

-- 6. SUPERADMIN HARDCODED USER (DEMO@AP.COM)
-- NOTE: This block attempts to create the user in Auth if it doesn't exist.
DO $$
DECLARE
  super_admin_id UUID := '00000000-0000-0000-0000-000000000000'; -- Fixed UUID for easier ref
  store_id UUID := '00000000-0000-0000-0000-000000000001'; -- Default store
BEGIN
  -- 1. Create Default Store
  INSERT INTO public.stores (id, name, code, address, is_active)
  VALUES (store_id, 'Asados Proteína - Matriz', 'GTO-01', 'Dirección Principal', true)
  ON CONFLICT (id) DO NOTHING;

  -- 2. Create Auth User (Check if exists first)
  IF NOT EXISTS (SELECT 1 FROM auth.users WHERE email = 'demo@ap.com') THEN
    INSERT INTO auth.users (
      id,
      instance_id,
      email,
      encrypted_password,
      email_confirmed_at,
      raw_app_meta_data,
      raw_user_meta_data,
      created_at,
      updated_at,
      role,
      aud,
      confirmation_token
    ) VALUES (
      super_admin_id,
      '00000000-0000-0000-0000-000000000000',
      'demo@ap.com',
      crypt('ops.master', gen_salt('bf', 10)), -- Password: ops.master
      NOW(),
      '{"provider":"email","providers":["email"]}',
      '{"full_name":"Super Admin"}',
      NOW(),
      NOW(),
      'authenticated',
      'authenticated',
      ''
    );
  END IF;

  -- 3. Create/Update Profile
  -- We use ON CONFLICT to ensure the profile exists and has super_admin role
  INSERT INTO public.user_profiles (id, full_name, email, role, store_id, is_active)
  VALUES (
    (SELECT id FROM auth.users WHERE email = 'demo@ap.com' LIMIT 1),
    'Super Admin',
    'demo@ap.com',
    'super_admin',
    store_id,
    true
  )
  ON CONFLICT (id) DO UPDATE SET
    role = 'super_admin',
    is_active = true;
    
END $$;
