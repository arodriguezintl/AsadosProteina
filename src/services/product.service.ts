import { supabase } from '@/lib/supabase'
import type { Product, Category, CreateProductDTO, UpdateProductDTO, CreateCategoryDTO, UpdateCategoryDTO } from '@/types/inventory'

export const ProductService = {
    async getProducts(storeId: string) {
        const { data, error } = await supabase
            .from('inventory_products')
            .select('*')
            .eq('store_id', storeId)
            .order('name')

        if (error) throw error
        return data as Product[]
    },

    async getCategories() {
        const { data, error } = await supabase
            .from('inventory_categories')
            .select('*')
            .eq('is_active', true)
            .order('name')

        if (error) throw error
        return data as Category[]
    },

    async createCategory(category: CreateCategoryDTO) {
        const { data, error } = await supabase
            .from('inventory_categories')
            .insert(category)
            .select()
            .single()

        if (error) throw error
        return data as Category
    },

    async updateCategory(id: string, updates: UpdateCategoryDTO) {
        const { data, error } = await supabase
            .from('inventory_categories')
            .update(updates)
            .eq('id', id)
            .select()
            .single()

        if (error) throw error
        return data as Category
    },

    async deleteCategory(id: string) {
        const { error } = await supabase
            .from('inventory_categories')
            .delete()
            .eq('id', id)

        if (error) throw error
    },


    async createProduct(product: CreateProductDTO) {
        const { data, error } = await supabase
            .from('inventory_products')
            .insert(product)
            .select()
            .single()

        if (error) throw error
        return data as Product
    },

    async updateProduct(id: string, updates: UpdateProductDTO) {
        const { data, error } = await supabase
            .from('inventory_products')
            .update(updates)
            .eq('id', id)
            .select()
            .single()

        if (error) throw error
        return data as Product
    },

    async deleteProduct(id: string) {
        const { error } = await supabase
            .from('inventory_products')
            .delete()
            .eq('id', id)

        if (error) throw error
    },

    async searchProducts(storeId: string, query: string) {
        const { data, error } = await supabase
            .from('inventory_products')
            .select('*')
            .eq('store_id', storeId)
            .ilike('name', `%${query}%`)
            .limit(10)

        if (error) throw error
        return data as Product[]
    },

    async addStock(productId: string, quantity: number, unitCost: number, userId: string, notes?: string) {
        // 1. Get current product
        const { data: product, error: pError } = await supabase
            .from('inventory_products')
            .select('store_id, current_stock')
            .eq('id', productId)
            .single()

        if (pError) throw pError

        // 2. Insert movement
        const { error: mError } = await supabase
            .from('inventory_movements')
            .insert({
                store_id: product.store_id,
                product_id: productId,
                type: 'entry',
                quantity: quantity,
                previous_stock: product.current_stock,
                new_stock: product.current_stock + quantity,
                cost_per_unit: unitCost,
                notes: notes,
                created_by: userId
            })

        if (mError) throw mError

        // 3. Update product stock
        const { data: updatedProduct, error: uError } = await supabase
            .from('inventory_products')
            .update({
                current_stock: product.current_stock + quantity
            })
            .eq('id', productId)
            .select()
            .single()

        if (uError) throw uError

        return updatedProduct as Product
    },

    async reduceStock(productId: string, quantity: number, referenceId: string, userId: string, notes?: string) {
        // 1. Get current product
        const { data: product, error: pError } = await supabase
            .from('inventory_products')
            .select('store_id, current_stock')
            .eq('id', productId)
            .single()

        if (pError) throw pError

        // 2. Insert movement
        const { error: mError } = await supabase
            .from('inventory_movements')
            .insert({
                store_id: product.store_id,
                product_id: productId,
                type: 'exit',
                quantity: quantity,
                previous_stock: product.current_stock,
                new_stock: product.current_stock - quantity,
                cost_per_unit: 0,
                reference_id: referenceId,
                notes: notes || 'Venta',
                created_by: userId
            })

        if (mError) throw mError

        // 3. Update product stock
        const { data: updatedProduct, error: uError } = await supabase
            .from('inventory_products')
            .update({
                current_stock: product.current_stock - quantity
            })
            .eq('id', productId)
            .select()
            .single()

        if (uError) throw uError

        return updatedProduct as Product
    }
}
