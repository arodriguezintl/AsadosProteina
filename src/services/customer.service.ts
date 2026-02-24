import { supabase } from '@/lib/supabase'
import type { Customer, CreateCustomerDTO, UpdateCustomerDTO } from '@/types/customers'

export const CustomerService = {
    async getCustomers(storeId?: string) {
        let query = supabase
            .from('customers')
            .select('*')

        if (storeId) {
            query = query.eq('store_id', storeId)
        }

        const { data, error } = await query.order('full_name')

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

    async searchCustomers(query: string, storeId?: string) {
        let dbQuery = supabase
            .from('customers')
            .select('*')
            .or(`full_name.ilike.%${query}%,phone.ilike.%${query}%,email.ilike.%${query}%,address.ilike.%${query}%`)

        if (storeId) {
            dbQuery = dbQuery.eq('store_id', storeId)
        }

        const { data, error } = await dbQuery.limit(10)

        if (error) throw error
        return data as Customer[]
    },

    async incrementDeliverySales(customerId: string) {
        const { data: customer, error: getError } = await supabase
            .from('customers')
            .select('delivery_sales_count')
            .eq('id', customerId)
            .single()

        if (getError) throw getError

        const newCount = (customer?.delivery_sales_count || 0) + 1
        const rewardEarned = newCount % 5 === 0

        const { data, error } = await supabase
            .from('customers')
            .update({ delivery_sales_count: newCount })
            .eq('id', customerId)
            .select()
            .single()

        if (error) throw error
        return { customer: data as Customer, rewardEarned }
    },

    async incrementPickupSales(customerId: string) {
        const { data: customer, error: getError } = await supabase
            .from('customers')
            .select('pickup_sales_count')
            .eq('id', customerId)
            .single()

        if (getError) throw getError

        const newCount = (customer?.pickup_sales_count || 0) + 1
        const rewardEarned = newCount % 5 === 0

        const { data, error } = await supabase
            .from('customers')
            .update({ pickup_sales_count: newCount })
            .eq('id', customerId)
            .select()
            .single()

        if (error) throw error
        return { customer: data as Customer, rewardEarned }
    },

    async getNewCustomersCount(startDate: string, endDate: string, storeId?: string) {
        let query = supabase
            .from('customers')
            .select('*', { count: 'exact', head: true })
            .gte('created_at', startDate)
            .lte('created_at', endDate)

        if (storeId) {
            query = query.eq('store_id', storeId)
        }

        const { count, error } = await query

        if (error) throw error
        return count || 0
    }
}
