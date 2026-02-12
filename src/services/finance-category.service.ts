import { supabase } from '@/lib/supabase'
import type { FinanceCategory, CreateCategoryDTO } from '@/types/finance'

export const FinanceCategoryService = {
    async getCategories() {
        const { data, error } = await supabase
            .schema('finance')
            .from('categories')
            .select('*')
            .eq('is_active', true)
            .order('name')

        if (error) throw error
        return data as FinanceCategory[]
    },

    async createCategory(category: CreateCategoryDTO) {
        const { data, error } = await supabase
            .schema('finance')
            .from('categories')
            .insert(category)
            .select()
            .single()

        if (error) throw error
        return data as FinanceCategory[]
    },

    async deleteCategory(id: string) {
        const { error } = await supabase
            .schema('finance')
            .from('categories')
            .update({ is_active: false })
            .eq('id', id)

        if (error) throw error
    }
}
