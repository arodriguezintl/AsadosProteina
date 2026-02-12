-- Script para crear perfil de usuario
-- INSTRUCCIONES:
-- 1. Ve a Authentication > Users en Supabase Dashboard
-- 2. Copia el User UID de tu usuario
-- 3. Reemplaza 'TU-USER-UID-AQUI' con ese UID
-- 4. Reemplaza el email con tu email real
-- 5. Ejecuta este script en SQL Editor

-- IMPORTANTE: Reemplaza estos valores antes de ejecutar
INSERT INTO public.user_profiles (id, email, full_name, role, is_active, store_id)
VALUES (
    'TU-USER-UID-AQUI',  -- ⚠️ REEMPLAZAR con tu User UID
    'tu-email@ejemplo.com',  -- ⚠️ REEMPLAZAR con tu email
    'Administrador',
    'admin',  -- Cambia a 'super_admin' si quieres acceso total
    true,
    '00000000-0000-0000-0000-000000000001'
)
ON CONFLICT (id) DO UPDATE 
SET 
    role = EXCLUDED.role,
    is_active = EXCLUDED.is_active,
    full_name = EXCLUDED.full_name;

-- Verificar que se creó correctamente
SELECT * FROM public.user_profiles WHERE email = 'tu-email@ejemplo.com';
