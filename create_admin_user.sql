-- ============================================================================
-- SCRIPT PARA CREAR PERFIL DE ADMINISTRADOR
-- ============================================================================
-- 1. Primero registra tu usuario en Supabase (Authentication > Users > Add User)
-- 2. Copia este script y pégalo en el SQL Editor de Supabase
-- 3. Reemplaza 'tu_email@ejemplo.com' por el correo que registraste
-- ============================================================================

INSERT INTO public.user_profiles (id, full_name, role, store_id)
SELECT 
    id, 
    'Administrador Principal', -- Puedes cambiar el nombre aquí
    'super_admin',             -- Rol: super_admin, admin, cashier, etc.
    '00000000-0000-0000-0000-000000000001' -- ID de la tienda 'Matriz' (Predefinido)
FROM auth.users 
WHERE email = 'tu_email@ejemplo.com' -- <--- PON TU EMAIL AQUÍ
AND NOT EXISTS (
    SELECT 1 FROM public.user_profiles WHERE id = auth.users.id
);

-- Verificación
SELECT * FROM public.user_profiles WHERE role = 'super_admin';
