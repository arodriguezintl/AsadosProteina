import { supabase } from '@/lib/supabase'
import type { Recipe, CreateRecipeDTO, CreateRecipeIngredientDTO, RecipeIngredient } from '@/types/recipes'

export const RecipeService = {
    async getRecipes() {
        const { data, error } = await supabase
            .from('recipes')
            .select(`
                *,
                ingredients:recipe_ingredients(
                    *,
                    product:inventory_products(
                        unit_cost,
                        name
                    )
                ),
                product:inventory_products(
                    sale_price,
                    name
                )
            `)
            .eq('is_active', true)
            .order('name')

        if (error) throw error

        // Transform data to flatten structure
        return data.map((recipe: any) => ({
            ...recipe,
            product_name: recipe.product?.name,
            product_price: recipe.product?.sale_price,
            ingredients: recipe.ingredients?.map((ing: any) => ({
                ...ing,
                product_name: ing.product?.name,
                unit_cost: ing.product?.unit_cost,
                cost: (ing.quantity * (ing.product?.unit_cost || 0))
            }))
        })) as Recipe[]
    },

    async getRecipeById(id: string) {
        const { data, error } = await supabase
            .from('recipes')
            .select(`
                *,
                ingredients:recipe_ingredients(
                    *,
                    product:inventory_products(
                        unit_cost,
                        name
                    )
                ),
                product:inventory_products(
                    sale_price,
                    name
                )
            `)
            .eq('id', id)
            .single()

        if (error) throw error

        const r = data as any

        return {
            ...r,
            product_name: r.product?.name,
            product_price: r.product?.sale_price,
            ingredients: r.ingredients?.map((ing: any) => ({
                ...ing,
                product_name: ing.product?.name,
                unit_cost: ing.product?.unit_cost,
                cost: (ing.quantity * (ing.product?.unit_cost || 0))
            }))
        } as Recipe
    },

    async createRecipe(recipe: CreateRecipeDTO) {
        const { data, error } = await supabase
            .from('recipes')
            .insert(recipe)
            .select()
            .single()

        if (error) throw error
        return data as Recipe
    },

    async updateRecipe(id: string, recipe: Partial<CreateRecipeDTO>) {
        const { data, error } = await supabase
            .from('recipes')
            .update(recipe)
            .eq('id', id)
            .select()
            .single()

        if (error) throw error
        return data as Recipe
    },

    async addIngredient(ingredient: CreateRecipeIngredientDTO) {
        const { data, error } = await supabase
            .from('recipe_ingredients')
            .insert(ingredient)
            .select()
            .single()

        if (error) throw error
        return data as RecipeIngredient
    },

    async removeIngredient(id: string) {
        const { error } = await supabase
            .from('recipe_ingredients')
            .delete()
            .eq('id', id)

        if (error) throw error
    },

    async calculateCost() {
        return 0
    }
}
