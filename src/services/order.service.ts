import { supabase } from '@/lib/supabase'
import { CustomerService } from './customer.service'
import { ProductService } from './product.service'
import type { Order, OrderStatus } from '@/types/orders'
import type { CreateOrderDTO, CreateOrderItemDTO } from '@/types/sales'

export const OrderService = {
    async generateOrderNumber(storeId: string) {
        // Get store prefix
        const { data: store } = await supabase
            .from('stores')
            .select('name')
            .eq('id', storeId)
            .single()

        const prefix = store?.name ? store.name.substring(0, 3).toUpperCase() : 'ORD'
        const date = new Date().toISOString().slice(2, 10).replace(/-/g, '')
        const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0')
        return `${prefix}-${date}-${random}`
    },

    async createOrder(order: CreateOrderDTO, items: CreateOrderItemDTO[], userId: string) {
        const { data: newOrder, error: orderError } = await supabase
            .from('orders')
            .insert(order)
            .select()
            .single()

        if (orderError) throw orderError

        const itemsWithRoleId = items.map(item => ({
            ...item,
            order_id: newOrder.id
        }))

        const { error: itemsError } = await supabase
            .from('order_items')
            .insert(itemsWithRoleId)

        if (itemsError) {
            console.error("Error creating items, order created though:", newOrder.id)
            throw itemsError
        }

        // Deduct inventory
        try {
            for (const item of items) {
                await ProductService.reduceStock(item.product_id, item.quantity, newOrder.id, userId)
            }
        } catch (stockError) {
            console.error('Error updating stock for order:', newOrder.id, stockError)
        }

        return newOrder
    },

    async getOrders(statusFilter?: OrderStatus | OrderStatus[], limit?: number, storeId?: string) {
        let query = supabase
            .from('orders')
            .select(`
                *,
                items:order_items(
                    *,
                    product:inventory_products(
                        name
                    )
                ),
                customer:customers(full_name)
            `)
            .order('created_at', { ascending: false })

        if (storeId) {
            query = query.eq('store_id', storeId)
        }

        if (statusFilter) {
            if (Array.isArray(statusFilter)) {
                query = query.in('status', statusFilter)
            } else {
                query = query.eq('status', statusFilter)
            }
        }

        if (limit) {
            query = query.limit(limit)
        }

        const { data, error } = await query

        if (error) throw error

        return data.map((order: any) => ({
            ...order,
            customer_name: order.customer?.full_name,
            items: order.items?.map((item: any) => ({
                ...item,
                product_name: item.product?.name || 'Unknown Product'
            }))
        })) as Order[]
    },

    async getOrderById(id: string) {
        const { data, error } = await supabase
            .from('orders')
            .select(`
                *,
                items:order_items(
                    *,
                    product:inventory_products(
                        name
                    )
                ),
                customer:customers(full_name, phone),
                delivery:delivery_orders(
                    *,
                    delivery_person:employees(first_name, last_name)
                )
            `)
            .eq('id', id)
            .single()

        if (error) throw error

        const order = data as any
        return {
            ...order,
            customer_name: order.customer?.full_name,
            customer_phone: order.customer?.phone,
            items: order.items?.map((item: any) => ({
                ...item,
                product_name: item.product?.name || 'Unknown Product'
            })),
            delivery_info: order.delivery ? {
                ...order.delivery,
                delivery_person_name: order.delivery.delivery_person ?
                    `${order.delivery.delivery_person.first_name} ${order.delivery.delivery_person.last_name}` : null
            } : null
        } as Order
    },

    async updateStatus(id: string, status: OrderStatus) {
        const { error } = await supabase
            .from('orders')
            .update({ status })
            .eq('id', id)

        if (error) throw error

        if (status === 'completed') {
            const { data: order } = await supabase
                .from('orders')
                .select('customer_id, total')
                .eq('id', id)
                .single()

            if (order?.customer_id && order?.total) {
                const points = Math.floor(order.total * 0.1)
                if (points > 0) {
                    await CustomerService.addPoints(order.customer_id, points)
                }
            }
        }
    },

    async assignDelivery(orderId: string, deliveryPersonId: string) {
        // First check if delivery record exists
        const { data: existing } = await supabase
            .from('delivery_orders')
            .select('id')
            .eq('order_id', orderId)
            .single()

        if (existing) {
            const { error } = await supabase
                .from('delivery_orders')
                .update({
                    delivery_person_id: deliveryPersonId,
                    status: 'assigned'
                })
                .eq('order_id', orderId)
            if (error) throw error
        } else {
            // Create if not exists (though it should usually exist for delivery orders)
            // For now, let's assume we update existing record or throw if not found
            const { error } = await supabase
                .from('delivery_orders')
                .insert({
                    order_id: orderId,
                    delivery_person_id: deliveryPersonId,
                    status: 'assigned',
                    delivery_address: 'TBD' // Should come from order/customer
                })
            if (error) throw error
        }

        // Update order status to in_delivery? Or keep it 'ready' until driver picks up?
        // Let's keep order status as is, delivery status is 'assigned'.
    },

    async getOrdersByCustomer(customerId: string) {
        const { data, error } = await supabase
            .from('orders')
            .select(`
                *,
                items:order_items(id)
            `)
            .eq('customer_id', customerId)
            .order('created_at', { ascending: false })

        if (error) throw error

        return data.map((order: any) => ({
            ...order,
            item_count: order.items?.length || 0
        }))
    }
}
