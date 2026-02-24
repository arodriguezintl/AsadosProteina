import { supabase } from '@/lib/supabase'
import type { Product, Category, CreateProductDTO, UpdateProductDTO, CreateCategoryDTO, UpdateCategoryDTO } from '@/types/inventory'

export const ProductService = {
    async getProducts(storeId: string) {
        // 1. Fetch products
        const { data: products, error } = await supabase
            .from('inventory_products')
            .select(`
                *,
                category:inventory_categories (*)
            `)
            .eq('store_id', storeId)

        if (error) throw error

        const typedProducts = (products || []) as Product[]

        return typedProducts.sort((a, b) => {
            const nameA = a.name || ''
            const nameB = b.name || ''
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

    async uploadImage(file: File): Promise<string> {
        const fileExt = file.name.split('.').pop()
        const fileName = `${Math.random().toString(36).substring(2)}_${Date.now()}.${fileExt}`
        const filePath = `${fileName}`

        const { error: uploadError } = await supabase.storage
            .from('products')
            .upload(filePath, file)

        if (uploadError) {
            throw uploadError
        }

        const { data } = supabase.storage
            .from('products')
            .getPublicUrl(filePath)

        return data.publicUrl
    },


    async createProduct(product: CreateProductDTO) {
        const { data, error } = await supabase
            .from('inventory_products')
            .insert({
                store_id: product.store_id,
                category_id: product.category_id,
                name: product.name,
                sku: product.sku,
                description: product.description,
                unit_of_measure: product.unit_of_measure,
                min_stock: product.min_stock,
                unit_cost: product.unit_cost,
                sale_price: product.sale_price,
                is_active: product.is_active ?? true,
                current_stock: product.current_stock ?? 0,
                image_url: product.image_url
            })
            .select(`
                *,
                category:inventory_categories (*)
            `)
            .single()

        if (error) throw error
        return data as Product
    },

    async updateProduct(id: string, updates: UpdateProductDTO) {
        const { data, error } = await supabase
            .from('inventory_products')
            .update(updates)
            .eq('id', id)
            .select(`
                *,
                category:inventory_categories (*)
            `)
            .single()

        if (error) throw error

        return data as Product
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
            .from('inventory_products')
            .select(`
                *,
                category:inventory_categories (*)
            `)
            .or(`name.ilike.%${query}%,sku.ilike.%${query}%`)
            .limit(20)

        if (error) throw error
        return data as Product[]
    },

    async searchProducts(storeId: string, query: string) {
        const { data, error } = await supabase
            .from('inventory_products')
            .select(`
                *,
                category:inventory_categories (*)
            `)
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
            .select(`
                *,
                category:inventory_categories (*)
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
                category:inventory_categories (*)
            `)
            .single()

        if (uError) throw uError

        return updatedProduct as Product
    }
}
