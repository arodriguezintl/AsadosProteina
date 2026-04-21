-- =====================================================================
-- REPARACIÓN DEL MÓDULO DE RECURSOS HUMANOS (CONTROL HORARIO)
-- =====================================================================
-- Propósito: Crear las tablas necesarias que faltan en el esquema public
-- para que el código de HRService.ts funcione correctamente.
-- =====================================================================

-- 1. EXTENSIONES (Por si acaso no están en el nuevo proyecto)
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 2. TABLA DE EMPLEADOS (Alineada con src/types/hr.ts)
CREATE TABLE IF NOT EXISTS public.employees (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    store_id UUID NOT NULL REFERENCES public.stores(id),
    user_id UUID REFERENCES public.user_profiles(id),
    first_name TEXT NOT NULL,
    last_name TEXT NOT NULL,
    email TEXT,
    phone TEXT,
    position TEXT NOT NULL CHECK (position IN ('Manager', 'Cook', 'Driver', 'Cashier', 'Staff', 'Other') OR TRUE),
    salary_type TEXT NOT NULL DEFAULT 'hourly', -- 'hourly', 'weekly', 'monthly', 'per_delivery'
    salary_amount NUMERIC(10,2) NOT NULL DEFAULT 0,
    hire_date DATE DEFAULT CURRENT_DATE,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. TABLA DE TURNOS (Reloj Checador)
CREATE TABLE IF NOT EXISTS public.work_shifts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    employee_id UUID NOT NULL REFERENCES public.employees(id) ON DELETE CASCADE,
    store_id UUID NOT NULL REFERENCES public.stores(id),
    check_in TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    check_out TIMESTAMP WITH TIME ZONE,
    total_hours NUMERIC(10,2),
    notes TEXT,
    status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'completed')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. TABLA DE NÓMINAS
CREATE TABLE IF NOT EXISTS public.payrolls (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    employee_id UUID NOT NULL REFERENCES public.employees(id) ON DELETE CASCADE,
    store_id UUID NOT NULL REFERENCES public.stores(id),
    period_start DATE NOT NULL,
    period_end DATE NOT NULL,
    base_salary NUMERIC(10,2) NOT NULL DEFAULT 0,
    total_hours NUMERIC(10,2) NOT NULL DEFAULT 0,
    bonuses NUMERIC(10,2) NOT NULL DEFAULT 0,
    deductions NUMERIC(10,2) NOT NULL DEFAULT 0,
    total_paid NUMERIC(10,2) NOT NULL DEFAULT 0,
    payment_date TIMESTAMP WITH TIME ZONE,
    status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'paid')),
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 5. SEGURIDAD (RLS)
ALTER TABLE public.employees ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.work_shifts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payrolls ENABLE ROW LEVEL SECURITY;

-- Políticas simplificadas para permitir operación
DROP POLICY IF EXISTS "Enable all access for authenticated" ON public.employees;
CREATE POLICY "Enable all access for authenticated" ON public.employees FOR ALL TO authenticated USING (true);

DROP POLICY IF EXISTS "Enable all access for authenticated" ON public.work_shifts;
CREATE POLICY "Enable all access for authenticated" ON public.work_shifts FOR ALL TO authenticated USING (true);

DROP POLICY IF EXISTS "Enable all access for authenticated" ON public.payrolls;
CREATE POLICY "Enable all access for authenticated" ON public.payrolls FOR ALL TO authenticated USING (true);

-- 6. PERMISOS
GRANT ALL ON public.employees TO authenticated;
GRANT ALL ON public.work_shifts TO authenticated;
GRANT ALL ON public.payrolls TO authenticated;
GRANT ALL ON public.employees TO service_role;
GRANT ALL ON public.work_shifts TO service_role;
GRANT ALL ON public.payrolls TO service_role;

-- 7. RECARGAR CACHÉ DE POSTGREST
NOTIFY pgrst, 'reload schema';
