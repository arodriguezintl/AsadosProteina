import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface CreateUserRequest {
  email: string
  password: string
  full_name: string
  role: 'super_admin' | 'admin' | 'manager' | 'cashier'
  store_id?: string | null
  modules?: string[]
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // Get the authorization header
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      throw new Error('No authorization header')
    }

    // Create a Supabase client with the Auth context of the logged in user
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        global: {
          headers: { Authorization: authHeader },
        },
      }
    )

    // Verify the user is authenticated and get their profile
    const {
      data: { user },
    } = await supabaseClient.auth.getUser()

    if (!user) {
      throw new Error('User not authenticated')
    }

    // Check if the user has super_admin role
    const { data: profile, error: profileError } = await supabaseClient
      .from('user_profiles')
      .select('role')
      .eq('id', user.id)
      .single()

    if (profileError || !profile) {
      throw new Error('Could not fetch user profile')
    }

    if (['super_admin', 'admin'].indexOf(profile.role) === -1) {
      throw new Error('Only super_admin or admin can create users')
    }

    // Parse the request body
    const { email, password, full_name, role, store_id, modules }: CreateUserRequest = await req.json()

    // Validate input
    if (!email || !password || !full_name || !role) {
      throw new Error('Missing required fields: email, password, full_name, role')
    }

    if (password.length < 6) {
      throw new Error('Password must be at least 6 characters')
    }

    // Additional validation for admin
    if (profile.role === 'admin') {
      if (role === 'super_admin') {
        throw new Error('Admins cannot create super_admins')
      }
      // Admins can only create users for their own store
      if (store_id && store_id !== profile.store_id) {
        throw new Error('Admins can only create users for their own store')
      }
    }

    // Create a Supabase Admin client to create the user
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      }
    )

    // Create the auth user
    const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: {
        full_name,
      },
    })

    if (authError) {
      throw new Error(`Failed to create auth user: ${authError.message}`)
    }

    if (!authData.user) {
      throw new Error('No user returned from auth creation')
    }

    const finalStoreId = profile.role === 'admin' ? profile.store_id : (store_id || null)

    // Create the user profile
    const { data: profileData, error: insertError } = await supabaseAdmin
      .from('user_profiles')
      .insert({
        id: authData.user.id,
        email,
        full_name,
        role,
        store_id: finalStoreId,
        modules: modules || [],
        is_active: true,
      })
      .select()
      .single()

    if (insertError) {
      // If profile creation fails, delete the auth user
      await supabaseAdmin.auth.admin.deleteUser(authData.user.id)
      throw new Error(`Failed to create user profile: ${insertError.message}`)
    }

    return new Response(
      JSON.stringify({
        success: true,
        user: profileData,
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    )
  } catch (error) {
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message,
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      }
    )
  }
})
