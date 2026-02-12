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
        // Edge Function needs to be deployed first
        // Run: npx supabase login
        // Then: npx supabase functions deploy create-user --project-ref qcnjzkfgydtpudkikvky

        throw new Error(
            `⚠️ La Edge Function no está desplegada aún.\n\nPara crear usuarios manualmente:\n\n1. Ve a Supabase Dashboard → Authentication → Users\n2. Click "Add User" → "Create new user"\n3. Email: ${userData.email}\n4. Password: (segura, mínimo 6 caracteres)\n5. Auto Confirm: ✅ Activado\n6. Copia el User UID\n7. Ejecuta en SQL Editor:\n\nINSERT INTO user_profiles (id, email, full_name, role, is_active, store_id)\nVALUES ('USER-UID-AQUI', '${userData.email}', '${userData.full_name}', '${userData.role}', true, ${userData.store_id ? `'${userData.store_id}'` : 'NULL'});\n\n8. Recarga esta página\n\n📖 Ver: HOW_TO_CREATE_USERS.md`
        )
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
        const { error } = await supabase.auth.admin.updateUserById(
            userId,
            { password: newPassword }
        )

        if (error) throw error
    },

    async sendPasswordResetEmail(email: string) {
        const { error } = await supabase.auth.resetPasswordForEmail(email, {
            redirectTo: `${window.location.origin}/reset-password`
        })

        if (error) throw error
    }
}
