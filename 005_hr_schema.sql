-- HR and Payroll Schema

-----------------------------
-- 1. Employees (Refined)
-----------------------------
-- Assuming 'employees' table exists very simply, let's redefine or ensure it has needed fields.
-- We might need to link it to user_profiles if employees have login access.
-- For now, let's keep it separate or link via user_id.

CREATE TABLE IF NOT EXISTS public.employees (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    store_id UUID REFERENCES public.stores(id),
    user_id UUID REFERENCES public.user_profiles(id), -- Optional link to login
    first_name TEXT NOT NULL,
    last_name TEXT NOT NULL,
    email TEXT,
    phone TEXT,
    position TEXT NOT NULL, -- 'Manager', 'Cook', 'Driver', 'Cashier'
    salary_type TEXT NOT NULL, -- 'hourly', 'monthly', 'per_delivery'
    salary_amount NUMERIC(10,2) NOT NULL DEFAULT 0,
    hire_date DATE DEFAULT CURRENT_DATE,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Index for quick lookup
CREATE INDEX IF NOT EXISTS idx_employees_store ON public.employees(store_id);

-----------------------------
-- 2. Time Tracking (Control Horario)
-----------------------------
CREATE TABLE IF NOT EXISTS public.work_shifts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    employee_id UUID NOT NULL REFERENCES public.employees(id),
    store_id UUID NOT NULL REFERENCES public.stores(id),
    check_in TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    check_out TIMESTAMP WITH TIME ZONE,
    total_hours NUMERIC(5,2), -- Calculated on checkout
    notes TEXT,
    status TEXT DEFAULT 'active', -- 'active', 'completed'
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_shifts_employee ON public.work_shifts(employee_id);
CREATE INDEX IF NOT EXISTS idx_shifts_date ON public.work_shifts(check_in);

-----------------------------
-- 3. Payroll (Nómina)
-----------------------------
CREATE TABLE IF NOT EXISTS public.payrolls (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    employee_id UUID NOT NULL REFERENCES public.employees(id),
    store_id UUID REFERENCES public.stores(id),
    period_start DATE NOT NULL,
    period_end DATE NOT NULL,
    base_salary NUMERIC(10,2) NOT NULL,
    total_hours NUMERIC(10,2) DEFAULT 0, -- If hourly
    bonuses NUMERIC(10,2) DEFAULT 0,
    deductions NUMERIC(10,2) DEFAULT 0,
    total_paid NUMERIC(10,2) NOT NULL,
    payment_date DATE DEFAULT CURRENT_DATE,
    status TEXT DEFAULT 'draft', -- 'draft', 'paid'
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_payroll_employee ON public.payrolls(employee_id);
CREATE INDEX IF NOT EXISTS idx_payroll_period ON public.payrolls(period_start, period_end);

-- Policies (Disable RLS for simplicity as requested often, or enable if needed)
ALTER TABLE public.employees DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.work_shifts DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.payrolls DISABLE ROW LEVEL SECURITY;
