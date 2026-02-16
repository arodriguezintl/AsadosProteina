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
        // Use inner join to filter order_items directly by order properties
        const { data: items, error: itemsError } = await supabase
            .from('order_items')
            .select(`
                *,
                product:inventory_products(name),
                order:orders!inner(store_id, created_at, status)
            `)
            .eq('order.store_id', storeId)
            .gte('order.created_at', startDate)
            .lte('order.created_at', endDate)
            .neq('order.status', 'cancelled')

        if (itemsError) throw itemsError
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
    },

    async getSalesByStore(startDate: string, endDate: string) {
        // Fetch all orders in range
        const { data: orders, error } = await supabase
            .from('orders')
            .select('store_id, total, created_at, status, store:stores(name)')
            .gte('created_at', startDate)
            .lte('created_at', endDate)
            .neq('status', 'cancelled')

        if (error) throw error

        const storeStats: Record<string, { id: string, name: string, totalSales: number, totalOrders: number }> = {}

        const orderList = orders || []

        orderList.forEach((order: any) => {
            const storeId = order.store_id
            if (!storeId) return

            if (!storeStats[storeId]) {
                storeStats[storeId] = {
                    id: storeId,
                    name: order.store?.name || 'Tienda Desconocida',
                    totalSales: 0,
                    totalOrders: 0
                }
            }

            storeStats[storeId].totalSales += Number(order.total) || 0
            storeStats[storeId].totalOrders += 1
        })

        return Object.values(storeStats).sort((a, b) => b.totalSales - a.totalSales)
    },

    async getWeeklySales(storeId: string) {
        const today = new Date()
        const startOfWeek = new Date(today)
        startOfWeek.setDate(today.getDate() - 6) // Last 7 days
        startOfWeek.setHours(0, 0, 0, 0)

        const endOfWeek = new Date(today)
        endOfWeek.setHours(23, 59, 59, 999)

        const { data: orders, error } = await supabase
            .from('orders')
            .select('created_at, total')
            .eq('store_id', storeId)
            .gte('created_at', startOfWeek.toISOString())
            .lte('created_at', endOfWeek.toISOString())
            .neq('status', 'cancelled')

        if (error) throw error

        const days = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb']
        const weeklyStats = new Array(7).fill(0).map((_, i) => {
            const d = new Date(startOfWeek)
            d.setDate(d.getDate() + i)
            return {
                name: days[d.getDay()],
                date: d.toISOString().split('T')[0],
                total: 0
            }
        })

        orders?.forEach((order: any) => {
            const orderDate = order.created_at.split('T')[0]
            const dayStat = weeklyStats.find(d => d.date === orderDate)
            if (dayStat) {
                dayStat.total += Number(order.total)
            }
        })

        return weeklyStats
    }
}
