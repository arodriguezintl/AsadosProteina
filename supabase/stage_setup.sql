-- ==============================================================================
-- SETUP SCRIPT FOR STAGING ENVIRONMENT (UAT)
-- This script combines all production migrations to set up a fresh database.
-- Run this in the SQL Editor of your new 'asados-proteina-stage' Supabase project.
-- ==============================================================================

-- 1. BASE CONFIG & EXTENSIONS
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- 2. ENUMS & TYPES
DO $$ BEGIN
    CREATE TYPE user_role AS ENUM ('super_admin', 'admin', 'manager', 'cashier', 'cook', 'delivery', 'accountant');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
    CREATE TYPE module_name AS ENUM ('dashboard', 'pos', 'inventory', 'recipes', 'delivery', 'crm', 'hr', 'payroll', 'finance', 'stores', 'users', 'orders', 'reports');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
    CREATE TYPE order_status AS ENUM ('pending', 'preparing', 'ready', 'in_delivery', 'completed', 'cancelled');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
    CREATE TYPE payment_method AS ENUM ('cash', 'transfer', 'card');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
    CREATE TYPE movement_type AS ENUM ('in', 'out', 'adjustment', 'sale', 'waste');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
    CREATE TYPE product_type AS ENUM ('finished_product', 'raw_material', 'consumable');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
    CREATE TYPE transaction_type AS ENUM ('income', 'expense');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
    CREATE TYPE salary_type AS ENUM ('weekly', 'biweekly', 'monthly');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- 3. SCHEMAS
CREATE SCHEMA IF NOT EXISTS inventory;
CREATE SCHEMA IF NOT EXISTS recipes;
CREATE SCHEMA IF NOT EXISTS crm;
CREATE SCHEMA IF NOT EXISTS sales;
CREATE SCHEMA IF NOT EXISTS hr;
CREATE SCHEMA IF NOT EXISTS finance;

-- 4. CORE TABLES

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

-- Helper Functions (Defined early for RLS/Policies)
CREATE OR REPLACE FUNCTION public.get_my_role()
RETURNS user_role AS $$
  SELECT role FROM public.user_profiles WHERE id = auth.uid();
$$ LANGUAGE sql SECURITY DEFINER STABLE;

CREATE OR REPLACE FUNCTION public.get_my_store()
RETURNS UUID AS $$
  SELECT store_id FROM public.user_profiles WHERE id = auth.uid();
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- 5. INVENTORY TABLES

-- Categories
CREATE TABLE IF NOT EXISTS inventory.categories (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  type product_type NOT NULL,
  description TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Global Products (New Architecture)
CREATE TABLE IF NOT EXISTS inventory.global_products (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    sku TEXT UNIQUE,
    name TEXT NOT NULL,
    description TEXT,
    image_url TEXT,
    category_id UUID REFERENCES inventory.categories(id),
    unit_of_measure TEXT NOT NULL,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Store Stock (Inventory Products)
CREATE TABLE IF NOT EXISTS inventory.products (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  store_id UUID NOT NULL REFERENCES public.stores(id),
  global_product_id UUID REFERENCES inventory.global_products(id),
  min_stock NUMERIC(10,2) DEFAULT 0,
  current_stock NUMERIC(10,2) DEFAULT 0,
  unit_cost NUMERIC(10,2) DEFAULT 0,
  sale_price NUMERIC(10,2),
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Movements
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

-- 6. RECIPES TABLES
CREATE TABLE IF NOT EXISTS recipes.recipes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  description TEXT,
  product_id UUID, -- Optional link to finished product
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

-- 7. CRM TABLES
CREATE TABLE IF NOT EXISTS crm.customers (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  full_name TEXT NOT NULL,
  phone TEXT UNIQUE NOT NULL,
  email TEXT,
  store_id UUID NOT NULL DEFAULT '00000000-0000-0000-0000-000000000001' REFERENCES public.stores(id),
  total_orders INTEGER DEFAULT 0,
  total_spent NUMERIC(10,2) DEFAULT 0,
  loyalty_points INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 8. SALES TABLES
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

CREATE TABLE IF NOT EXISTS sales.delivery_orders (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    order_id UUID REFERENCES sales.orders(id),
    delivery_person_id UUID REFERENCES public.user_profiles(id),
    status TEXT DEFAULT 'pending',
    delivery_address TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 9. HR Tables
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

-- 10. FINANCE TABLES
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

-- 11. ENABLE RLS
ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.stores ENABLE ROW LEVEL SECURITY;
ALTER TABLE inventory.categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE inventory.global_products ENABLE ROW LEVEL SECURITY;
ALTER TABLE inventory.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE inventory.movements ENABLE ROW LEVEL SECURITY;
ALTER TABLE recipes.recipes ENABLE ROW LEVEL SECURITY;
ALTER TABLE recipes.recipe_ingredients ENABLE ROW LEVEL SECURITY;
ALTER TABLE crm.customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE sales.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE sales.order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE hr.employees ENABLE ROW LEVEL SECURITY;
ALTER TABLE finance.transactions ENABLE ROW LEVEL SECURITY;

-- 12. PERMISSIONS & GRANTS
GRANT USAGE ON SCHEMA public, inventory, recipes, crm, sales, hr, finance TO authenticated;
GRANT ALL ON ALL TABLES IN SCHEMA public, inventory, recipes, crm, sales, hr, finance TO authenticated;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public, inventory, recipes, crm, sales, hr, finance TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_my_role TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_my_store TO authenticated;

-- 13. POLICIES (LATEST VERSIONS)

-- User Profiles
CREATE POLICY "read_own_profile" ON public.user_profiles FOR SELECT USING (id = auth.uid());
CREATE POLICY "super_admin_manage_all_profiles" ON public.user_profiles FOR ALL USING (public.get_my_role() = 'super_admin');
CREATE POLICY "Admin/Manager can view profiles in their store" ON public.user_profiles FOR SELECT USING (
    store_id = public.get_my_store() AND public.get_my_role() IN ('admin', 'manager')
);

-- Stores
CREATE POLICY "Authenticated users can view stores" ON public.stores FOR SELECT TO authenticated USING (true);
CREATE POLICY "Admins manage stores" ON public.stores FOR ALL USING (public.get_my_role() IN ('super_admin', 'admin'));

-- Inventory
CREATE POLICY "View categories" ON inventory.categories FOR SELECT TO authenticated USING (true);
CREATE POLICY "Manage categories" ON inventory.categories FOR ALL USING (public.get_my_role() IN ('super_admin', 'admin'));

CREATE POLICY "Authenticated can view global products" ON inventory.global_products FOR SELECT TO authenticated USING (true);
CREATE POLICY "Admins/Managers can create global products" ON inventory.global_products FOR INSERT WITH CHECK (public.get_my_role() IN ('super_admin', 'admin', 'manager'));
CREATE POLICY "Admins/Managers can update global products" ON inventory.global_products FOR UPDATE USING (public.get_my_role() IN ('super_admin', 'admin', 'manager'));

CREATE POLICY "View products" ON inventory.products FOR SELECT USING (store_id = public.get_my_store() OR public.get_my_role() IN ('super_admin', 'admin'));
CREATE POLICY "manage_store_products" ON inventory.products FOR ALL USING (
    public.get_my_role() = 'super_admin' OR (public.get_my_role() IN ('admin', 'manager') AND store_id = public.get_my_store())
);

CREATE POLICY "View movements" ON inventory.movements FOR SELECT USING (store_id = public.get_my_store() OR public.get_my_role() IN ('super_admin', 'admin'));
CREATE POLICY "Create movements" ON inventory.movements FOR INSERT WITH CHECK (
    store_id = public.get_my_store() AND public.get_my_role() IN ('super_admin', 'admin', 'manager', 'cashier', 'cook')
);

-- Recipes
CREATE POLICY "View recipes" ON recipes.recipes FOR SELECT TO authenticated USING (true);
CREATE POLICY "Manage recipes" ON recipes.recipes FOR ALL USING (public.get_my_role() IN ('super_admin', 'admin', 'manager'));
CREATE POLICY "View recipe ingredients" ON recipes.recipe_ingredients FOR SELECT TO authenticated USING (true);
CREATE POLICY "Manage recipe ingredients" ON recipes.recipe_ingredients FOR ALL USING (public.get_my_role() IN ('super_admin', 'admin', 'manager'));

-- CRM
CREATE POLICY "Admins can view all customers" ON crm.customers FOR SELECT TO authenticated USING (get_my_role() IN ('super_admin', 'admin'));
CREATE POLICY "Staff can view own store customers" ON crm.customers FOR SELECT TO authenticated USING (get_my_role() IN ('manager', 'cashier') AND store_id = get_my_store());
CREATE POLICY "Admins can manage all customers" ON crm.customers FOR ALL TO authenticated USING (get_my_role() IN ('super_admin', 'admin'));
CREATE POLICY "Staff can manage own store customers" ON crm.customers FOR ALL TO authenticated USING (get_my_role() IN ('manager', 'cashier') AND store_id = get_my_store());

-- Sales
CREATE POLICY "View orders" ON sales.orders FOR SELECT USING (store_id = public.get_my_store() OR public.get_my_role() IN ('super_admin', 'admin'));
CREATE POLICY "Manage orders" ON sales.orders FOR ALL USING (
    public.get_my_role() = 'super_admin' OR (store_id = public.get_my_store() AND public.get_my_role() IN ('admin', 'manager', 'cashier', 'delivery', 'cook'))
);

-- HR
CREATE POLICY "View employees" ON hr.employees FOR SELECT USING (
    (public.get_my_role() IN ('manager', 'accountant') AND store_id = public.get_my_store()) OR public.get_my_role() IN ('super_admin', 'admin')
);
CREATE POLICY "Manage employees" ON hr.employees FOR ALL USING (
    public.get_my_role() = 'super_admin' OR (public.get_my_role() = 'admin' AND store_id = public.get_my_store())
);

-- Finance
CREATE POLICY "View transactions" ON finance.transactions FOR SELECT USING (
    (public.get_my_role() IN ('manager', 'accountant') AND store_id = public.get_my_store()) OR public.get_my_role() IN ('super_admin', 'admin')
);
CREATE POLICY "Manage transactions" ON finance.transactions FOR ALL USING (
    public.get_my_role() = 'super_admin' OR (public.get_my_role() IN ('admin', 'accountant') AND store_id = public.get_my_store())
);

-- 14. INITIAL DATA (SEED)
-- Default Store
INSERT INTO public.stores (id, name, code, address, is_active)
VALUES ('00000000-0000-0000-0000-000000000001', 'Asados Proteína - Stage (Pruebas)', 'STG-01', 'Entorno de Pruebas', true)
ON CONFLICT (id) DO NOTHING;

-- Super Admin created user manually linked... 
-- NOTE: In a fresh project, you need to sign up a user first or use the Auth UI to create one, then link it here.
-- This script CANNOT create the Auth user for you, only the profile.
