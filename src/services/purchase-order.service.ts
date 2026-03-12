import { supabase } from '@/lib/supabase'
import type { PurchaseOrder, CreatePurchaseOrderDTO, POStatus } from '@/types/suppliers'

export const PurchaseOrderService = {
    // ── CRUD de OC ────────────────────────────────────────────
    async getPurchaseOrders(storeId: string): Promise<PurchaseOrder[]> {
        const { data, error } = await supabase
            .from('purchase_orders')
            .select(`
                *,
                supplier:suppliers(*),
                items:purchase_order_items(
                    *,
                    product:inventory_products(id, name, sku, unit_of_measure)
                )
            `)
            .eq('store_id', storeId)
            .order('created_at', { ascending: false })

        if (error) throw error
        return data as PurchaseOrder[]
    },

    async getPurchaseOrder(id: string): Promise<PurchaseOrder> {
        const { data, error } = await supabase
            .from('purchase_orders')
            .select(`
                *,
                supplier:suppliers(*),
                items:purchase_order_items(
                    *,
                    product:inventory_products(id, name, sku, unit_of_measure)
                )
            `)
            .eq('id', id)
            .single()

        if (error) throw error
        return data as PurchaseOrder
    },

    async createPurchaseOrder(dto: CreatePurchaseOrderDTO, userId: string): Promise<PurchaseOrder> {
        const totalAmount = dto.items.reduce(
            (sum, item) => sum + item.quantity_ordered * item.unit_cost,
            0
        )

        // 1. Create header
        const { data: po, error: poError } = await supabase
            .from('purchase_orders')
            .insert({
                store_id: dto.store_id,
                supplier_id: dto.supplier_id,
                notes: dto.notes,
                expected_date: dto.expected_date,
                total_amount: totalAmount,
                status: 'draft',
                created_by: userId,
            })
            .select()
            .single()

        if (poError) throw poError

        // 2. Insert items
        const itemsToInsert = dto.items.map(item => ({
            purchase_order_id: po.id,
            product_id: item.product_id,
            quantity_ordered: item.quantity_ordered,
            unit_cost: item.unit_cost,
        }))

        const { error: itemsError } = await supabase
            .from('purchase_order_items')
            .insert(itemsToInsert)

        if (itemsError) throw itemsError

        return this.getPurchaseOrder(po.id)
    },

    async updateStatus(id: string, status: POStatus): Promise<void> {
        const update: any = { status }
        if (status === 'received') {
            update.received_at = new Date().toISOString()
        }

        const { error } = await supabase
            .from('purchase_orders')
            .update(update)
            .eq('id', id)

        if (error) throw error
    },

    // Marcar como recibida y actualizar stock de cada producto
    async receiveOrder(id: string, userId: string): Promise<void> {
        const po = await this.getPurchaseOrder(id)
        if (!po.items?.length) return

        for (const item of po.items) {
            // Get current stock
            const { data: product } = await supabase
                .from('inventory_products')
                .select('current_stock')
                .eq('id', item.product_id)
                .single()

            if (!product) continue

            const newStock = Number(product.current_stock) + Number(item.quantity_ordered)

            // Update stock
            await supabase
                .from('inventory_products')
                .update({ current_stock: newStock, unit_cost: item.unit_cost })
                .eq('id', item.product_id)

            // Register inventory movement
            await supabase
                .from('inventory_movements')
                .insert({
                    store_id: po.store_id,
                    product_id: item.product_id,
                    type: 'entry',
                    quantity: item.quantity_ordered,
                    previous_stock: product.current_stock,
                    new_stock: newStock,
                    cost_per_unit: item.unit_cost,
                    notes: `Recepción OC ${po.folio}`,
                    created_by: userId,
                    reference_id: po.id,
                })
        }

        // Mark as received
        await this.updateStatus(id, 'received')
    },

    async cancelOrder(id: string): Promise<void> {
        await this.updateStatus(id, 'cancelled')
    },

    async deleteDraft(id: string): Promise<void> {
        const { error } = await supabase
            .from('purchase_orders')
            .delete()
            .eq('id', id)
            .eq('status', 'draft')

        if (error) throw error
    },
}
