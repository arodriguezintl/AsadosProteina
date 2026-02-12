export type OrderType = 'delivery' | 'pickup'
export type OrderStatus = 'pending' | 'preparing' | 'ready' | 'in_delivery' | 'completed' | 'cancelled'
export type PaymentMethod = 'cash' | 'transfer' | 'card'
export type PaymentStatus = 'pending' | 'paid' | 'refunded'

export interface OrderItem {
    id: string
    order_id: string
    product_id: string
    quantity: number
    unit_price: number
    subtotal: number
    notes?: string
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

    // Joined fields
    items?: OrderItem[]
}

export interface CreateOrderDTO {
    store_id: string
    order_number: string // We might generate this on client or server? Schema says NOT NULL.
    customer_id?: string
    order_type: OrderType
    status: OrderStatus
    subtotal: number
    discount?: number
    tax?: number
    total: number
    payment_method: PaymentMethod
    payment_status: PaymentStatus
    notes?: string
}

export interface CreateOrderItemDTO {
    product_id: string
    quantity: number
    unit_price: number
    subtotal: number
    notes?: string
}
