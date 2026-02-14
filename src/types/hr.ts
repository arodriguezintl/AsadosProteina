import type { UserProfile } from './database.types'

export interface Employee {
    id: string
    store_id: string
    user_id?: string
    first_name: string
    last_name: string
    email?: string
    phone?: string
    position: 'Manager' | 'Cook' | 'Driver' | 'Cashier' | string
    salary_type: 'hourly' | 'weekly' | 'monthly' | 'per_delivery'
    salary_amount: number
    hire_date?: string
    is_active: boolean
    created_at?: string
    user?: UserProfile
}

export interface WorkShift {
    id: string
    employee_id: string
    store_id: string
    check_in: string
    check_out?: string
    total_hours?: number
    notes?: string
    status: 'active' | 'completed'
    created_at?: string
}

export interface Payroll {
    id: string
    employee_id: string
    store_id: string
    period_start: string
    period_end: string
    base_salary: number
    total_hours: number
    bonuses: number
    deductions: number
    total_paid: number
    payment_date: string
    status: 'draft' | 'paid'
    notes?: string
    created_at?: string
    employee?: Employee
}
