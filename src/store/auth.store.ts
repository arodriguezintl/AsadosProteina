import { create } from 'zustand'
import { supabase } from '@/lib/supabase'
import { type UserRole } from '@/types/database.types'

interface AuthState {
    user: any | null
    role: UserRole | null
    storeId: string | null
    loading: boolean
    signIn: (email: string) => Promise<{ error: any }>
    signOut: () => Promise<void>
    checkSession: () => Promise<void>
}

export const useAuthStore = create<AuthState>((set) => ({
    user: null,
    role: null,
    storeId: null,
    loading: true,

    signIn: async (email: string) => {
        // For this phase, we use Magic Link or simple signIn (if passwordless configured)
        // Adjusting to standard Password login for now as per typical ERP requirements
        // Note: User needs to be created in Supabase Auth first
        const { error } = await supabase.auth.signInWithOtp({
            email,
            options: {
                shouldCreateUser: false,
            }
        })
        return { error }
    },

    signOut: async () => {
        await supabase.auth.signOut()
        set({ user: null, role: null, storeId: null })
    },

    checkSession: async () => {
        set({ loading: true })
        const { data: { session } } = await supabase.auth.getSession()

        if (session?.user) {
            // Fetch user profile to get role and store_id
            const { data: profile } = await supabase
                .from('user_profiles')
                .select('role, store_id')
                .eq('id', session.user.id)
                .single()



            // Use 'admin' as default for development if no profile exists
            const userRole = profile?.role || 'admin'



            set({
                user: session.user,
                role: userRole,
                storeId: profile?.store_id || null,
                loading: false
            })
        } else {
            set({ user: null, role: null, storeId: null, loading: false })
        }
    }
}))

