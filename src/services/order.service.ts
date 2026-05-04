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

        if (orderError) {
            console.error('Order creation failed:', orderError)
            throw orderError
        }

        const itemsWithRoleId = items.map(item => ({
            ...item,
            order_id: newOrder.id
        }))

        const { error: itemsError } = await supabase
            .from('order_items')
            .insert(itemsWithRoleId)

        if (itemsError) {
            console.error("Error creating items, order created though:", newOrder.id, itemsError)
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

        let rewardName = null;
        if (order.customer_id) {
            // Increment overall total orders for the customer
            await CustomerService.incrementTotalOrders(order.customer_id)

            if (order.order_type === 'delivery') {
                const result = await CustomerService.incrementDeliverySales(order.customer_id)
                if (result.rewardEarned) {
                    rewardName = 'Aplica para Entrega Gratis'
                }
            } else if (order.order_type === 'pickup') {
                const result = await CustomerService.incrementPickupSales(order.customer_id)
                if (result.rewardEarned) {
                    rewardName = 'Aplica para Complemento Gratis'
                }
            }
        }

        return { ...newOrder, rewardName }
    },

    async getKanbanOrders(storeId: string) {
        const today = new Date()
        const todayStart = new Date(today.getFullYear(), today.getMonth(), today.getDate(), 0, 0, 0)

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
                customer:customers(full_name)
            `)
            .eq('store_id', storeId)
            .or(`status.in.(pending,preparing,ready),and(status.eq.completed,updated_at.gte.${todayStart.toISOString()})`)
            .order('created_at', { ascending: false })

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
        return null;
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
    },

    async cancelOrder(orderId: string, userId: string | undefined, reason: string) {
        // 1. Get order items
        const { data: items, error: itemsError } = await supabase
            .from('order_items')
            .select('*')
            .eq('order_id', orderId)

        if (itemsError) throw itemsError

        // 2. Restore stock for each item
        for (const item of items) {
            await ProductService.addStock(
                item.product_id,
                item.quantity,
                0, // cost not needed for return
                userId,
                `Cancelación de orden ${orderId}: ${reason}`,
                orderId,
                'entry'
            )
        }

        // 3. Update order status
        const { error: updateError } = await supabase
            .from('orders')
            .update({
                status: 'cancelled',
                notes: reason ? `Cancelado: ${reason}` : 'Cancelado'
            })
            .eq('id', orderId)

        if (updateError) throw updateError
    },

    async returnItems(orderId: string, itemIds: string[], userId: string | undefined, reason: string) {
        // 1. Get items to return
        const { data: items, error: itemsError } = await supabase
            .from('order_items')
            .select('*')
            .in('id', itemIds)

        if (itemsError) throw itemsError

        // 2. Restore stock and mark as returned
        for (const item of items) {
            await ProductService.addStock(
                item.product_id,
                item.quantity,
                0,
                userId,
                `Devolución de item en orden ${orderId}: ${reason}`,
                orderId,
                'entry'
            )

            // We update the quantity to 0 to "remove" it from the order effectively while keeping the record
            await supabase
                .from('order_items')
                .update({
                    quantity: 0,
                    subtotal: 0,
                    notes: `Devuelto: ${reason}`
                })
                .eq('id', item.id)
        }

        // 3. Recalculate order totals
        const { data: remainingItems } = await supabase
            .from('order_items')
            .select('subtotal')
            .eq('order_id', orderId)

        const newSubtotal = remainingItems?.reduce((sum, item) => sum + Number(item.subtotal), 0) || 0
        // Simple logic for tax/total adjustment
        const newTotal = newSubtotal // assuming no tax for now or tax included

        await supabase
            .from('orders')
            .update({
                subtotal: newSubtotal,
                total: newTotal,
                notes: `Devolución parcial procesada: ${reason}`
            })
            .eq('id', orderId)
    }
}
