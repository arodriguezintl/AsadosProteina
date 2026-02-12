export type OrderStatus = 'pending' | 'preparing' | 'ready' | 'in_delivery' | 'completed' | 'cancelled'
export type OrderType = 'delivery' | 'pickup'
export type PaymentMethod = 'cash' | 'transfer' | 'card'
export type PaymentStatus = 'pending' | 'paid' | 'refunded'
export type DeliveryStatus = 'assigned' | 'picked_up' | 'in_transit' | 'delivered' | 'failed'

export interface OrderItem {
    id: string
    order_id: string
    product_id: string
    quantity: number
    unit_price: number
    subtotal: number
    notes?: string

    // Joined
    product_name?: string
}

export interface Order {
    id: string
    store_id: string
    order_number: string
    customer_id?: string
    order_type: OrderType
    status: OrderStatus
    subtotal: number
    discount: number
    tax: number
    total: number
    payment_method: PaymentMethod
    payment_status: PaymentStatus
    notes?: string
    created_by?: string
    created_at: string
    updated_at: string

    // Joined
    items?: OrderItem[]
    customer_name?: string
    customer_phone?: string
    delivery_info?: DeliveryOrder
}

export interface DeliveryOrder {
    id: string
    order_id: string
    delivery_person_id?: string
    delivery_address: string
    delivery_coordinates?: any
    estimated_time_minutes?: number
    actual_delivery_time?: string
    delivery_fee: number
    status: DeliveryStatus
    notes?: string
    created_at: string

    // Joined
    delivery_person_name?: string
}
