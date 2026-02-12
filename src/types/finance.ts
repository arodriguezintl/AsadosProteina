export type TransactionType = 'income' | 'expense'
export type PaymentMethod = 'cash' | 'transfer' | 'card'

export interface FinanceCategory {
    id: string
    name: string
    type: TransactionType
    description?: string
    is_active: boolean
    created_at: string
}

export interface Transaction {
    id: string
    store_id: string
    type: TransactionType
    category_id?: string
    category?: FinanceCategory // Joined
    amount: number
    description?: string
    reference_id?: string
    payment_method?: PaymentMethod
    transaction_date: string
    created_by?: string
    created_at: string
}

export interface CreateTransactionDTO {
    store_id: string
    type: TransactionType
    category_id: string
    amount: number
    description?: string
    payment_method?: PaymentMethod
    transaction_date: string
}

export interface CreateCategoryDTO {
    name: string
    type: TransactionType
    description?: string
}
