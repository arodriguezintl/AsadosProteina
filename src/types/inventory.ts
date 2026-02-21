export type ProductType = 'finished_product' | 'raw_material' | 'consumable' | 'service' | 'equipment'

export interface Category {
    id: string
    name: string
    type: ProductType
    description?: string
    is_active: boolean
    created_at: string
}

export interface Product {
    id: string
    store_id: string
    category_id?: string
    name: string
    sku: string
    description?: string
    unit_of_measure: string
    min_stock: number
    current_stock: number
    unit_cost: number
    sale_price?: number
    is_active: boolean
    image_url?: string
    created_at: string
    updated_at: string

    category?: Category
}

export interface CreateProductDTO {
    store_id: string
    category_id?: string
    name: string
    sku: string
    description?: string
    unit_of_measure: string
    min_stock: number
    current_stock?: number
    unit_cost: number
    sale_price?: number
    is_active?: boolean
    image_url?: string
}

export interface UpdateProductDTO extends Partial<Omit<CreateProductDTO, 'store_id'>> { }

export interface CreateCategoryDTO {
    name: string
    type: ProductType
    description?: string
    is_active?: boolean
}

export interface UpdateCategoryDTO extends Partial<CreateCategoryDTO> { }

