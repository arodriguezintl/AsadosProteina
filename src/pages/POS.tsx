import { useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Separator } from '@/components/ui/separator'
import { Plus, Minus, ShoppingCart, Loader2, Search } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { toast } from 'react-toastify'
import { ProductService } from '@/services/product.service'
import { OrderService } from '@/services/order.service'
import type { Product } from '@/types/inventory'
import type { CreateOrderDTO, CreateOrderItemDTO } from '@/types/sales'
import type { Customer } from '@/types/customers'
import { CustomerService } from '@/services/customer.service'
import { User } from 'lucide-react'
import { useAuthStore } from '@/store/auth.store'
import TicketPreview from '@/components/TicketPreview'
import { useTicketPrint } from '@/hooks/useTicketPrint'
import type { TicketData } from '@/types/ticket'

interface CartItem {
    product: Product
    quantity: number
}

export default function POS() {
    const [products, setProducts] = useState<Product[]>([])
    const [loading, setLoading] = useState(true)
    const [searchTerm, setSearchTerm] = useState('')
    const [cart, setCart] = useState<CartItem[]>([])
    const [isCheckingOut, setIsCheckingOut] = useState(false)
    const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null)
    const [customerSearch, setCustomerSearch] = useState('')
    const [customersList, setCustomersList] = useState<Customer[]>([])
    const [showCustomerSearch, setShowCustomerSearch] = useState(false)
    const [orderType, setOrderType] = useState<'pickup' | 'delivery'>('pickup')
    const [showTicketDialog, setShowTicketDialog] = useState(false)
    const [lastTicket, setLastTicket] = useState<TicketData | null>(null)
    const { user, storeId } = useAuthStore()
    const { buildTicketData } = useTicketPrint()

    useEffect(() => {
        if (storeId) {
            loadProducts()
        }
    }, [storeId])

    const loadProducts = async () => {
        if (!storeId) return
        try {
            const data = await ProductService.getProducts(storeId)
            // Filter inactive or invalid price products
            setProducts(data.filter(p => p.is_active && (p.sale_price || 0) > 0))
        } catch (error) {
            console.error('Error loading products:', error)
        } finally {
            setLoading(false)
        }
    }

    const searchCustomers = async (query: string) => {
        if (query.length < 2) {
            setCustomersList([])
            return
        }
        try {
            const data = await CustomerService.searchCustomers(query, storeId || undefined)
            setCustomersList(data)
        } catch (error) {
            console.error('Error searching customers:', error)
        }
    }

    const filteredProducts = products.filter(p =>
        (p.name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (p.sku || '').toLowerCase().includes(searchTerm.toLowerCase())
    )

    const addToCart = (product: Product) => {
        setCart(current => {
            const existing = current.find(item => item.product.id === product.id)
            if (existing) {
                return current.map(item =>
                    item.product.id === product.id
                        ? { ...item, quantity: item.quantity + 1 }
                        : item
                )
            }
            return [...current, { product, quantity: 1 }]
        })
    }

    const updateQuantity = (productId: string, delta: number) => {
        setCart(current => {
            return current.map(item => {
                if (item.product.id === productId) {
                    const newQuantity = Math.max(0, item.quantity + delta)
                    return { ...item, quantity: newQuantity }
                }
                return item
            }).filter(item => item.quantity > 0)
        })
    }

    const handleCheckout = async () => {
        if (cart.length === 0 || !storeId) return
        setIsCheckingOut(true)

        try {
            let total = 0
            let tax = 0
            let subtotal = 0

            cart.forEach(item => {
                const itemTotal = (item.product.sale_price || 0) * item.quantity
                if (item.product.is_taxable) {
                    // Item price INCLUDES 16% VAT
                    // Price = Subtotal * 1.16 => Subtotal = Price / 1.16
                    const itemSubtotal = itemTotal / 1.16
                    const itemTax = itemTotal - itemSubtotal
                    subtotal += itemSubtotal
                    tax += itemTax
                    total += itemTotal
                } else {
                    subtotal += itemTotal
                    total += itemTotal
                }
            })

            const orderNumber = await OrderService.generateOrderNumber(storeId)

            const orderData: CreateOrderDTO = {
                store_id: storeId,
                order_number: orderNumber,
                customer_id: selectedCustomer?.id,
                order_type: orderType, // Use the selected order type
                status: 'pending', // Change to pending so it starts in the workflow
                payment_method: 'cash', // Hardcoded for now
                payment_status: 'paid',
                subtotal: subtotal,
                total: total,
                tax: tax,
                discount: 0
            }

            const itemsData: CreateOrderItemDTO[] = cart.map(item => ({
                product_id: item.product.id,
                quantity: item.quantity,
                unit_price: item.product.sale_price || 0,
                subtotal: (item.product.sale_price || 0) * item.quantity
            }))

            const result = await OrderService.createOrder(orderData, itemsData, user?.id || '')

            // Removed points addition

            // Show loyalty reward toast if applicable
            if (result && result.rewardName) {
                toast.success(`¡Recompensa Desbloqueada!\nEl cliente ha ganado: ${result.rewardName}`, {
                    position: "top-center",
                    autoClose: 5000,
                })
            }

            // Build and show ticket
            const ticketData = buildTicketData(orderNumber, cart, tax, selectedCustomer, orderType)
            setLastTicket(ticketData)
            setShowTicketDialog(true)
            setCart([])
            setSelectedCustomer(null)
            // Reload products to update stock display
            loadProducts()

        } catch (error) {
            console.error('Checkout error:', error)
            alert('Error al procesar la venta')
        } finally {
            setIsCheckingOut(false)
        }
    }

    const cartTotal = cart.reduce((sum, item) => sum + ((item.product.sale_price || 0) * item.quantity), 0)

    return (
        <>
            <div className="flex h-[calc(100vh-4rem)] gap-4">

                <div className="flex-1 overflow-hidden flex flex-col">
                    <div className="mb-4 flex items-center justify-between">
                        <div>
                            <h1 className="text-2xl font-bold">Punto de Venta</h1>
                            <p className="text-muted-foreground">Selecciona productos para agregar a la orden</p>
                        </div>
                        <div className="w-[300px]">
                            <div className="relative">
                                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                                <Input
                                    placeholder="Buscar productos..."
                                    className="pl-8"
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                />
                            </div>
                        </div>
                    </div>

                    <ScrollArea className="flex-1 pr-4">
                        {loading ? (
                            <div className="flex items-center justify-center h-40">
                                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                            </div>
                        ) : (
                            <div className="grid grid-cols-2 md:grid-cols-3 gap-3 pb-4">
                                {filteredProducts.map(product => (
                                    <Card
                                        key={product.id}
                                        className="cursor-pointer hover:bg-accent transition-colors"
                                        onClick={() => addToCart(product)}
                                    >
                                        <CardHeader className="p-3 pb-1">
                                            <CardTitle className="text-sm font-semibold line-clamp-2 leading-tight" title={product.name}>{product.name}</CardTitle>
                                        </CardHeader>
                                        <CardContent className="p-3 pt-1">
                                            <div className="flex items-center justify-between">
                                                <div className="text-base font-bold text-primary">${product.sale_price?.toFixed(2)}</div>
                                                <div className={`text-xs ${product.current_stock <= product.min_stock ? 'text-red-500 font-bold' : 'text-muted-foreground'}`}>
                                                    Stock: {product.current_stock}
                                                </div>
                                            </div>
                                            <div className="text-xs text-muted-foreground mt-0.5">{product.category?.name}</div>
                                        </CardContent>
                                    </Card>
                                ))}
                            </div>
                        )}
                    </ScrollArea>
                </div>

                {/* Cart Sidebar */}
                <Card className="w-[350px] flex flex-col h-full">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <ShoppingCart className="h-5 w-5" />
                            Orden Actual
                        </CardTitle>
                        {/* Order Type Toggle */}
                        <div className="flex gap-2 pt-2">
                            <Button
                                variant={orderType === 'pickup' ? 'default' : 'outline'}
                                size="sm"
                                className="flex-1"
                                onClick={() => setOrderType('pickup')}
                            >
                                Para Llevar
                            </Button>
                            <Button
                                variant={orderType === 'delivery' ? 'default' : 'outline'}
                                size="sm"
                                className="flex-1"
                                onClick={() => setOrderType('delivery')}
                            >
                                Delivery
                            </Button>
                        </div>

                        {/* Customer Selection */}
                        <div className="pt-2">
                            {!selectedCustomer ? (
                                <div className="relative">
                                    <Button variant="outline" size="sm" className="w-full justify-start" onClick={() => setShowCustomerSearch(!showCustomerSearch)}>
                                        <User className="mr-2 h-4 w-4" /> Cliente
                                    </Button>
                                    {showCustomerSearch && (
                                        <div className="absolute top-full left-0 w-full z-10 bg-background border rounded-md shadow-lg p-2 mt-1">
                                            <Input
                                                placeholder="Buscar cliente..."
                                                className="mb-2 h-8"
                                                value={customerSearch}
                                                onChange={(e) => {
                                                    setCustomerSearch(e.target.value)
                                                    searchCustomers(e.target.value)
                                                }}
                                                autoFocus
                                            />
                                            <div className="max-h-40 overflow-auto space-y-1">
                                                {customersList.map(c => (
                                                    <div
                                                        key={c.id}
                                                        className="text-sm p-2 hover:bg-accent cursor-pointer rounded"
                                                        onClick={() => {
                                                            setSelectedCustomer(c)
                                                            setShowCustomerSearch(false)
                                                            setCustomerSearch('')
                                                        }}
                                                    >
                                                        {c.full_name}
                                                    </div>
                                                ))}
                                                {customersList.length === 0 && customerSearch.length > 2 && (
                                                    <div className="text-xs text-muted-foreground p-2">No encontrado</div>
                                                )}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            ) : (
                                <div className="flex items-center justify-between p-2 bg-secondary/30 rounded-md">
                                    <div className="text-sm">
                                        <div className="font-semibold">{selectedCustomer.full_name.split(' ')[0]}</div>
                                        <div className="text-xs text-orange-600 font-bold">
                                            {orderType === 'delivery'
                                                ? `Delivery: ${selectedCustomer.delivery_sales_count || 0}/5`
                                                : `Pickup: ${selectedCustomer.pickup_sales_count || 0}/5`}
                                        </div>
                                    </div>
                                    <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => setSelectedCustomer(null)}>
                                        <Minus className="h-4 w-4" />
                                    </Button>
                                </div>
                            )}
                        </div>
                    </CardHeader>
                    <CardContent className="flex-1 overflow-hidden p-0">
                        <ScrollArea className="h-full px-6">
                            {cart.length === 0 ? (
                                <div className="flex flex-col items-center justify-center h-40 text-muted-foreground">
                                    <ShoppingCart className="h-10 w-10 mb-2 opacity-20" />
                                    <p>Carrito vacío</p>
                                </div>
                            ) : (
                                <div className="space-y-4 py-4">
                                    {cart.map(item => (
                                        <div key={item.product.id} className="flex items-center justify-between gap-2">
                                            <div className="flex-1">
                                                <div className="font-medium line-clamp-1">{item.product.name}</div>
                                                <div className="text-sm text-muted-foreground">
                                                    ${item.product.sale_price} x {item.quantity}
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-1">
                                                <Button
                                                    variant="outline"
                                                    size="icon"
                                                    className="h-6 w-6"
                                                    onClick={() => updateQuantity(item.product.id, -1)}
                                                >
                                                    <Minus className="h-3 w-3" />
                                                </Button>
                                                <span className="w-4 text-center text-sm">{item.quantity}</span>
                                                <Button
                                                    variant="outline"
                                                    size="icon"
                                                    className="h-6 w-6"
                                                    onClick={() => updateQuantity(item.product.id, 1)}
                                                >
                                                    <Plus className="h-3 w-3" />
                                                </Button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </ScrollArea>
                    </CardContent>
                    <Separator />
                    <CardFooter className="flex-col gap-4 p-6 pt-4">
                        <div className="flex w-full items-center justify-between text-lg font-bold">
                            <span>Total</span>
                            <span>${cartTotal.toFixed(2)}</span>
                        </div>
                        <Button className="w-full" size="lg" disabled={cart.length === 0 || isCheckingOut} onClick={handleCheckout}>
                            {isCheckingOut ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                            Cobrar ${cartTotal.toFixed(2)}
                        </Button>
                    </CardFooter>
                </Card>
            </div>

            <TicketPreview
                open={showTicketDialog}
                onClose={() => setShowTicketDialog(false)}
                ticket={lastTicket}
            />
        </>
    )
}
