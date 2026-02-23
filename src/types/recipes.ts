export interface Recipe {
    id: string
    name: string
    description?: string
    product_id: string
    portions: number
    preparation_time_minutes?: number
    instructions?: string
    image_url?: string
    is_active: boolean
    created_at: string
    updated_at: string

    // Joined
    ingredients?: RecipeIngredient[]
    product_name?: string // From join
    product_price?: number // From join
    product_uber_price?: number
    product_uber_commission?: number
}

export interface RecipeIngredient {
    id: string
    recipe_id: string
    product_id: string
    quantity: number
    unit: string

    // Joined
    product_name?: string
    unit_cost?: number
    cost?: number // calculated
    inventory_unit?: string // joined
}

export interface CreateRecipeDTO {
    name: string
    description?: string
    product_id: string
    portions: number
    preparation_time_minutes?: number
    instructions?: string
    image_url?: string
}

export interface CreateRecipeIngredientDTO {
    recipe_id: string
    product_id: string
    quantity: number
    unit: string
}
