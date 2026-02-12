export type UserRole = 'super_admin' | 'admin' | 'manager' | 'cashier'

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
