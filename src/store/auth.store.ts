import { create } from 'zustand'
import { supabase } from '@/lib/supabase'
import { type UserRole } from '@/types/database.types'

interface AuthState {
    user: any | null
    role: UserRole | null
    storeId: string | null
    modules: string[]
    loading: boolean
    signIn: (email: string, password?: string) => Promise<{ error: any }>
    signOut: () => Promise<void>
    reset: () => void
    checkSession: () => Promise<void>
}

export const useAuthStore = create<AuthState>((set, get) => ({
    user: null,
    role: null,
    storeId: null,
    modules: [],
    loading: true,

    signIn: async (email: string, password?: string) => {
        console.log('Attempting sign in for:', email)
        try {
            set({ loading: true })
            if (password) {
                const { data, error } = await supabase.auth.signInWithPassword({
                    email,
                    password
                })

                if (error) {
                    set({ loading: false })
                    return { error }
                }

                if (data.user) {
                    // Explicitly load session data before returning to ensure UI has correct state
                    console.log('Login successful, loading user profile...')
                    await get().checkSession()
                }

                return { error: null }
            } else {
                // Magic Link path (kept for reference or backward compat, though UI removed it)
                const { error } = await supabase.auth.signInWithOtp({
                    email,
                    options: { shouldCreateUser: false }
                })
                set({ loading: false })
                return { error }
            }
        } catch (err) {
            console.error('Sign in exception:', err)
            set({ loading: false })
            return { error: err }
        }
    },

    signOut: async () => {
        try {
            await supabase.auth.signOut()
        } catch (error) {
            console.error('Error signing out:', error)
        } finally {
            // Force a hard reload to clear all state and stop any potential infinite loops
            localStorage.removeItem('sb-hoaixbdbswvfzyijxrhy-auth-token') // Optional: clear Supabase token if key is known
            window.location.href = '/login'
        }
    },

    reset: () => {
        set({ user: null, role: null, storeId: null, modules: [], loading: false })
    },

    checkSession: async () => {
        try {
            const { data: { session }, error: sessionError } = await supabase.auth.getSession()

            if (sessionError) {
                console.error('Error fetching session:', sessionError)
                set({ user: null, role: null, storeId: null, modules: [], loading: false })
                return
            }

            if (!session?.user) {
                set({ user: null, role: null, storeId: null, modules: [], loading: false })
                return
            }

            // Only set loading to true if we are actually fetching profile data and current user is different or not set?
            // But simplify: just fetch profile.

            const { data: profile, error } = await supabase
                .from('user_profiles')
                .select('role, store_id, modules')
                .eq('id', session.user.id)
                .single()

            if (error) {
                console.error('Error fetching user profile:', error)
            }

            const userRole = profile?.role || 'admin'
            let userStoreId = profile?.store_id
            const userModules = profile?.modules || []

            // Fallback: If no store assigned, try to get the first available store (Development/Setup helper)
            if (!userStoreId) {
                const { data: stores } = await supabase
                    .from('stores')
                    .select('id')
                    .limit(1)

                if (stores && stores.length > 0) {
                    userStoreId = stores[0].id
                }
            }

            console.log('Session loaded for:', session.user.email, 'Role:', userRole, 'Modules:', userModules)

            set({
                user: session.user,
                role: userRole,
                storeId: userStoreId || null,
                modules: userModules,
                loading: false
            })

        } catch (error) {
            console.error('Unexpected error in checkSession:', error)
            set({ user: null, role: null, storeId: null, modules: [], loading: false })
        }
    }
}))

