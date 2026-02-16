import { supabase } from '@/lib/supabase'

export interface Store {
    id: string
    name: string
    code: string
    address: string
    phone: string | null
    manager_id: string | null
    is_active: boolean
    opening_time: string | null
    closing_time: string | null
    created_at?: string
}

export const StoreService = {
    async getStores() {
        const { data, error } = await supabase
            .from('stores')
            .select('*')
            .order('name')

        if (error) throw error
        return data
    },

    async createStore(storeData: Omit<Store, 'id' | 'created_at'>) {
        const { data, error } = await supabase
            .from('stores')
            .insert(storeData)
            .select()
            .single()

        if (error) throw error
        return data
    },

    async updateStore(id: string, updates: Partial<Store>) {
        const { data, error } = await supabase
            .from('stores')
            .update(updates)
            .eq('id', id)
            .select()
            .single()

        if (error) throw error
        return data
    },

    async deleteStore(id: string) {
        const { error } = await supabase
            .from('stores')
            .delete()
            .eq('id', id)

        if (error) throw error
    },

    async toggleActive(id: string, isActive: boolean) {
        const { error } = await supabase
            .from('stores')
            .update({ is_active: isActive })
            .eq('id', id)

        if (error) throw error
    }
}
