import { supabase } from '@/lib/supabase'
import type { Customer, CreateCustomerDTO, UpdateCustomerDTO } from '@/types/customers'

export const CustomerService = {
    async getCustomers() {
        const { data, error } = await supabase
            .from('customers')
            .select('*')
            .order('full_name')

        if (error) throw error
        return data as Customer[]
    },

    async getCustomerById(id: string) {
        const { data, error } = await supabase
            .from('customers')
            .select('*')
            .eq('id', id)
            .single()

        if (error) throw error
        return data as Customer
    },

    async createCustomer(customer: CreateCustomerDTO) {
        const { data, error } = await supabase
            .from('customers')
            .insert(customer)
            .select()
            .single()

        if (error) throw error
        return data as Customer
    },

    async updateCustomer(id: string, updates: UpdateCustomerDTO) {
        const { data, error } = await supabase
            .from('customers')
            .update(updates)
            .eq('id', id)
            .select()
            .single()

        if (error) throw error
        return data as Customer
    },

    async deleteCustomer(id: string) {
        const { error } = await supabase
            .from('customers')
            .delete()
            .eq('id', id)

        if (error) throw error
    },

    async searchCustomers(query: string) {
        const { data, error } = await supabase
            .from('customers')
            .select('*')
            .or(`full_name.ilike.%${query}%,phone.ilike.%${query}%,email.ilike.%${query}%`)
            .limit(10)

        if (error) throw error
        return data as Customer[]
    },

    async addPoints(customerId: string, points: number) {
        // First get current points
        const { data: customer, error: getError } = await supabase
            .from('customers')
            .select('loyalty_points')
            .eq('id', customerId)
            .single()

        if (getError) throw getError

        const newBalance = (customer?.loyalty_points || 0) + points

        const { data, error } = await supabase
            .from('customers')
            .update({ loyalty_points: newBalance })
            .eq('id', customerId)
            .select()
            .single()

        if (error) throw error
        return data as Customer
    },

    async getNewCustomersCount(startDate: string, endDate: string) {
        const { count, error } = await supabase
            .from('customers')
            .select('*', { count: 'exact', head: true })
            .gte('created_at', startDate)
            .lte('created_at', endDate)

        if (error) throw error
        return count || 0
    }
}
