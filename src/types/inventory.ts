export type ProductType = 'finished_product' | 'raw_material' | 'consumable' | 'service' | 'equipment'

export interface Category {
    id: string
    name: string
    type: ProductType
    description?: string
    is_active: boolean
    created_at: string
}

export interface GlobalProduct {
    id: string
    sku: string
    name: string
    description?: string
    image_url?: string
    category_id?: string
    unit_of_measure: string
    is_active: boolean
    created_at: string
    updated_at: string

    // Optional joined fields
    category?: Category
}

export interface Product {
    id: string
    store_id: string
    global_product_id: string
    current_stock: number
    min_stock: number
    unit_cost: number
    sale_price?: number
    is_active: boolean
    created_at: string
    updated_at: string

    // Joined fields (We will flatten these for the UI mostly, or keep them nested)
    // To keep backward compatibility with UI components that expect `name`, `sku` etc directly on Product,
    // we can make them optional or just use the joined structure.
    // For now, let's define the structure as it comes from the DB (nested) 
    // BUT we might want to extend it for UI convenience.

    global_product?: GlobalProduct

    // UI Helpers (these might be populated after fetch)
    name?: string
    sku?: string
    description?: string
    unit_of_measure?: string
    image_url?: string
    category_id?: string
    category?: Category
}

export interface CreateGlobalProductDTO {
    sku: string
    name: string
    description?: string
    image_url?: string
    category_id?: string
    unit_of_measure: string
    is_active?: boolean
}

export interface CreateProductDTO {
    store_id: string
    global_product_id?: string // link to existing
    // If creating new global product simultaneously:
    new_global_product?: CreateGlobalProductDTO

    min_stock: number
    unit_cost: number
    sale_price?: number
    is_active?: boolean
    current_stock?: number
}

export interface UpdateProductDTO {
    min_stock?: number
    unit_cost?: number
    sale_price?: number
    is_active?: boolean
    current_stock?: number

    // Allow updating global product details too?
    global_product_updates?: Partial<CreateGlobalProductDTO>
}

export interface CreateCategoryDTO {
    name: string
    type: ProductType
    description?: string
    is_active?: boolean
}

export interface UpdateCategoryDTO extends Partial<CreateCategoryDTO> { }

