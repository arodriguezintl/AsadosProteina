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
        orderType: 'pickup' | 'delivery',
        store?: any,
        deliveryFee?: number
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

        const subtotal = cart.reduce((sum, item) => sum + ((item.product.sale_price ?? 0) * item.quantity), 0)
        const total = subtotal + (deliveryFee ?? 0)

        return {
            businessName: BUSINESS_NAME,
            header: store?.ticket_header,
            address: store?.address || BUSINESS_ADDRESS,
            phone: store?.phone || BUSINESS_PHONE,
            orderNumber,
            cashierEmail: user?.email ?? 'Sistema ERP',
            orderDate,
            orderTime,
            orderType,
            items,
            subtotal,
            tax,
            delivery_fee: deliveryFee,
            total,
            currency: 'MXN',
            footer: store?.ticket_footer,
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
