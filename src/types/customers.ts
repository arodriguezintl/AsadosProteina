export interface Customer {
    id: string
    store_id: string
    full_name: string
    email?: string
    phone?: string
    total_orders: number
    total_spent: number
    loyalty_points: number
    delivery_sales_count: number
    pickup_sales_count: number
    address?: string
    is_active: boolean
    created_at: string
    updated_at: string
}


export interface CreateCustomerDTO {
    store_id: string
    full_name: string
    email?: string
    phone?: string
    address?: string
}


export interface UpdateCustomerDTO extends Partial<CreateCustomerDTO> {
    is_active?: boolean
    delivery_sales_count?: number
    pickup_sales_count?: number
    address?: string
}
