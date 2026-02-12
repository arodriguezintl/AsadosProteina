import { supabase } from '@/lib/supabase'

export interface Employee {
    id: string
    first_name: string
    last_name: string
    position: string // 'Repartidor', 'Cocinero', etc.
    is_active: boolean
}

export const EmployeeService = {
    async getEmployees(role?: string) {
        let query = supabase
            .from('employees')
            .select('*')
            .eq('is_active', true)

        if (role) {
            query = query.eq('position', role)
        }

        const { data, error } = await query
        if (error) throw error
        return data as Employee[]
    },

    async getDeliveryDrivers() {
        return this.getEmployees('Repartidor')
    }
}
