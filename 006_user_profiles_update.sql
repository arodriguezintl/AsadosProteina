-- Update user_profiles to support super_admin role

-- First, check if the role column is using an ENUM type
-- If it is, we need to add the new value to the enum
DO $$ 
BEGIN
    -- Try to add super_admin to the enum if it exists
    IF EXISTS (SELECT 1 FROM pg_type WHERE typname = 'user_role') THEN
        ALTER TYPE user_role ADD VALUE IF NOT EXISTS 'super_admin';
    END IF;
END $$;

-- If role is just TEXT, no need to modify the type
-- Just ensure the table structure is correct

-- Add missing columns if they don't exist
ALTER TABLE public.user_profiles 
ADD COLUMN IF NOT EXISTS full_name TEXT,
ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT TRUE,
ADD COLUMN IF NOT EXISTS created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();

-- Create indexes for faster queries
CREATE INDEX IF NOT EXISTS idx_user_profiles_email ON public.user_profiles(email);
CREATE INDEX IF NOT EXISTS idx_user_profiles_role ON public.user_profiles(role);
CREATE INDEX IF NOT EXISTS idx_user_profiles_store ON public.user_profiles(store_id);

-- Disable RLS (following the pattern from other tables)
ALTER TABLE public.user_profiles DISABLE ROW LEVEL SECURITY;

-- Grant permissions
GRANT ALL ON public.user_profiles TO postgres, service_role, anon, authenticated;

-- Create trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

DROP TRIGGER IF EXISTS update_user_profiles_updated_at ON public.user_profiles;
CREATE TRIGGER update_user_profiles_updated_at
    BEFORE UPDATE ON public.user_profiles
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Optional: Create a super_admin user if one doesn't exist
-- IMPORTANT: Change the email and ensure you have access to it
-- Uncomment and modify the following lines:

/*
-- First create the auth user (you'll need to do this via Supabase Dashboard or API)
-- Then insert the profile:
INSERT INTO public.user_profiles (id, email, full_name, role, is_active)
VALUES (
    'YOUR-AUTH-USER-ID-HERE',  -- Replace with actual auth user ID from Supabase Auth
    'superadmin@asadosproteina.com',
    'Super Administrador',
    'super_admin',
    true
)
ON CONFLICT (id) DO UPDATE 
SET role = 'super_admin';
*/
