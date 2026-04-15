-- ==============================================================================
-- MIGRACIÓN: CITY EXPRESS MVP SETUP
-- ==============================================================================

-- 1. Añadimos el nuevo rol 'external_client' al ENUM existente
-- Nota: IF NOT EXISTS no funciona directamente con ADD VALUE en versiones antiguas de PG, 
-- pero Supabase lo soporta o usamos este catch.
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type t JOIN pg_enum e ON t.oid = e.enumtypid WHERE t.typname = 'user_role' AND e.enumlabel = 'external_client') THEN
        ALTER TYPE user_role ADD VALUE 'external_client';
    END IF;
END $$;

-- 2. Añadimos branding_config a user_profiles para personalización de logo/empresa
ALTER TABLE public.user_profiles 
ADD COLUMN IF NOT EXISTS branding_config JSONB DEFAULT '{}'::jsonb;

-- 3. Añadimos metadata a las órdenes para identificar el origen (ej. 'source': 'city-ex')
ALTER TABLE sales.orders 
ADD COLUMN IF NOT EXISTS metadata JSONB DEFAULT '{}'::jsonb;

-- 4. Comentario informativo: 
-- Para activar el MVP, crear un usuario en Auth y asignarle en user_profiles:
-- role = 'external_client'
-- branding_config = '{"client_name": "City Express", "logo_url": "URL_DEL_LOGO"}'
