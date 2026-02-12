import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface AdminRequest {
    action: 'reset_password' | 'toggle_user_status' | 'update_role'
    user_id: string
    payload: any
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

        // Check permissions
        // We can fetch from local user_profiles using RLS protected store access 
        // OR fetch using SERVICE_ROLE if we trust the auth context + role check.
        // For extra safety, read user's role from user_profiles table.

        // Create Admin Client for privileged operations
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

        // Fetch requester profile using admin client to guarantee we see it
        const { data: requesterProfile, error: profileError } = await supabaseAdmin
            .from('user_profiles')
            .select('role, store_id')
            .eq('id', user.id)
            .single()

        if (profileError || !requesterProfile) {
            throw new Error('Could not fetch requester profile')
        }

        // Only SUPER_ADMIN can do these actions
        // Or maybe ADMIN/MANAGER for their own store? (Not implemented here yet)
        if (requesterProfile.role !== 'super_admin') {
            throw new Error('Only super_admin can perform admin actions')
        }

        const { action, user_id, payload }: AdminRequest = await req.json()

        if (!action || !user_id) {
            throw new Error('Missing action or user_id')
        }

        let result = null

        switch (action) {
            case 'reset_password':
                if (!payload?.password || payload.password.length < 6) {
                    throw new Error('Invalid password provided')
                }
                const { error: resetError } = await supabaseAdmin.auth.admin.updateUserById(
                    user_id,
                    { password: payload.password }
                )
                if (resetError) throw resetError
                result = { message: 'Password updated successfully' }
                break

            // Additional actions can be added here
            default:
                throw new Error(`Unknown action: ${action}`)
        }

        return new Response(
            JSON.stringify({
                success: true,
                data: result,
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
