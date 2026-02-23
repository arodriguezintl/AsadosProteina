export interface TicketItem {
    qty: number
    description: string
    lineTotal: number
}

export interface TicketData {
    businessName: string
    address?: string
    phone?: string
    orderNumber: string
    cashierEmail: string
    orderDate: string   // "DD/MM/YYYY"
    orderTime: string   // "HH:mm"
    orderType: 'pickup' | 'delivery'
    items: TicketItem[]
    subtotal: number
    tax: number
    total: number
    currency: string    // "MXN"
    customer?: {
        fullName: string
        loyaltyPoints: number
        loyaltyValue: number  // loyaltyPoints / 10
    }
}
