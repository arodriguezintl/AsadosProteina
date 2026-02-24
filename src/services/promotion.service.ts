import { supabase } from '@/lib/supabase'
import type { Promotion, CreatePromotionDTO, UpdatePromotionDTO } from '@/types/promotions'

export const PromotionService = {
    getPromotions: async (storeId: string): Promise<Promotion[]> => {
        const { data, error } = await supabase
            .from('promotions')
            .select('*')
            .eq('store_id', storeId)
            .order('created_at', { ascending: false })

        if (error) throw error
        return data as Promotion[]
    },

    getPromotionById: async (id: string): Promise<Promotion> => {
        const { data, error } = await supabase
            .from('promotions')
            .select('*')
            .eq('id', id)
            .single()

        if (error) throw error
        return data as Promotion
    },

    createPromotion: async (promotionParams: CreatePromotionDTO): Promise<Promotion> => {
        const { data, error } = await supabase
            .from('promotions')
            .insert([promotionParams])
            .select()
            .single()

        if (error) throw error
        return data as Promotion
    },

    updatePromotion: async (id: string, promotionParams: UpdatePromotionDTO): Promise<Promotion> => {
        const { data, error } = await supabase
            .from('promotions')
            .update(promotionParams)
            .eq('id', id)
            .select()
            .single()

        if (error) throw error
        return data as Promotion
    }
}
