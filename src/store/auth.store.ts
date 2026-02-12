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
    checkSession: () => Promise<void>
}

export const useAuthStore = create<AuthState>((set) => ({
    user: null,
    role: null,
    storeId: null,
    modules: [],
    loading: true,

    signIn: async (email: string, password?: string) => {
        console.log('Attempting sign in for:', email, 'Password provided:', !!password)
        try {
            if (password) {
                const { data, error } = await supabase.auth.signInWithPassword({
                    email,
                    password
                })
                console.log('Sign in with password result:', { success: !!data?.user, error })
                return { error }
            } else {
                const { data, error } = await supabase.auth.signInWithOtp({
                    email,
                    options: {
                        shouldCreateUser: false,
                    }
                })
                console.log('Sign in with OTP result:', { data: !!data, error })
                return { error }
            }
        } catch (err) {
            console.error('Sign in exception:', err)
            return { error: err }
        }
    },

    signOut: async () => {
        await supabase.auth.signOut()
        set({ user: null, role: null, storeId: null, modules: [] })
    },

    checkSession: async () => {
        try {
            set({ loading: true })
            const { data: { session }, error: sessionError } = await supabase.auth.getSession()

            if (sessionError) {
                console.error('Error fetching session:', sessionError)
                set({ user: null, role: null, storeId: null, modules: [], loading: false })
                return
            }

            if (session?.user) {
                const { data: profile, error } = await supabase
                    .from('user_profiles')
                    .select('role, store_id, modules')
                    .eq('id', session.user.id)
                    .single()

                if (error) {
                    console.error('Error fetching user profile:', error)
                }

                if (!profile) {
                    console.warn('No user profile found for ID:', session.user.id)
                }
                console.log('DEBUG COMPETO PERFIL:', profile);

                // Use 'admin' as default ONLY if we really can't find a role, but warn about it.
                // If profile is null, this defaults to 'admin' which lets them in but maybe with wrong perms?
                // Better to handle the "no profile" case more gracefully in UI, but for now ensure we don't crash.
                const userRole = profile?.role || 'admin'
                let storeId = profile?.store_id
                const modules = profile?.modules || []

                // Fallback: If no store assigned, try to get the first available store (Development/Setup helper)
                if (!storeId) {
                    const { data: stores } = await supabase
                        .from('stores')
                        .select('id')
                        .limit(1)

                    if (stores && stores.length > 0) {
                        storeId = stores[0].id
                    }
                }

                console.log('Session loaded for:', session.user.email, 'Role:', userRole, 'Modules:', modules)

                set({
                    user: session.user,
                    role: userRole,
                    storeId: storeId || null,
                    modules,
                    loading: false
                })
            } else {
                set({ user: null, role: null, storeId: null, modules: [], loading: false })
            }
        } catch (error) {
            console.error('Unexpected error in checkSession:', error)
            set({ user: null, role: null, storeId: null, modules: [], loading: false })
        } finally {
            set({ loading: false })
        }
    }
}))

