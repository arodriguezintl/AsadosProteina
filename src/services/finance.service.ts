import { supabase } from '@/lib/supabase'
import type { Transaction, FinanceCategory, CreateTransactionDTO, CreateCategoryDTO } from '@/types/finance'

export const FinanceService = {
    async getCategories() {
        const { data, error } = await supabase
            .from('finance_categories')
            .select('*')
            .eq('is_active', true)
            .order('name')

        if (error) throw error
        return data as FinanceCategory[]
    },

    async createCategory(category: CreateCategoryDTO) {
        const { data, error } = await supabase
            .from('finance_categories')
            .insert(category)
            .select()
            .single()

        if (error) throw error
        return data as FinanceCategory
    },

    async deleteCategory(id: string) {
        const { error } = await supabase
            .from('finance_categories')
            .update({ is_active: false })
            .eq('id', id)

        if (error) throw error
    },

    async getTransactions(storeId: string, filters?: { type?: 'income' | 'expense', startDate?: string, endDate?: string, limit?: number }) {
        let query = supabase
            .from('transactions')
            .select('*, category:finance_categories(*)')
            .eq('store_id', storeId)
            .order('transaction_date', { ascending: false })

        if (filters?.type) {
            query = query.eq('type', filters.type)
        }

        if (filters?.startDate) {
            query = query.gte('transaction_date', filters.startDate)
        }

        if (filters?.endDate) {
            query = query.lte('transaction_date', filters.endDate)
        }

        if (filters?.limit) {
            query = query.limit(filters.limit)
        }

        const { data, error } = await query

        if (error) throw error
        return data as Transaction[]
    },

    async createTransaction(transaction: CreateTransactionDTO) {
        const { data, error } = await supabase
            .from('transactions')
            .insert(transaction)
            .select()
            .single()

        if (error) throw error
        return data as Transaction
    },

    async getFinancialStats(storeId: string) {
        const { data: transactions, error: transError } = await supabase
            .from('transactions')
            .select('*')
            .eq('store_id', storeId)

        if (transError) throw transError

        const { data: orders, error: ordersError } = await supabase
            .from('orders')
            .select('total')
            .eq('store_id', storeId)
            .eq('status', 'completed')

        if (ordersError) throw ordersError

        const transactionIncome = transactions
            ?.filter(t => t.type === 'income')
            .reduce((sum, t) => sum + Number(t.amount), 0) || 0

        const transactionExpenses = transactions
            ?.filter(t => t.type === 'expense')
            .reduce((sum, t) => sum + Number(t.amount), 0) || 0

        const salesIncome = orders
            ?.reduce((sum, o) => sum + Number(o.total), 0) || 0

        const totalIncome = transactionIncome + salesIncome
        const totalExpenses = transactionExpenses

        return {
            income: totalIncome,
            expenses: totalExpenses,
            balance: totalIncome - totalExpenses
        }
    },

    async getFinancialBreakdown(storeId: string) {
        // Get sales income
        const { data: orders } = await supabase
            .from('orders')
            .select('total')
            .eq('store_id', storeId)
            .eq('status', 'completed')

        const salesIncome = orders?.reduce((sum, o) => sum + Number(o.total), 0) || 0

        // Get transaction income
        const { data: incomeTransactions } = await supabase
            .from('transactions')
            .select('amount')
            .eq('store_id', storeId)
            .eq('type', 'income')

        const transactionIncome = incomeTransactions?.reduce((sum, t) => sum + Number(t.amount), 0) || 0

        // Get payroll expenses
        const { data: payrolls } = await supabase
            .from('payrolls')
            .select('total_paid')
            .eq('store_id', storeId)

        const payrollExpenses = payrolls?.reduce((sum, p) => sum + Number(p.total_paid), 0) || 0

        // Get other expenses
        const { data: expenseTransactions } = await supabase
            .from('transactions')
            .select('amount')
            .eq('store_id', storeId)
            .eq('type', 'expense')

        const otherExpenses = expenseTransactions?.reduce((sum, t) => sum + Number(t.amount), 0) || 0

        return {
            salesIncome,
            transactionIncome,
            payrollExpenses,
            otherExpenses
        }
    },

    async getMonthlyTrends(storeId: string, months: number = 6) {
        const monthsAgo = new Date()
        monthsAgo.setMonth(monthsAgo.getMonth() - months)

        // Get transactions
        const { data: transactions } = await supabase
            .from('transactions')
            .select('*')
            .eq('store_id', storeId)
            .gte('transaction_date', monthsAgo.toISOString())

        // Get orders
        const { data: orders } = await supabase
            .from('orders')
            .select('total, created_at')
            .eq('store_id', storeId)
            .eq('status', 'completed')
            .gte('created_at', monthsAgo.toISOString())

        // Get payrolls
        const { data: payrolls } = await supabase
            .from('payrolls')
            .select('total_paid, payment_date')
            .eq('store_id', storeId)
            .gte('payment_date', monthsAgo.toISOString().split('T')[0])

        // Group by month
        const monthlyMap: Record<string, { income: number, expenses: number }> = {}

        // Process orders (income)
        orders?.forEach(order => {
            const month = new Date(order.created_at).toLocaleDateString('es-ES', { month: 'short', year: '2-digit' })
            if (!monthlyMap[month]) monthlyMap[month] = { income: 0, expenses: 0 }
            monthlyMap[month].income += Number(order.total)
        })

        // Process transactions
        transactions?.forEach(trans => {
            const month = new Date(trans.transaction_date).toLocaleDateString('es-ES', { month: 'short', year: '2-digit' })
            if (!monthlyMap[month]) monthlyMap[month] = { income: 0, expenses: 0 }
            if (trans.type === 'income') {
                monthlyMap[month].income += Number(trans.amount)
            } else {
                monthlyMap[month].expenses += Number(trans.amount)
            }
        })

        // Process payrolls (expenses)
        payrolls?.forEach(payroll => {
            const month = new Date(payroll.payment_date).toLocaleDateString('es-ES', { month: 'short', year: '2-digit' })
            if (!monthlyMap[month]) monthlyMap[month] = { income: 0, expenses: 0 }
            monthlyMap[month].expenses += Number(payroll.total_paid)
        })

        return Object.entries(monthlyMap).map(([month, data]) => ({
            month,
            income: data.income,
            expenses: data.expenses
        }))
    },

    async getExpensesByCategory(storeId: string) {
        const { data: transactions } = await supabase
            .from('transactions')
            .select('amount, category:finance_categories(name)')
            .eq('store_id', storeId)
            .eq('type', 'expense')

        const categoryMap: Record<string, number> = {}

        transactions?.forEach(trans => {
            const categoryName = (trans.category as any)?.name || 'Sin Categoría'
            if (!categoryMap[categoryName]) categoryMap[categoryName] = 0
            categoryMap[categoryName] += Number(trans.amount)
        })

        // Add payroll as a category
        const { data: payrolls } = await supabase
            .from('payrolls')
            .select('total_paid')
            .eq('store_id', storeId)

        const payrollTotal = payrolls?.reduce((sum, p) => sum + Number(p.total_paid), 0) || 0
        if (payrollTotal > 0) {
            categoryMap['Nómina'] = payrollTotal
        }

        return Object.entries(categoryMap).map(([name, value]) => ({
            name,
            value
        }))
    }

}

