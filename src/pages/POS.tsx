import { useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Separator } from '@/components/ui/separator'
import { Plus, Minus, ShoppingCart, Loader2, Search, Calculator, TrendingDown, ImageOff } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { toast } from 'react-toastify'
import { ProductService } from '@/services/product.service'
import { ReportService } from '@/services/report.service'
import { OrderService } from '@/services/order.service'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'

import type { Product } from '@/types/inventory'
import type { CreateOrderDTO, CreateOrderItemDTO } from '@/types/sales'
import type { Customer } from '@/types/customers'
import type { FinanceCategory } from '@/types/finance'
import { CustomerService } from '@/services/customer.service'
import { FinanceService } from '@/services/finance.service'
import { User } from 'lucide-react'
import { useAuthStore } from '@/store/auth.store'
import { useTicketPrint } from '@/hooks/useTicketPrint'
import { PrintService } from '@/services/print.service'
import { HRService } from '@/services/hr.service'
import { supabase } from '@/lib/supabase'
import { getMexicoDayString, getMexicoStartOfDayISO } from '@/utils/date'

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
    const [selectedCategory, setSelectedCategory] = useState<string>('all')
    const [selectedSubCategory, setSelectedSubCategory] = useState<string>('all')
    const [posCategories, setPosCategories] = useState<string[]>([])
    const [showPromoDialog, setShowPromoDialog] = useState(false)
    const [promoExtraItem, setPromoExtraItem] = useState<string>('')
    // Expense dialog state
    const [showExpenseDialog, setShowExpenseDialog] = useState(false)
    const [expenseLoading, setExpenseLoading] = useState(false)
    const [expenseCategories, setExpenseCategories] = useState<FinanceCategory[]>([])
    const [expenseForm, setExpenseForm] = useState({
        amount: 0,
        description: '',
        category_id: '',
        payment_method: 'cash' as 'cash' | 'transfer' | 'card',
        transaction_date: getMexicoDayString()
    })
    const { user, storeId } = useAuthStore()
    const { buildTicketData } = useTicketPrint()

    useEffect(() => {
        if (storeId) {
            loadProducts()
            loadExpenseCategories()
        }
    }, [storeId])

    const loadExpenseCategories = async () => {
        try {
            const cats = await FinanceService.getCategories()
            // Filter to expense categories only
            setExpenseCategories(cats.filter((c: FinanceCategory) => c.type === 'expense' || !c.type))
        } catch (error) {
            console.error('Error loading expense categories:', error)
        }
    }

    const handleRegisterExpense = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!storeId) return
        setExpenseLoading(true)
        try {
            await FinanceService.createTransaction({
                ...expenseForm,
                type: 'expense',
                store_id: storeId,
                amount: Number(expenseForm.amount)
            })
            setShowExpenseDialog(false)
            setExpenseForm({
                amount: 0,
                description: '',
                category_id: '',
                payment_method: 'cash',
                transaction_date: getMexicoDayString()
            })
            toast.success('Gasto registrado correctamente')
        } catch (error: any) {
            toast.error(error?.message || 'Error al registrar gasto')
        } finally {
            setExpenseLoading(false)
        }
    }

    const loadProducts = async () => {
        if (!storeId) return
        try {
            const data = await ProductService.getProducts(storeId)
            // Filter inactive, invalid price, and only keep finished products
            let validProducts = data.filter(p => 
                p.is_active && 
                (p.sale_price || 0) > 0 && 
                p.category?.type === 'finished_product'
            )
            
            // Sort by popularity across the last 30 days
            try {
                const startDateISO = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString()
                const endDateISO = new Date().toISOString()
                const topProducts = await ReportService.getTopProducts(storeId, startDateISO, endDateISO, 100)
                const popularityMap = new Map()
                // Map by product name
                topProducts.forEach((tp, idx) => {
                    popularityMap.set(tp.name, idx)
                })
                
                validProducts.sort((a, b) => {
                    const rankA = popularityMap.has(a.name) ? popularityMap.get(a.name)! : 999
                    const rankB = popularityMap.has(b.name) ? popularityMap.get(b.name)! : 999
                    if (rankA !== rankB) return rankA - rankB
                    return (a.name || '').localeCompare(b.name || '')
                })
            } catch (e) {
                console.error('Could not fetch top products for sorting', e)
                validProducts.sort((a, b) => (a.name || '').localeCompare(b.name || ''))
            }

            setProducts(validProducts)
            
            // Extract unique categories for POS tabs
            const cats = Array.from(new Set(validProducts.map(p => p.category?.name).filter(Boolean))) as string[]
            setPosCategories(cats)
            
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

    const filteredProducts = products.filter(p => {
        const matchesSearch = (p.name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
                              (p.sku || '').toLowerCase().includes(searchTerm.toLowerCase())
        const matchesCategory = selectedCategory === 'all' || p.category?.name === selectedCategory
        
        // Sub-category logic for Asados
        let matchesSubCategory = true
        if (selectedCategory === 'Asados' && selectedSubCategory !== 'all') {
            const n = (p.name || '').toLowerCase()
            if (selectedSubCategory === 'con arroz') matchesSubCategory = n.includes('arroz')
            else if (selectedSubCategory === 'con espagueti') matchesSubCategory = n.includes('espagueti') || n.includes('spaghetti')
            else if (selectedSubCategory === 'otros') matchesSubCategory = !n.includes('arroz') && !n.includes('espagueti') && !n.includes('spaghetti')
        }

        return matchesSearch && matchesCategory && matchesSubCategory
    })

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

        if (selectedCustomer) {
            let qualifies = false
            if (orderType === 'delivery') {
                qualifies = ((selectedCustomer.delivery_sales_count || 0) + 1) % 5 === 0
            } else {
                qualifies = ((selectedCustomer.pickup_sales_count || 0) + 1) % 5 === 0
            }
            if (qualifies) {
                setShowPromoDialog(true)
                return
            }
        }
        processCheckout(false)
    }

    const processCheckout = async (withPromo = false, overridePromoItemId?: string) => {
        if (!storeId) return
        setIsCheckingOut(true)

        try {
            const finalCart = [...cart]
            const idToUse = overridePromoItemId || promoExtraItem
            if (withPromo && idToUse) {
                const productToAdd = products.find(p => p.id === idToUse)
                if (productToAdd) {
                    finalCart.push({
                        product: { ...productToAdd, sale_price: 0 },
                        quantity: 1
                    })
                }
            }

            let total = 0
            let tax = 0
            let subtotal = 0

            finalCart.forEach(item => {
                const itemTotal = (item.product.sale_price || 0) * item.quantity
                if (item.product.is_taxable) {
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
                order_type: orderType,
                status: 'pending',
                payment_method: 'cash',
                payment_status: 'paid',
                subtotal: subtotal,
                total: total,
                tax: tax,
                discount: 0
            }

            const itemsData: CreateOrderItemDTO[] = finalCart.map(item => ({
                product_id: item.product.id,
                quantity: item.quantity,
                unit_price: item.product.sale_price || 0,
                subtotal: (item.product.sale_price || 0) * item.quantity
            }))

            const result = await OrderService.createOrder(orderData, itemsData, user?.id || '')

            if (result && result.rewardName) {
                toast.success(`¡Recompensa Consumida!\nEl cliente usó: ${result.rewardName}`, {
                    position: "top-center",
                    autoClose: 5000,
                })
            }

            const ticketData = buildTicketData(orderNumber, finalCart, tax, selectedCustomer, orderType)
            PrintService.printTicket(ticketData)

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

    const handleCorteDeCaja = async () => {
        if (!storeId || !user) return
        try {
            const { data: employee, error: empError } = await supabase
                .from('employees')
                .select('id, first_name, last_name')
                .eq('user_id', user.id)
                .single()

            if (empError || !employee) {
                toast.error('No se encontró perfil de empleado vinculado a tu usuario.')
                return
            }

            const activeShift = await HRService.getActiveShift(employee.id)

            if (confirm('¿Deseas realizar el Corte de Caja?')) {
                const startDate = activeShift 
                                     ? activeShift.check_in 
                                     : getMexicoStartOfDayISO(getMexicoDayString());

                const { data: orders } = await supabase
                    .from('orders')
                    .select('id, total, status')
                    .eq('store_id', storeId)
                    .gte('created_at', startDate)

                const validOrders = orders?.filter(o => o.status !== 'cancelled') || []
                const totalSales = validOrders.reduce((sum, o) => sum + (o.total || 0), 0)
                const trxCount = validOrders.length

                if (activeShift) {
                    await HRService.clockOut(employee.id, `Corte de Caja automático. Ventas: $${totalSales} (${trxCount} transacciones).`)
                }

                const printData: any = {
                    businessName: "ASADOS PROTEINA",
                    address: "CORTE DE CAJA",
                    orderNumber: "CORTE",
                    cashierEmail: `${employee.first_name} ${employee.last_name}`,
                    orderDate: new Date().toLocaleDateString(),
                    orderTime: new Date().toLocaleTimeString(),
                    orderType: "pickup",
                    items: [
                        { description: "Transacciones", qty: trxCount, lineTotal: totalSales }
                    ],
                    subtotal: totalSales,
                    tax: 0,
                    total: totalSales,
                    currency: "MXN"
                }
                PrintService.printTicket(printData)

                toast.success('Corte de caja exitoso' + (activeShift ? ' y turno cerrado.' : '.'))
            }

        } catch (error) {
            console.error('Error corte de caja:', error)
            toast.error('Error al realizar corte de caja.')
        }
    }

    const cartTotal = cart.reduce((sum, item) => sum + ((item.product.sale_price || 0) * item.quantity), 0)

    return (
        <>
            <div className="flex h-[calc(100vh-4rem)] gap-4">

                <div className="flex-1 overflow-hidden flex flex-col">
                    <div className="mb-4 flex flex-wrap items-center justify-between gap-4">
                        <div className="min-w-fit">
                            <h1 className="text-2xl font-bold whitespace-nowrap">Punto de Venta</h1>
                            <p className="text-muted-foreground">Selecciona productos para agregar a la orden</p>
                        </div>
                        <div className="flex flex-1 flex-wrap items-center justify-start md:justify-end gap-3 md:gap-4 min-w-[300px]">
                            <Button variant="outline" className="text-red-600 border-red-600 hover:bg-red-50 bg-white" onClick={() => setShowExpenseDialog(true)}>
                                <TrendingDown className="h-4 w-4 mr-2" />
                                <span className="hidden sm:inline">Registrar Gasto</span>
                                <span className="sm:hidden">Gasto</span>
                            </Button>
                            <Button variant="outline" className="text-orange-600 border-orange-600 hover:bg-orange-50 bg-white" onClick={handleCorteDeCaja}>
                                <Calculator className="h-4 w-4 mr-2" />
                                <span className="hidden sm:inline">Corte de Caja</span>
                                <span className="sm:hidden">Corte</span>
                            </Button>
                            <div className="flex-1 min-w-[200px] md:max-w-[300px]">
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
                    </div>

                    <div className="flex gap-2 mb-4 overflow-x-auto pb-2 scrollbar-hide">
                        <Button
                            variant={selectedCategory === 'all' ? 'default' : 'secondary'}
                            size="sm"
                            onClick={() => { setSelectedCategory('all'); setSelectedSubCategory('all') }}
                            className="whitespace-nowrap rounded-full"
                        >
                            Todos
                        </Button>
                        {posCategories.map(cat => (
                            <Button
                                key={cat}
                                variant={selectedCategory === cat ? 'default' : 'secondary'}
                                size="sm"
                                onClick={() => { setSelectedCategory(cat); setSelectedSubCategory('all') }}
                                className="whitespace-nowrap rounded-full"
                            >
                                {cat}
                            </Button>
                        ))}
                    </div>

                    {selectedCategory === 'Asados' && (
                        <div className="flex gap-2 mb-4 overflow-x-auto pb-2 scrollbar-hide">
                            <Button
                                variant={selectedSubCategory === 'all' ? 'default' : 'secondary'}
                                size="sm"
                                onClick={() => setSelectedSubCategory('all')}
                                className="whitespace-nowrap rounded-full bg-orange-100 text-orange-800 hover:bg-orange-200"
                            >
                                Todos los Asados
                            </Button>
                            <Button
                                variant={selectedSubCategory === 'con arroz' ? 'default' : 'secondary'}
                                size="sm"
                                onClick={() => setSelectedSubCategory('con arroz')}
                                className="whitespace-nowrap rounded-full bg-orange-100 text-orange-800 hover:bg-orange-200"
                            >
                                Con Arroz
                            </Button>
                            <Button
                                variant={selectedSubCategory === 'con espagueti' ? 'default' : 'secondary'}
                                size="sm"
                                onClick={() => setSelectedSubCategory('con espagueti')}
                                className="whitespace-nowrap rounded-full bg-orange-100 text-orange-800 hover:bg-orange-200"
                            >
                                Con Espagueti
                            </Button>
                            <Button
                                variant={selectedSubCategory === 'otros' ? 'default' : 'secondary'}
                                size="sm"
                                onClick={() => setSelectedSubCategory('otros')}
                                className="whitespace-nowrap rounded-full bg-orange-100 text-orange-800 hover:bg-orange-200"
                            >
                                Otros
                            </Button>
                        </div>
                    )}

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
                                        className="cursor-pointer hover:bg-accent transition-colors overflow-hidden"
                                        onClick={() => addToCart(product)}
                                    >
                                        {/* Product Image */}
                                        <div className="w-full h-28 bg-muted/40 overflow-hidden flex items-center justify-center">
                                            {product.image_url ? (
                                                <img
                                                    src={product.image_url}
                                                    alt={product.name}
                                                    className="w-full h-full object-cover"
                                                    onError={(e) => { (e.target as HTMLImageElement).style.display = 'none' }}
                                                />
                                            ) : (
                                                <ImageOff className="h-8 w-8 text-muted-foreground/30" />
                                            )}
                                        </div>
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

            {/* Expense Registration Dialog */}
            <Dialog open={showExpenseDialog} onOpenChange={setShowExpenseDialog}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2">
                            <TrendingDown className="h-5 w-5 text-red-500" />
                            Registrar Gasto
                        </DialogTitle>
                        <DialogDescription>Registra un gasto operativo</DialogDescription>
                    </DialogHeader>
                    <form onSubmit={handleRegisterExpense} className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label>Monto ($)</Label>
                                <Input
                                    type="number"
                                    step="0.01"
                                    required
                                    min="0.01"
                                    value={expenseForm.amount || ''}
                                    onChange={e => setExpenseForm({ ...expenseForm, amount: parseFloat(e.target.value) })}
                                    placeholder="0.00"
                                />
                            </div>
                            <div className="space-y-2">
                                <Label>Fecha</Label>
                                <Input
                                    type="date"
                                    required
                                    value={expenseForm.transaction_date}
                                    onChange={e => setExpenseForm({ ...expenseForm, transaction_date: e.target.value })}
                                />
                            </div>
                        </div>
                        <div className="space-y-2">
                            <Label>Categoría</Label>
                            <Select
                                value={expenseForm.category_id}
                                onValueChange={v => setExpenseForm({ ...expenseForm, category_id: v })}
                            >
                                <SelectTrigger><SelectValue placeholder="Seleccionar categoría" /></SelectTrigger>
                                <SelectContent>
                                    {expenseCategories.map(cat => (
                                        <SelectItem key={cat.id} value={cat.id}>{cat.name}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="space-y-2">
                            <Label>Método de Pago</Label>
                            <Select
                                value={expenseForm.payment_method}
                                onValueChange={(v: any) => setExpenseForm({ ...expenseForm, payment_method: v })}
                            >
                                <SelectTrigger><SelectValue /></SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="cash">Efectivo</SelectItem>
                                    <SelectItem value="transfer">Transferencia</SelectItem>
                                    <SelectItem value="card">Tarjeta</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="space-y-2">
                            <Label>Descripción</Label>
                            <Input
                                required
                                value={expenseForm.description}
                                onChange={e => setExpenseForm({ ...expenseForm, description: e.target.value })}
                                placeholder="Ej: Compra de gas, Pago de proveedor..."
                            />
                        </div>
                        <DialogFooter>
                            <Button type="button" variant="outline" onClick={() => setShowExpenseDialog(false)}>Cancelar</Button>
                            <Button type="submit" variant="destructive" disabled={expenseLoading}>
                                {expenseLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <TrendingDown className="mr-2 h-4 w-4" />}
                                Registrar Gasto
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>

            {/* Promo Interception Dialog */}
            <Dialog open={showPromoDialog} onOpenChange={setShowPromoDialog}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>¡Cliente Califica para Promoción!</DialogTitle>
                    </DialogHeader>
                    <div className="py-4 space-y-4">
                        <p className="text-lg font-medium text-center mb-4">
                            Seleccione la recompensa del cliente:
                        </p>
                        <div className="grid grid-cols-2 gap-4">
                            <Button
                                className="h-32 text-2xl font-bold flex flex-col items-center justify-center bg-orange-600 hover:bg-orange-700 text-white shadow-lg transition-transform hover:scale-105 active:scale-95"
                                onClick={() => {
                                    const salchicha = products.find(p => p.name.toLowerCase().includes('salchicha'))
                                    setShowPromoDialog(false)
                                    processCheckout(true, salchicha?.id)
                                }}
                            >
                                Salchicha
                            </Button>
                            <Button
                                className="h-32 text-2xl font-bold flex flex-col items-center justify-center bg-yellow-600 hover:bg-yellow-700 text-white shadow-lg transition-transform hover:scale-105 active:scale-95"
                                onClick={() => {
                                    const huevo = products.find(p => p.name.toLowerCase().includes('huevo cocido') || p.name.toLowerCase() === 'huevo')
                                    setShowPromoDialog(false)
                                    processCheckout(true, huevo?.id)
                                }}
                            >
                                Huevo Cocido
                            </Button>
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" className="w-full mt-4" onClick={() => {
                            setShowPromoDialog(false)
                            setPromoExtraItem('')
                            processCheckout(false)
                        }}>Omitir Promoción (Ninguna)</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </>
    )
}
