import { supabase } from '@/lib/supabase'

export const ReportService = {
    async getSalesReport(storeId: string, startDate: string, endDate: string) {
        const { data, error } = await supabase
            .from('orders')
            .select('*')
            .eq('store_id', storeId)
            .gte('created_at', startDate)
            .lte('created_at', endDate)
            .neq('status', 'cancelled')

        if (error) throw error

        // If data is null (shouldn't be with select * unless error), default to empty
        const orders = data || []

        const totalSales = orders.reduce((sum, order) => sum + (Number(order.total) || 0), 0)
        const totalOrders = orders.length
        const avgTicket = totalOrders > 0 ? totalSales / totalOrders : 0

        return {
            totalSales,
            totalOrders,
            avgTicket,
            orders
        }
    },

    async getTopProducts(storeId: string, startDate: string, endDate: string, limit: number = 5) {
        // This is a bit complex without aggregation queries in simple PostgREST
        // We'll fetch order items for the period and aggregate in JS for now (not efficient for huge data but works for MVP)

        // 1. Get orders in range
        const { data: orders, error: ordersError } = await supabase
            .from('orders')
            .select('id')
            .eq('store_id', storeId)
            .gte('created_at', startDate)
            .lte('created_at', endDate)
            .neq('status', 'cancelled')

        if (ordersError) throw ordersError

        if (!orders || orders.length === 0) return []

        const orderIds = orders.map(o => o.id)

        // 2. Get items for these orders
        const { data: items, error: itemsError } = await supabase
            .from('order_items')
            .select(`
                *,
                product:inventory_products(name)
            `)
            .in('order_id', orderIds)

        if (itemsError) throw itemsError

        // 3. Aggregate
        const productStats: Record<string, { name: string, quantity: number, revenue: number }> = {}

        const orderItems = items || []

        orderItems.forEach((item: any) => {
            if (!item.product) return

            // Check if product exists in stats
            // Note: Since we aggregate by ID, we need unique ID. product_id is best.
            // But if multiple variants existed we'd need more logic. Assuming flat products.
            const pId = item.product_id || item.id // Fallback if no product_id (unlikely)

            if (!productStats[pId]) {
                productStats[pId] = {
                    name: item.product.name,
                    quantity: 0,
                    revenue: 0
                }
            }
            productStats[pId].quantity += Number(item.quantity)
            productStats[pId].revenue += Number(item.subtotal)
        })

        return Object.values(productStats)
            .sort((a, b) => b.revenue - a.revenue)
            .slice(0, limit)
    },

    async getInventoryValuation(storeId: string) {
        const { data, error } = await supabase
            .from('inventory_products')
            .select('unit_cost, current_stock, name')
            .eq('store_id', storeId)
            .eq('is_active', true)

        if (error) throw error

        const products = data || []

        const totalValuation = products.reduce((sum, product) => {
            return sum + ((Number(product.unit_cost) || 0) * (Number(product.current_stock) || 0))
        }, 0)

        return {
            totalValuation,
            productCount: products.length
        }
    }
}
