-- =====================================================
-- ERP ASADOS PROTEÍNA - ESQUEMA INICIAL
-- =====================================================

-- EXTENSIONES
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "postgis"; -- Para coordenadas de delivery

-- =====================================================
-- ENUMS
-- =====================================================

CREATE TYPE user_role AS ENUM (
  'super_admin',
  'admin',
  'cashier',
  'cook',
  'delivery',
  'accountant'
);

CREATE TYPE module_name AS ENUM (
  'dashboard',
  'pos',
  'inventory',
  'recipes',
  'delivery',
  'crm',
  'hr',
  'payroll',
  'finance',
  'stores'
);

CREATE TYPE order_type AS ENUM ('delivery', 'pickup');
CREATE TYPE order_status AS ENUM ('pending', 'preparing', 'ready', 'in_delivery', 'completed', 'cancelled');
CREATE TYPE payment_method AS ENUM ('cash', 'transfer', 'card');
CREATE TYPE payment_status AS ENUM ('pending', 'paid', 'refunded');
CREATE TYPE delivery_status AS ENUM ('assigned', 'picked_up', 'in_transit', 'delivered', 'failed');
CREATE TYPE transaction_type AS ENUM ('income', 'expense');
CREATE TYPE salary_type AS ENUM ('weekly', 'biweekly', 'monthly');
CREATE TYPE attendance_status AS ENUM ('present', 'absent', 'late', 'early_leave', 'holiday');
CREATE TYPE payroll_status AS ENUM ('draft', 'calculated', 'paid');
CREATE TYPE product_type AS ENUM ('finished_product', 'raw_material');
CREATE TYPE movement_type AS ENUM ('entry', 'exit', 'adjustment', 'transfer', 'sale');

-- =====================================================
-- TABLA: user_profiles (Perfiles de Usuario)
-- =====================================================

CREATE TABLE public.user_profiles (
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

CREATE INDEX idx_user_profiles_role ON public.user_profiles(role);
CREATE INDEX idx_user_profiles_store ON public.user_profiles(store_id);

-- =====================================================
-- TABLA: user_module_permissions (Permisos Granulares)
-- =====================================================

CREATE TABLE public.user_module_permissions (
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

CREATE INDEX idx_permissions_user ON public.user_module_permissions(user_id);

-- =====================================================
-- TABLA: stores (Tiendas/Sucursales)
-- =====================================================

CREATE TABLE public.stores (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  code TEXT UNIQUE NOT NULL, -- Ej: "GTO-01"
  address TEXT NOT NULL,
  phone TEXT,
  manager_id UUID REFERENCES public.user_profiles(id),
  is_active BOOLEAN DEFAULT true,
  opening_time TIME,
  closing_time TIME,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_stores_active ON public.stores(is_active);

-- =====================================================
-- TABLA: inventory.categories (Categorías de Productos)
-- =====================================================

CREATE SCHEMA IF NOT EXISTS inventory;

CREATE TABLE inventory.categories (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  type product_type NOT NULL,
  description TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================
-- TABLA: inventory.products (Productos e Ingredientes)
-- =====================================================

CREATE TABLE inventory.products (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  store_id UUID NOT NULL REFERENCES public.stores(id),
  category_id UUID REFERENCES inventory.categories(id),
  name TEXT NOT NULL,
  sku TEXT UNIQUE NOT NULL,
  description TEXT,
  unit_of_measure TEXT NOT NULL, -- kg, L, pza, etc.
  min_stock NUMERIC(10,2) DEFAULT 0,
  current_stock NUMERIC(10,2) DEFAULT 0,
  unit_cost NUMERIC(10,2) DEFAULT 0,
  sale_price NUMERIC(10,2), -- NULL si es materia prima
  is_active BOOLEAN DEFAULT true,
  image_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_products_store ON inventory.products(store_id);
CREATE INDEX idx_products_sku ON inventory.products(sku);
CREATE INDEX idx_products_stock_alert ON inventory.products(current_stock, min_stock) WHERE current_stock <= min_stock;

-- =====================================================
-- TABLA: inventory.movements (Movimientos de Inventario)
-- =====================================================

CREATE TABLE inventory.movements (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  store_id UUID NOT NULL REFERENCES public.stores(id),
  product_id UUID NOT NULL REFERENCES inventory.products(id),
  type movement_type NOT NULL,
  quantity NUMERIC(10,2) NOT NULL,
  previous_stock NUMERIC(10,2) NOT NULL,
  new_stock NUMERIC(10,2) NOT NULL,
  cost_per_unit NUMERIC(10,2),
  reference_id UUID, -- order_id, transfer_id, etc.
  notes TEXT,
  created_by UUID REFERENCES public.user_profiles(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_movements_product ON inventory.movements(product_id);
CREATE INDEX idx_movements_store ON inventory.movements(store_id);
CREATE INDEX idx_movements_date ON inventory.movements(created_at DESC);

-- =====================================================
-- SCHEMA: recipes (Recetas)
-- =====================================================

CREATE SCHEMA IF NOT EXISTS recipes;

CREATE TABLE recipes.recipes (
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

CREATE TABLE recipes.recipe_ingredients (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  recipe_id UUID NOT NULL REFERENCES recipes.recipes(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES inventory.products(id),
  quantity NUMERIC(10,2) NOT NULL,
  unit TEXT NOT NULL,
  UNIQUE(recipe_id, product_id)
);

-- Vista materializada para costos de recetas
CREATE MATERIALIZED VIEW recipes.recipe_costs AS
SELECT 
  r.id AS recipe_id,
  r.name AS recipe_name,
  SUM(ri.quantity * p.unit_cost) AS total_cost,
  SUM(ri.quantity * p.unit_cost) / NULLIF(r.portions, 0) AS cost_per_portion,
  NOW() AS last_calculated_at
FROM recipes.recipes r
LEFT JOIN recipes.recipe_ingredients ri ON r.id = ri.recipe_id
LEFT JOIN inventory.products p ON ri.product_id = p.id
GROUP BY r.id, r.name, r.portions;

CREATE UNIQUE INDEX idx_recipe_costs_id ON recipes.recipe_costs(recipe_id);

-- =====================================================
-- SCHEMA: sales (Ventas y PoS)
-- =====================================================

CREATE SCHEMA IF NOT EXISTS sales;

CREATE TABLE sales.orders (
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

CREATE INDEX idx_orders_store ON sales.orders(store_id);
CREATE INDEX idx_orders_status ON sales.orders(status);
CREATE INDEX idx_orders_date ON sales.orders(created_at DESC);
CREATE INDEX idx_orders_number ON sales.orders(order_number);

CREATE TABLE sales.order_items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  order_id UUID NOT NULL REFERENCES sales.orders(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES inventory.products(id),
  quantity INTEGER NOT NULL,
  unit_price NUMERIC(10,2) NOT NULL,
  subtotal NUMERIC(10,2) NOT NULL,
  notes TEXT
);

CREATE INDEX idx_order_items_order ON sales.order_items(order_id);

CREATE TABLE sales.cash_register (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  store_id UUID NOT NULL REFERENCES public.stores(id),
  user_id UUID NOT NULL REFERENCES public.user_profiles(id),
  opening_amount NUMERIC(10,2) NOT NULL,
  closing_amount NUMERIC(10,2),
  expected_amount NUMERIC(10,2),
  difference NUMERIC(10,2),
  notes TEXT,
  opened_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  closed_at TIMESTAMP WITH TIME ZONE
);

CREATE INDEX idx_cash_register_store ON sales.cash_register(store_id);
CREATE INDEX idx_cash_register_user ON sales.cash_register(user_id);

-- =====================================================
-- SCHEMA: delivery (Entregas)
-- =====================================================

CREATE SCHEMA IF NOT EXISTS delivery;

CREATE TABLE delivery.delivery_orders (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  order_id UUID NOT NULL REFERENCES sales.orders(id) ON DELETE CASCADE,
  delivery_person_id UUID REFERENCES hr.employees(id),
  customer_address TEXT NOT NULL,
  delivery_coordinates GEOGRAPHY(POINT, 4326),
  estimated_time_minutes INTEGER,
  actual_delivery_time TIMESTAMP WITH TIME ZONE,
  delivery_fee NUMERIC(10,2) DEFAULT 0,
  status delivery_status NOT NULL DEFAULT 'assigned',
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_delivery_order ON delivery.delivery_orders(order_id);
CREATE INDEX idx_delivery_person ON delivery.delivery_orders(delivery_person_id);
CREATE INDEX idx_delivery_status ON delivery.delivery_orders(status);

-- =====================================================
-- SCHEMA: crm (Gestión de Clientes)
-- =====================================================

CREATE SCHEMA IF NOT EXISTS crm;

CREATE TABLE crm.customers (
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

CREATE INDEX idx_customers_phone ON crm.customers(phone);

CREATE TABLE crm.customer_addresses (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  customer_id UUID NOT NULL REFERENCES crm.customers(id) ON DELETE CASCADE,
  label TEXT NOT NULL, -- "Casa", "Oficina", etc.
  address TEXT NOT NULL,
  coordinates GEOGRAPHY(POINT, 4326),
  is_default BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_addresses_customer ON crm.customer_addresses(customer_id);

-- =====================================================
-- SCHEMA: hr (Recursos Humanos)
-- =====================================================

CREATE SCHEMA IF NOT EXISTS hr;

CREATE TABLE hr.employees (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES public.user_profiles(id),
  employee_number TEXT UNIQUE NOT NULL,
  full_name TEXT NOT NULL,
  position TEXT NOT NULL,
  store_id UUID REFERENCES public.stores(id),
  hire_date DATE NOT NULL,
  birth_date DATE,
  curp TEXT UNIQUE,
  rfc TEXT UNIQUE,
  nss TEXT, -- Número de Seguro Social
  salary_type salary_type NOT NULL DEFAULT 'weekly',
  base_salary NUMERIC(10,2) NOT NULL,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_employees_store ON hr.employees(store_id);
CREATE INDEX idx_employees_number ON hr.employees(employee_number);

CREATE TABLE hr.attendance (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  employee_id UUID NOT NULL REFERENCES hr.employees(id),
  store_id UUID NOT NULL REFERENCES public.stores(id),
  date DATE NOT NULL,
  check_in TIMESTAMP WITH TIME ZONE,
  check_out TIMESTAMP WITH TIME ZONE,
  hours_worked NUMERIC(4,2),
  status attendance_status NOT NULL DEFAULT 'present',
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(employee_id, date)
);

CREATE INDEX idx_attendance_employee ON hr.attendance(employee_id);
CREATE INDEX idx_attendance_date ON hr.attendance(date DESC);

-- =====================================================
-- SCHEMA: payroll (Nómina)
-- =====================================================

CREATE SCHEMA IF NOT EXISTS payroll;

CREATE TABLE payroll.payroll_periods (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  period_start DATE NOT NULL,
  period_end DATE NOT NULL,
  payment_date DATE NOT NULL,
  status payroll_status NOT NULL DEFAULT 'draft',
  created_by UUID REFERENCES public.user_profiles(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(period_start, period_end)
);

CREATE TABLE payroll.payroll_entries (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  period_id UUID NOT NULL REFERENCES payroll.payroll_periods(id) ON DELETE CASCADE,
  employee_id UUID NOT NULL REFERENCES hr.employees(id),
  base_salary NUMERIC(10,2) NOT NULL,
  hours_worked NUMERIC(6,2) DEFAULT 0,
  overtime_hours NUMERIC(6,2) DEFAULT 0,
  bonuses NUMERIC(10,2) DEFAULT 0,
  gross_salary NUMERIC(10,2) NOT NULL,
  isr_deduction NUMERIC(10,2) DEFAULT 0,
  imss_deduction NUMERIC(10,2) DEFAULT 0,
  other_deductions NUMERIC(10,2) DEFAULT 0,
  net_salary NUMERIC(10,2) NOT NULL,
  payment_method payment_method,
  payment_reference TEXT,
  paid_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(period_id, employee_id)
);

CREATE INDEX idx_payroll_entries_period ON payroll.payroll_entries(period_id);
CREATE INDEX idx_payroll_entries_employee ON payroll.payroll_entries(employee_id);

-- =====================================================
-- SCHEMA: finance (Finanzas)
-- =====================================================

CREATE SCHEMA IF NOT EXISTS finance;

CREATE TABLE finance.transactions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  store_id UUID REFERENCES public.stores(id),
  type transaction_type NOT NULL,
  category TEXT NOT NULL, -- "Ventas", "Salarios", "Compras", etc.
  amount NUMERIC(10,2) NOT NULL,
  description TEXT,
  reference_id UUID, -- order_id, payroll_id, etc.
  payment_method payment_method,
  transaction_date DATE NOT NULL,
  created_by UUID REFERENCES public.user_profiles(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_transactions_store ON finance.transactions(store_id);
CREATE INDEX idx_transactions_date ON finance.transactions(transaction_date DESC);
CREATE INDEX idx_transactions_type ON finance.transactions(type);

-- =====================================================
-- FUNCIONES Y TRIGGERS
-- =====================================================

-- Trigger para actualizar updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Aplicar trigger a tablas relevantes
CREATE TRIGGER update_user_profiles_updated_at BEFORE UPDATE ON public.user_profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_products_updated_at BEFORE UPDATE ON inventory.products
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_orders_updated_at BEFORE UPDATE ON sales.orders
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Trigger para descontar inventario al crear orden
CREATE OR REPLACE FUNCTION sales.process_order_inventory()
RETURNS TRIGGER AS $$
BEGIN
  -- Descontar stock de cada producto en la orden
  UPDATE inventory.products p
  SET current_stock = current_stock - oi.quantity
  FROM sales.order_items oi
  WHERE oi.order_id = NEW.id AND oi.product_id = p.id;
  
  -- Registrar movimientos
  INSERT INTO inventory.movements (store_id, product_id, type, quantity, previous_stock, new_stock, reference_id, created_by)
  SELECT 
    NEW.store_id,
    oi.product_id,
    'sale'::movement_type,
    -oi.quantity,
    p.current_stock + oi.quantity,
    p.current_stock,
    NEW.id,
    NEW.created_by
  FROM sales.order_items oi
  JOIN inventory.products p ON oi.product_id = p.id
  WHERE oi.order_id = NEW.id;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_process_order_inventory
AFTER INSERT ON sales.orders
FOR EACH ROW EXECUTE FUNCTION sales.process_order_inventory();

-- =====================================================
-- ROW LEVEL SECURITY (RLS) - POLÍTICAS BASE
-- =====================================================

-- Habilitar RLS en todas las tablas
ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_module_permissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.stores ENABLE ROW LEVEL SECURITY;
ALTER TABLE inventory.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE sales.orders ENABLE ROW LEVEL SECURITY;
-- ... (aplicar a todas las tablas)

-- Política para super_admin (acceso total)
CREATE POLICY "super_admin_all_access" ON public.user_profiles
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.user_profiles
      WHERE id = auth.uid() AND role = 'super_admin'
    )
  );

-- Política para usuarios ver su propia tienda
CREATE POLICY "store_isolation" ON inventory.products
  FOR SELECT USING (
    store_id IN (
      SELECT store_id FROM public.user_profiles
      WHERE id = auth.uid()
    )
    OR
    EXISTS (
      SELECT 1 FROM public.user_profiles
      WHERE id = auth.uid() AND role = 'super_admin'
    )
  );

-- =====================================================
-- DATOS SEMILLA (SEED)
-- =====================================================

-- Insertar tienda inicial
INSERT INTO public.stores (id, name, code, address, phone, opening_time, closing_time)
VALUES (
  '00000000-0000-0000-0000-000000000001',
  'Asados Proteína - Matriz',
  'GTO-01',
  'Guanajuato, México',
  '+52 xxx xxx xxxx',
  '09:00:00',
  '18:00:00'
);

-- Categorías iniciales
INSERT INTO inventory.categories (name, type) VALUES
  ('Lunches', 'finished_product'),
  ('Bebidas', 'finished_product'),
  ('Carnes', 'raw_material'),
  ('Vegetales', 'raw_material'),
  ('Abarrotes', 'raw_material');

-- =====================================================
-- FIN DEL ESQUEMA INICIAL
-- =====================================================