export type UserRole = 'super_admin' | 'admin' | 'manager' | 'cashier'

export type ModuleName =
    | 'dashboard'
    | 'pos'
    | 'inventory'
    | 'recipes'
    | 'delivery'
    | 'crm'
    | 'hr'
    | 'payroll'
    | 'finance'
    | 'stores'

export type OrderStatus = 'pending' | 'preparing' | 'ready' | 'in_delivery' | 'completed' | 'cancelled'
export type PaymentMethod = 'cash' | 'transfer' | 'card'
export type ProductType = 'finished_product' | 'raw_material'

// User Profile Types
export interface UserProfile {
    id: string
    email: string
    full_name: string
    role: UserRole
    store_id: string | null
    is_active: boolean
    created_at?: string
    updated_at?: string
}

export interface CreateUserDTO {
    email: string
    password: string
    full_name: string
    role: UserRole
    store_id?: string | null
}

export interface Database {
    public: {
        Tables: {
            user_profiles: {
                Row: {
                    id: string
                    full_name: string
                    role: UserRole
                    store_id: string | null
                    is_active: boolean
                    avatar_url: string | null
                    created_at: string
                }
            }
            stores: {
                Row: {
                    id: string
                    name: string
                    code: string
                    address: string
                    phone: string | null
                    is_active: boolean
                }
            }
            // Add more tables as needed
        }
    }
}
