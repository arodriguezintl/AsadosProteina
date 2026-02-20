import { supabase } from '@/lib/supabase'
import type { Product, Category, CreateProductDTO, UpdateProductDTO, CreateCategoryDTO, UpdateCategoryDTO, GlobalProduct } from '@/types/inventory'

export const ProductService = {
    async getProducts(storeId: string) {
        // 1. Fetch products with global product details
        const { data: products, error } = await supabase
            .from('inventory_products')
            .select(`
                *,
                global_product:inventory_global_products (
                    *,
                    category:inventory_categories (*)
                )
            `)
            .eq('store_id', storeId)

        if (error) throw error

        // Map to flatten structure for UI convenience if needed, 
        // but for now we just return the joined data. 
        // The type 'Product' has been updated to include 'global_product'.

        // We might want to sort in JS because sorting by joined column in Supabase can be tricky depending on version
        const typedProducts = (products || []) as Product[]

        return typedProducts.sort((a, b) => {
            const nameA = a.global_product?.name || ''
            const nameB = b.global_product?.name || ''
            return nameA.localeCompare(nameB)
        })
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
        let globalId = product.global_product_id

        // 1. If we need to create a new global product first
        if (!globalId && product.new_global_product) {
            const { data: newGlobal, error: globalError } = await supabase
                .from('inventory_global_products')
                .insert(product.new_global_product)
                .select()
                .single()

            if (globalError) throw globalError
            globalId = newGlobal.id
        }

        if (!globalId) throw new Error("Missing global_product_id or new_global_product")

        // 2. Create store product linked to global
        const { data, error } = await supabase
            .from('inventory_products')
            .insert({
                store_id: product.store_id,
                global_product_id: globalId,
                min_stock: product.min_stock,
                unit_cost: product.unit_cost,
                sale_price: product.sale_price,
                is_active: product.is_active ?? true,
                current_stock: product.current_stock ?? 0
            })
            .select(`
                *,
                global_product:inventory_global_products (
                    *,
                    category:inventory_categories (*)
                )
            `)
            .single()

        if (error) throw error
        return data as Product
    },

    async updateProduct(id: string, updates: UpdateProductDTO) {
        // 1. Update store specific fields
        const { global_product_updates, ...storeUpdates } = updates

        let updatedProduct = null

        if (Object.keys(storeUpdates).length > 0) {
            const { data, error } = await supabase
                .from('inventory_products')
                .update(storeUpdates)
                .eq('id', id)
                .select(`
                    *,
                    global_product:inventory_global_products (
                        *,
                        category:inventory_categories (*)
                    )
                `)
                .single()

            if (error) throw error
            updatedProduct = data
        }

        // 2. Update global fields if authorized (and requested)
        // Note: This effectively updates it for ALL stores. User must be aware.
        // We might want to restrict this to Admins only in the backend policies.
        if (global_product_updates && updatedProduct) {
            const globalId = updatedProduct.global_product_id
            if (globalId) {
                const { error: globalError } = await supabase
                    .from('inventory_global_products')
                    .update(global_product_updates)
                    .eq('id', globalId)

                if (globalError) throw globalError

                // Re-fetch to get updated global data
                const { data: refetched } = await supabase
                    .from('inventory_products')
                    .select(`
                        *,
                        global_product:inventory_global_products (
                            *,
                            category:inventory_categories (*)
                        )
                    `)
                    .eq('id', id)
                    .single()

                updatedProduct = refetched
            }
        }

        return updatedProduct as Product
    },

    async deleteProduct(id: string) {
        // Only deletes the store link/stock. Global product remains.
        const { error } = await supabase
            .from('inventory_products')
            .delete()
            .eq('id', id)

        if (error) throw error
    },

    async searchGlobalCatalog(query: string) {
        const { data, error } = await supabase
            .from('inventory_global_products')
            .select(`
                *,
                category:inventory_categories (*)
            `)
            .or(`name.ilike.%${query}%,sku.ilike.%${query}%`)
            .limit(20)

        if (error) throw error
        return data as GlobalProduct[]
    },

    // Kept for backward compatibility but using new structure
    async searchProducts(storeId: string, query: string) {
        // This is trickier now because name is in the joined table.
        // Supabase filtering on joined tables matches!
        const { data, error } = await supabase
            .from('inventory_products')
            .select(`
                *,
                global_product:inventory_global_products!inner(
                    *,
                    category:inventory_categories (*)
                )
            `)
            .eq('store_id', storeId)
            .ilike('global_product.name', `%${query}%`) // Filter by joined column
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
            .select(`
                *,
                global_product:inventory_global_products (
                    *,
                    category:inventory_categories (*)
                )
            `)
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
            .select(`
                *,
                global_product:inventory_global_products (
                    *,
                    category:inventory_categories (*)
                )
            `)
            .single()

        if (uError) throw uError

        return updatedProduct as Product
    }
}
