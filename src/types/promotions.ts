export interface Promotion {
    id: string
    store_id: string
    name: string
    description?: string
    discount_percentage: number
    start_date: string
    end_date: string
    is_active: boolean
    created_at: string
    updated_at: string
}

export interface CreatePromotionDTO {
    store_id: string
    name: string
    description?: string
    discount_percentage: number
    start_date: string
    end_date: string
    is_active?: boolean
}

export interface UpdatePromotionDTO extends Partial<Omit<CreatePromotionDTO, 'store_id'>> { }
