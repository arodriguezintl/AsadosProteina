import { supabase } from '@/lib/supabase'
import type { LowStockProduct } from '@/types/suppliers'

export const SupplierService = {
    // ── Proveedores ───────────────────────────────────────────
    async getSuppliers(storeId: string) {
        const { data, error } = await supabase
            .from('suppliers')
            .select('*')
            .eq('store_id', storeId)
            .eq('is_active', true)
            .order('name')

        if (error) throw error
        return data
    },

    async createSupplier(dto: any) {
        const { data, error } = await supabase
            .from('suppliers')
            .insert(dto)
            .select()
            .single()

        if (error) throw error
        return data
    },

    async updateSupplier(id: string, updates: any) {
        const { data, error } = await supabase
            .from('suppliers')
            .update(updates)
            .eq('id', id)
            .select()
            .single()

        if (error) throw error
        return data
    },

    async deleteSupplier(id: string) {
        const { error } = await supabase
            .from('suppliers')
            .update({ is_active: false })
            .eq('id', id)

        if (error) throw error
    },

    // ── Relaciones Producto — Proveedor ───────────────────────
    async getProductSuppliers(productId: string) {
        const { data, error } = await supabase
            .from('product_suppliers')
            .select('*, supplier:suppliers(*)')
            .eq('product_id', productId)

        if (error) throw error
        return data
    },

    async linkProductSupplier(dto: any) {
        const { data, error } = await supabase
            .from('product_suppliers')
            .upsert(dto, { onConflict: 'product_id,supplier_id' })
            .select('*, supplier:suppliers(*)')
            .single()

        if (error) throw error
        return data
    },

    async setPreferredSupplier(productId: string, supplierId: string) {
        await supabase
            .from('product_suppliers')
            .update({ is_preferred: false })
            .eq('product_id', productId)

        const { error } = await supabase
            .from('product_suppliers')
            .update({ is_preferred: true })
            .eq('product_id', productId)
            .eq('supplier_id', supplierId)

        if (error) throw error
    },

    // ── Alertas de Stock Bajo ─────────────────────────────────
    // Trae todos los productos activos del store y filtra en JS
    // (current_stock <= min_stock && min_stock > 0)
    async getLowStockProducts(storeId: string): Promise<LowStockProduct[]> {
        const { data, error } = await supabase
            .from('inventory_products')
            .select('id, name, sku, current_stock, min_stock, unit_of_measure, store_id')
            .eq('store_id', storeId)
            .eq('is_active', true)

        if (error) throw error

        const lowStock = (data || []).filter(
            (p: any) =>
                Number(p.min_stock) > 0 &&
                Number(p.current_stock) <= Number(p.min_stock)
        )

        // For each low-stock product, try to get preferred supplier
        const enriched = await Promise.all(
            lowStock.map(async (p: any) => {
                const { data: ps } = await supabase
                    .from('product_suppliers')
                    .select('*, supplier:suppliers(*)')
                    .eq('product_id', p.id)
                    .eq('is_preferred', true)
                    .maybeSingle()

                return {
                    ...p,
                    preferred_supplier: ps?.supplier ?? undefined,
                } as LowStockProduct
            })
        )

        return enriched
    },
}
