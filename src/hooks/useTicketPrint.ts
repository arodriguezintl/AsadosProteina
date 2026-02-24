import { useAuthStore } from '@/store/auth.store'
import type { TicketData, TicketItem } from '@/types/ticket'
import type { Customer } from '@/types/customers'

interface CartItem {
    product: {
        name: string
        sale_price?: number
    }
    quantity: number
}

const BUSINESS_NAME = 'ASADOS PROTEÍNA EXPRESS'
const BUSINESS_ADDRESS = 'Asados Proteína - MATRIZ'
const BUSINESS_PHONE = ''

export function useTicketPrint() {
    const { user } = useAuthStore()

    function buildTicketData(
        orderNumber: string,
        cart: CartItem[],
        tax: number,
        customer: Customer | null,
        orderType: 'pickup' | 'delivery'
    ): TicketData {
        const now = new Date()
        const pad = (n: number) => String(n).padStart(2, '0')
        const orderDate = `${pad(now.getDate())}/${pad(now.getMonth() + 1)}/${now.getFullYear()}`
        const orderTime = `${pad(now.getHours())}:${pad(now.getMinutes())}`

        const items: TicketItem[] = cart.map(item => ({
            qty: item.quantity,
            description: item.product.name,
            lineTotal: (item.product.sale_price ?? 0) * item.quantity,
        }))

        const total = cart.reduce((sum, item) => sum + ((item.product.sale_price ?? 0) * item.quantity), 0)
        const subtotal = total - tax

        return {
            businessName: BUSINESS_NAME,
            address: BUSINESS_ADDRESS,
            phone: BUSINESS_PHONE,
            orderNumber,
            cashierEmail: user?.email ?? 'Sistema ERP',
            orderDate,
            orderTime,
            orderType,
            items,
            subtotal,
            tax,
            total,
            currency: 'MXN',
            customer: customer
                ? {
                    fullName: customer.full_name,
                    loyaltyPoints: (customer.loyalty_points ?? 0) + Math.floor(total),
                    loyaltyValue: ((customer.loyalty_points ?? 0) + Math.floor(total)) / 10,
                    address: customer.address,
                }
                : undefined,
        }
    }

    return { buildTicketData }
}
