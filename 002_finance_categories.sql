-- Create finance schema if not exists
CREATE SCHEMA IF NOT EXISTS finance;

-- Create finance categories table
CREATE TABLE IF NOT EXISTS finance.categories (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  type VARCHAR(50) NOT NULL, -- 'income' or 'expense' (using varchar to avoid enum issues if type doesn't exist)
  description TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add category_id to transactions
-- First check if table exists (it might not if initial schema failed)
CREATE TABLE IF NOT EXISTS finance.transactions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  store_id UUID REFERENCES public.stores(id),
  type VARCHAR(50) NOT NULL,
  category TEXT, 
  amount NUMERIC(10,2) NOT NULL,
  description TEXT,
  reference_id UUID,
  payment_method VARCHAR(50),
  transaction_date DATE NOT NULL,
  created_by UUID REFERENCES public.user_profiles(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE finance.transactions 
ADD COLUMN IF NOT EXISTS category_id UUID REFERENCES finance.categories(id);

-- Make text category optional
ALTER TABLE finance.transactions 
ALTER COLUMN category DROP NOT NULL;

-- Enable RLS
ALTER TABLE finance.categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE finance.transactions ENABLE ROW LEVEL SECURITY;

-- Policies for categories
DROP POLICY IF EXISTS "view_categories" ON finance.categories;
CREATE POLICY "view_categories" ON finance.categories FOR SELECT USING (true);

DROP POLICY IF EXISTS "manage_categories" ON finance.categories;
CREATE POLICY "manage_categories" ON finance.categories FOR ALL USING (
  EXISTS (
    SELECT 1 FROM public.user_profiles
    WHERE id = auth.uid() AND role IN ('admin', 'super_admin', 'accountant')
  )
);

-- Policies for transactions
DROP POLICY IF EXISTS "view_transactions" ON finance.transactions;
CREATE POLICY "view_transactions" ON finance.transactions FOR SELECT USING (
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

DROP POLICY IF EXISTS "manage_transactions" ON finance.transactions;
CREATE POLICY "manage_transactions" ON finance.transactions FOR ALL USING (
    store_id IN (
      SELECT store_id FROM public.user_profiles
      WHERE id = auth.uid()
    )
);

-- Seed default categories
INSERT INTO finance.categories (name, type, description) 
SELECT 'Ventas', 'income', 'Ingresos por ventas de productos'
WHERE NOT EXISTS (SELECT 1 FROM finance.categories WHERE name = 'Ventas');

INSERT INTO finance.categories (name, type, description)
SELECT 'Salarios', 'expense', 'Pago de nómina'
WHERE NOT EXISTS (SELECT 1 FROM finance.categories WHERE name = 'Salarios');

INSERT INTO finance.categories (name, type, description)
SELECT 'Renta', 'expense', 'Pago de alquiler del local'
WHERE NOT EXISTS (SELECT 1 FROM finance.categories WHERE name = 'Renta');

INSERT INTO finance.categories (name, type, description)
SELECT 'Servicios', 'expense', 'Luz, agua, internet, gas'
WHERE NOT EXISTS (SELECT 1 FROM finance.categories WHERE name = 'Servicios');

INSERT INTO finance.categories (name, type, description)
SELECT 'Insumos', 'expense', 'Compra de materia prima y productos'
WHERE NOT EXISTS (SELECT 1 FROM finance.categories WHERE name = 'Insumos');

INSERT INTO finance.categories (name, type, description)
SELECT 'Mantenimiento', 'expense', 'Reparaciones y mantenimiento'
WHERE NOT EXISTS (SELECT 1 FROM finance.categories WHERE name = 'Mantenimiento');

INSERT INTO finance.categories (name, type, description)
SELECT 'Marketing', 'expense', 'Publicidad y promoción'
WHERE NOT EXISTS (SELECT 1 FROM finance.categories WHERE name = 'Marketing');

INSERT INTO finance.categories (name, type, description)
SELECT 'Otros', 'expense', 'Gastos varios'
WHERE NOT EXISTS (SELECT 1 FROM finance.categories WHERE name = 'Otros');
