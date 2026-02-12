import { supabase } from '@/lib/supabase'
import type { UserProfile, CreateUserDTO } from '@/types/database.types'

export const UserService = {
    async getUsers() {
        const { data, error } = await supabase
            .from('user_profiles')
            .select('*')
            .order('created_at', { ascending: false })

        if (error) throw error
        return data as UserProfile[]
    },

    async getUserById(id: string) {
        const { data, error } = await supabase
            .from('user_profiles')
            .select('*')
            .eq('id', id)
            .single()

        if (error) throw error
        return data as UserProfile
    },

    async createUser(userData: CreateUserDTO) {
        const { data, error } = await supabase.functions.invoke('create-user', {
            body: userData
        })

        if (error) throw error
        return data
    },

    async updateUser(id: string, updates: Partial<UserProfile>) {
        const { data, error } = await supabase
            .from('user_profiles')
            .update(updates)
            .eq('id', id)
            .select()
            .single()

        if (error) throw error
        return data as UserProfile
    },

    async deactivateUser(id: string) {
        const { error } = await supabase
            .from('user_profiles')
            .update({ is_active: false })
            .eq('id', id)

        if (error) throw error
    },

    async activateUser(id: string) {
        const { error } = await supabase
            .from('user_profiles')
            .update({ is_active: true })
            .eq('id', id)

        if (error) throw error
    },

    async resetPassword(userId: string, newPassword: string) {
        // Use Edge Function for admin operations securely
        const { error } = await supabase.functions.invoke('admin-action', {
            body: {
                action: 'reset_password',
                user_id: userId,
                payload: { password: newPassword }
            }
        })

        if (error) throw error
    },

    async sendPasswordResetEmail(email: string) {
        const { error } = await supabase.auth.resetPasswordForEmail(email, {
            redirectTo: `${window.location.origin}/reset-password`
        })

        if (error) throw error
    }
}
