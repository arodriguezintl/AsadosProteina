import { useEffect, useState, useRef } from 'react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Separator } from '@/components/ui/separator'
import { Plus, Minus, ShoppingCart, Loader2, Search, Calculator, TrendingDown, ImageOff, Store, Bike, Utensils, Truck, User } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { toast } from 'react-toastify'
import { ProductService } from '@/services/product.service'
import { ReportService } from '@/services/report.service'
import { OrderService } from '@/services/order.service'
import { StoreService } from '@/services/store.service'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'

import type { Product } from '@/types/inventory'
import type { CreateOrderDTO, CreateOrderItemDTO, PaymentMethod } from '@/types/sales'
import type { Customer } from '@/types/customers'
import type { FinanceCategory } from '@/types/finance'
import { CustomerService } from '@/services/customer.service'
import { FinanceService } from '@/services/finance.service'
import { useAuthStore } from '@/store/auth.store'
import { useTicketPrint } from '@/hooks/useTicketPrint'
import { PrintService } from '@/services/print.service'
import { HRService } from '@/services/hr.service'
import { supabase } from '@/lib/supabase'
import { getMexicoDayString, getMexicoStartOfDayISO } from '@/utils/date'
import { formatNumber } from '@/utils/format'

// Assets
import mobileBankingImg from '@/assets/mobile-banking.png'
import cashImg from '@/assets/cash.png'
import cardImg from '@/assets/card.png'

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
    const customerSearchRef = useRef<HTMLDivElement>(null)
    const [selectedSubCategory, setSelectedSubCategory] = useState<string>('all')
    const [selectedVariant, setSelectedVariant] = useState<string>('all')
    const [posCategories, setPosCategories] = useState<string[]>([])
    const [allCategories, setAllCategories] = useState<string[]>([])
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
    // Payment selection state
    const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<PaymentMethod | null>(null)
    const [montoRecibido, setMontoRecibido] = useState<number>(0)
    const [referenciaPago, setReferenciaPago] = useState<string>('')
    const [showPaymentModal, setShowPaymentModal] = useState(false)
    const [channel, setChannel] = useState<string>('mostrador')
    const [deliveryFee, setDeliveryFee] = useState<number>(0)
    const { user, storeId, role, brandingConfig } = useAuthStore()
    const isCityEx = user?.email?.toLowerCase() === 'cityex@hotel.com'
    const [showNewCustomerDialog, setShowNewCustomerDialog] = useState(false)
    const [newCustomerName, setNewCustomerName] = useState('')
    const [isCreatingCustomer, setIsCreatingCustomer] = useState(false)
    const { buildTicketData } = useTicketPrint()

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (customerSearchRef.current && !customerSearchRef.current.contains(event.target as Node)) {
                setShowCustomerSearch(false)
                setCustomerSearch('')
            }
        }

        if (showCustomerSearch) {
            document.addEventListener('mousedown', handleClickOutside)
        }
        
        return () => {
            document.removeEventListener('mousedown', handleClickOutside)
        }
    }, [showCustomerSearch])

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
            const rawCats = Array.from(new Set(validProducts.map(p => p.category?.name).filter(Boolean))) as string[]
            setAllCategories(rawCats)
            
            // Generic grouping logic for prefixes like "Asados", "Sandwich"
            const groupablePrefixes = ['Asados', 'Sandwich']
            const foundGroups = new Set<string>()
            
            rawCats.forEach(c => {
                const prefix = groupablePrefixes.find(p => c.startsWith(p + ' '))
                if (prefix) foundGroups.add(prefix)
            })

            let topCats = rawCats.filter(c => !groupablePrefixes.some(p => c.startsWith(p + ' ')))
            // Add the group names at the beginning
            setPosCategories([...Array.from(foundGroups), ...topCats])
            
            // Auto-select transfer for external clients to simplify
            if (role === 'external_client') {
                setSelectedPaymentMethod('transfer')
            }
            
        } catch (error) {
            console.error('Error loading products:', error)
        } finally {
            setLoading(false)
        }
    }

    const handleCreateCustomer = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!storeId || !newCustomerName.trim()) return
        setIsCreatingCustomer(true)
        try {
            const newCustomer = await CustomerService.createCustomer({
                full_name: newCustomerName,
                store_id: storeId
            })
            setSelectedCustomer(newCustomer)
            setShowNewCustomerDialog(false)
            setNewCustomerName('')
            toast.success('Cliente agregado correctamente')
        } catch (error: any) {
            toast.error('Error al agregar cliente')
            console.error(error)
        } finally {
            setIsCreatingCustomer(false)
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
        const matchesCategory = selectedCategory === 'all' || 
                                p.category?.name === selectedCategory || 
                                (p.category?.name || '').startsWith(selectedCategory + ' ')
        
        // Sub-category logic
        let matchesSubCategory = true
        const isGrouped = ['Asados', 'Sandwich'].includes(selectedCategory)
        
        if (isGrouped && selectedSubCategory !== 'all') {
            matchesSubCategory = p.category?.name === selectedSubCategory
        } else if (selectedCategory === 'Menú' && selectedSubCategory !== 'all') {
            const n = (p.name || '').toLowerCase()
            if (selectedSubCategory === 'con arroz') matchesSubCategory = n.includes('arroz')
            else if (selectedSubCategory === 'con espagueti') matchesSubCategory = n.includes('espagueti') || n.includes('spaghetti')
            else if (selectedSubCategory === 'otros') matchesSubCategory = !n.includes('arroz') && !n.includes('espagueti') && !n.includes('spaghetti')
        }

        // Third level logic (Variants)
        let matchesVariant = true
        if (isGrouped && selectedSubCategory !== 'all' && selectedVariant !== 'all') {
            const n = (p.name || '').toLowerCase()
            if (selectedVariant === 'arroz') matchesVariant = n.includes('arroz')
            else if (selectedVariant === 'espagueti') matchesVariant = n.includes('espagueti') || n.includes('spaghetti')
            else if (selectedVariant === 'salchicha') matchesVariant = n.includes('salchicha')
            else if (selectedVariant === 'otros') matchesVariant = !n.includes('arroz') && !n.includes('espagueti') && !n.includes('spaghetti') && !n.includes('salchicha')
        }

        // MVP Weekend Filter for External Clients
        if (role === 'external_client') {
            const isWeekend = [5, 6, 0].includes(new Date().getDay())
            const name = (p.name || '').toLowerCase()
            
            // Si tiene el tag [FIN-DE-SEMANA] o [FIN] y no es fin de semana, ocultar
            if ((name.includes('[fin]') || name.includes('[fin-de-semana]')) && !isWeekend) return false
            
            // Ocultar productos internos si tienen tag [INTERNO]
            if (name.includes('[interno]')) return false
        }

        return matchesSearch && matchesCategory && matchesSubCategory && matchesVariant
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

    const handleCheckout = async (overridePaymentMethod?: PaymentMethod) => {
        if (cart.length === 0 || !storeId) return

        if (overridePaymentMethod) {
            setSelectedPaymentMethod(overridePaymentMethod)
        }

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
        processCheckout(false, undefined, overridePaymentMethod)
    }

    const processCheckout = async (withPromo = false, overridePromoItemId?: string, overridePaymentMethod?: PaymentMethod) => {
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

            total += (deliveryFee || 0)

            const orderNumber = await OrderService.generateOrderNumber(storeId)

            const orderData: CreateOrderDTO = {
                store_id: storeId,
                order_number: orderNumber,
                customer_id: selectedCustomer?.id,
                order_type: orderType,
                channel: channel,
                delivery_fee: deliveryFee,
                status: 'pending',
                payment_method: overridePaymentMethod || selectedPaymentMethod || 'cash',
                payment_status: 'paid',
                subtotal: subtotal,
                total: total,
                tax: tax,
                discount: 0,
                referencia_pago: (selectedPaymentMethod === 'card' || selectedPaymentMethod === 'transfer') ? referenciaPago : undefined,
                monto_recibido: selectedPaymentMethod === 'cash' ? montoRecibido : undefined,
                metadata: role === 'external_client' ? { source: 'city-ex', client_role: 'external_client' } : {}
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

            // Get store data for printing
            const storeData = await StoreService.getStoreById(storeId)

            const ticketData = buildTicketData(orderNumber, finalCart, tax, selectedCustomer, orderType, storeData, deliveryFee)
            PrintService.printTicket(ticketData)

            setCart([])
            setSelectedCustomer(null)
            setMontoRecibido(0)
            setReferenciaPago('')
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
                    .select('id, total, status, payment_method')
                    .eq('store_id', storeId)
                    .gte('created_at', startDate)

                const validOrders = orders?.filter(o => o.status !== 'cancelled') || []
                const totalSales = validOrders.reduce((sum, o) => sum + (o.total || 0), 0)
                const trxCount = validOrders.length

                // Group by payment method
                const cashTotal = validOrders.filter(o => o.payment_method === 'cash').reduce((sum, o) => sum + (o.total || 0), 0)
                const cardTotal = validOrders.filter(o => o.payment_method === 'card').reduce((sum, o) => sum + (o.total || 0), 0)
                const transferTotal = validOrders.filter(o => o.payment_method === 'transfer').reduce((sum, o) => sum + (o.total || 0), 0)

                if (activeShift) {
                    await HRService.clockOut(employee.id, `Corte de Caja automático. Ventas: $${totalSales} (${trxCount} transacciones).`)
                }

                const printData: any = {
                    businessName: "SELLIX ERP",
                    address: "CORTE DE CAJA",
                    orderNumber: "CORTE",
                    cashierEmail: `${employee.first_name} ${employee.last_name}`,
                    orderDate: new Date().toLocaleDateString(),
                    orderTime: new Date().toLocaleTimeString(),
                    orderType: "pickup",
                    items: [
                        { description: "Total Efectivo", qty: validOrders.filter(o => o.payment_method === 'cash').length, lineTotal: cashTotal },
                        { description: "Total Tarjeta", qty: validOrders.filter(o => o.payment_method === 'card').length, lineTotal: cardTotal },
                        { description: "Total Transf.", qty: validOrders.filter(o => o.payment_method === 'transfer').length, lineTotal: transferTotal },
                        { description: "---", qty: 0, lineTotal: 0 },
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

    const cartSubtotal = cart.reduce((sum, item) => sum + ((item.product.sale_price || 0) * item.quantity), 0)
    const cartTotal = cartSubtotal + (deliveryFee || 0)

    return (
        <>
            <div className="flex h-[calc(100vh-4rem)] gap-4">

                <div className="flex-1 overflow-hidden flex flex-col">
                    <div className="mb-4 flex flex-wrap items-center justify-between gap-4">
                        <div className="min-w-fit">
                            <h1 className="text-2xl font-bold whitespace-nowrap">
                                {role === 'external_client' ? `Portal de Pedidos - ${brandingConfig?.client_name}` : 'Punto de Venta'}
                            </h1>
                        </div>
                        <div className="flex flex-1 flex-wrap items-center justify-start md:justify-end gap-3 md:gap-4 min-w-[300px]">
                            {role !== 'external_client' && (
                                <>
                                    <Button variant="outline" className="text-red-600 border-red-600 hover:bg-red-50 bg-white" onClick={() => setShowExpenseDialog(true)}>
                                        <TrendingDown className="h-4 w-4 mr-2" />
                                        <span>Gasto</span>
                                    </Button>
                                    <Button variant="outline" className="text-orange-600 border-orange-600 hover:bg-orange-50 bg-white" onClick={handleCorteDeCaja}>
                                        <Calculator className="h-4 w-4 mr-2" />
                                        <span>Corte</span>
                                    </Button>
                                </>
                            )}
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
                    
                    <div className="h-4" /> {/* Spacer for breathing room */}

                    <div className="flex gap-2 mb-4 overflow-x-auto pb-2 scrollbar-hide">
                        <Button
                            variant={selectedCategory === 'all' ? 'default' : 'secondary'}
                            size="sm"
                            onClick={() => { setSelectedCategory('all'); setSelectedSubCategory('all'); setSelectedVariant('all') }}
                            className="whitespace-nowrap rounded-full"
                        >
                            Todos
                        </Button>
                        {posCategories.map(cat => (
                            <Button
                                key={cat}
                                variant={selectedCategory === cat ? 'default' : 'secondary'}
                                size="sm"
                                onClick={() => { setSelectedCategory(cat); setSelectedSubCategory('all'); setSelectedVariant('all') }}
                                className="whitespace-nowrap rounded-full"
                            >
                                {cat}
                            </Button>
                        ))}
                    </div>

                    {selectedCategory !== 'all' && allCategories.some(c => c.startsWith(selectedCategory + ' ')) && (
                        <div className="space-y-3 mb-4">
                            {/* Second Level: Specific Category */}
                            <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide animate-in slide-in-from-top-1 duration-200">
                                <Button
                                    variant={selectedSubCategory === 'all' ? 'default' : 'secondary'}
                                    size="sm"
                                    onClick={() => { setSelectedSubCategory('all'); setSelectedVariant('all') }}
                                    className={cn(
                                        "whitespace-nowrap rounded-full transition-all h-8 text-xs",
                                        selectedSubCategory === 'all' ? "bg-orange-600 shadow-md scale-105" : "bg-orange-50 text-orange-700 hover:bg-orange-100 border border-orange-200"
                                    )}
                                >
                                    Todos
                                </Button>
                                {allCategories.filter(c => c.startsWith(selectedCategory + ' ')).map(subCat => (
                                    <Button
                                        key={subCat}
                                        variant={selectedSubCategory === subCat ? 'default' : 'secondary'}
                                        size="sm"
                                        onClick={() => { setSelectedSubCategory(subCat); setSelectedVariant('all') }}
                                        className={cn(
                                            "whitespace-nowrap rounded-full transition-all h-8 text-xs",
                                            selectedSubCategory === subCat ? "bg-orange-600 shadow-md scale-105" : "bg-orange-50 text-orange-700 hover:bg-orange-100 border border-orange-200"
                                        )}
                                    >
                                        {subCat.replace(selectedCategory + ' de ', '').replace(selectedCategory + ' ', '')}
                                    </Button>
                                ))}
                            </div>

                            {/* Third Level: Variants */}
                            {selectedSubCategory !== 'all' && (
                                <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide animate-in slide-in-from-left-2 duration-300">
                                    {[
                                        { id: 'all', label: 'Todo' },
                                        { id: 'arroz', label: 'Con Arroz' },
                                        { id: 'espagueti', label: 'Con Espagueti' },
                                        { id: 'salchicha', label: 'Con Salchicha' },
                                        { id: 'otros', label: 'Otros' }
                                    ].map(variant => (
                                        <Button
                                            key={variant.id}
                                            variant={selectedVariant === variant.id ? 'default' : 'outline'}
                                            size="sm"
                                            onClick={() => setSelectedVariant(variant.id)}
                                            className={cn(
                                                "whitespace-nowrap rounded-full h-7 text-[10px] uppercase tracking-wider font-bold transition-all",
                                                selectedVariant === variant.id 
                                                    ? "bg-zinc-800 text-white border-zinc-800 shadow-sm" 
                                                    : "bg-white text-zinc-500 hover:text-zinc-800 border-zinc-200"
                                            )}
                                        >
                                            {variant.label}
                                        </Button>
                                    ))}
                                </div>
                            )}
                        </div>
                    )}

                    {selectedCategory === 'Menú' && (
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
                                                <div className="text-base font-bold text-primary">${formatNumber(product.sale_price)}</div>
                                                {role !== 'external_client' && (
                                                    <div className={`text-xs ${product.current_stock <= product.min_stock ? 'text-red-500 font-bold' : 'text-muted-foreground'}`}>
                                                        Stock: {product.current_stock}
                                                    </div>
                                                )}
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
                    <CardHeader className="p-3">
                        <div className="flex items-center justify-between gap-1">
                            <div className="flex items-center gap-1 shrink-0">
                                <ShoppingCart className="h-4 w-4 text-primary" />
                                <span className="font-bold text-sm hidden sm:inline">Orden</span>
                            </div>

                            <div className="flex gap-1 flex-1 justify-end">
                                <Button
                                    variant={channel === 'mostrador' && orderType === 'pickup' ? 'default' : 'outline'}
                                    size="icon"
                                    className="h-10 w-10 flex flex-col gap-0.5 p-0"
                                    onClick={() => {
                                        setChannel('mostrador')
                                        setOrderType('pickup')
                                        setDeliveryFee(0)
                                    }}
                                    title="Para Llevar"
                                >
                                    <Store className="h-4 w-4" />
                                    <span className="text-[8px] font-bold">POS</span>
                                </Button>
                                <Button
                                    variant={channel === 'mostrador' && orderType === 'delivery' ? 'default' : 'outline'}
                                    size="icon"
                                    className="h-10 w-10 flex flex-col gap-0.5 p-0"
                                    onClick={() => {
                                        setChannel('mostrador')
                                        setOrderType('delivery')
                                    }}
                                    title="Delivery Propio"
                                >
                                    <Truck className="h-4 w-4" />
                                    <span className="text-[8px] font-bold">Dely</span>
                                </Button>
                                <Button
                                    variant={channel === 'uber' ? 'default' : 'outline'}
                                    size="icon"
                                    className="h-10 w-10 flex flex-col gap-0.5 p-0 border-green-200"
                                    onClick={() => {
                                        setChannel('uber')
                                        setOrderType('delivery')
                                        setDeliveryFee(0)
                                    }}
                                    title="Uber Eats"
                                >
                                    <Bike className="h-4 w-4 text-green-600" />
                                    <span className="text-[8px] font-bold">Uber</span>
                                </Button>
                                <Button
                                    variant={channel === 'didi' ? 'default' : 'outline'}
                                    size="icon"
                                    className="h-10 w-10 flex flex-col gap-0.5 p-0 border-orange-200"
                                    onClick={() => {
                                        setChannel('didi')
                                        setOrderType('delivery')
                                        setDeliveryFee(0)
                                    }}
                                    title="Didi Food"
                                >
                                    <Utensils className="h-4 w-4 text-orange-600" />
                                    <span className="text-[8px] font-bold">Didi</span>
                                </Button>
                            </div>
                        </div>

                        {/* Secondary Row: Customer & Delivery Fee */}
                        <div className="flex gap-1 mt-2">
                            {(role !== 'external_client' || isCityEx) && (
                                <div className="flex-1">
                                    {!selectedCustomer ? (
                                        <div className="flex gap-1">
                                            <div className="relative flex-1" ref={customerSearchRef}>
                                                <Button variant="outline" size="sm" className="w-full justify-start h-8 text-[10px] px-2" onClick={() => setShowCustomerSearch(!showCustomerSearch)}>
                                                    <User className="mr-1 h-3 w-3" /> Cliente
                                                </Button>
                                                {showCustomerSearch && (
                                                    <div className="absolute top-full left-0 w-full z-20 bg-background border rounded-md shadow-lg p-2 mt-1">
                                                        <Input
                                                            placeholder="Buscar..."
                                                            className="mb-2 h-7 text-xs"
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
                                                                    className="text-xs p-1.5 hover:bg-accent cursor-pointer rounded"
                                                                    onClick={() => {
                                                                        setSelectedCustomer(c)
                                                                        setShowCustomerSearch(false)
                                                                        setCustomerSearch('')
                                                                    }}
                                                                >
                                                                    {c.full_name}
                                                                </div>
                                                            ))}
                                                        </div>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    ) : (
                                        <div className="flex items-center justify-between px-2 h-8 bg-primary/5 rounded-md border border-primary/20">
                                            <div className="text-[10px] flex gap-2 items-center">
                                                <span className="font-bold truncate max-w-[80px]">{selectedCustomer.full_name.split(' ')[0]}</span>
                                                <span className="text-orange-600 font-black">
                                                    {orderType === 'delivery' ? `D:${selectedCustomer.delivery_sales_count || 0}/5` : `P:${selectedCustomer.pickup_sales_count || 0}/5`}
                                                </span>
                                            </div>
                                            <Button variant="ghost" size="icon" className="h-5 w-5" onClick={() => setSelectedCustomer(null)}>
                                                <Minus className="h-3 w-3" />
                                            </Button>
                                        </div>
                                    )}
                                </div>
                            )}

                            {orderType === 'delivery' && channel === 'mostrador' && (
                                <div className="w-[100px] shrink-0">
                                    <Select value={String(deliveryFee)} onValueChange={(v) => setDeliveryFee(Number(v))}>
                                        <SelectTrigger className="h-8 text-[10px] px-2">
                                            <SelectValue placeholder="Envío" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="0">$0</SelectItem>
                                            <SelectItem value="25">$25</SelectItem>
                                            <SelectItem value="35">$35</SelectItem>
                                            <SelectItem value="50">$50</SelectItem>
                                            <SelectItem value="75">$75</SelectItem>
                                        </SelectContent>
                                    </Select>
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
                            <span>${formatNumber(cartTotal)}</span>
                        </div>
                        {isCityEx ? (
                            <Button
                                className="w-full h-20 text-xl font-bold bg-primary hover:bg-primary/90 text-white shadow-lg transition-transform hover:scale-[1.02] active:scale-95"
                                disabled={cart.length === 0 || isCheckingOut}
                                onClick={() => handleCheckout('transfer')}
                            >
                                {isCheckingOut ? (
                                    <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                                ) : (
                                    <ShoppingCart className="mr-2 h-5 w-5" />
                                )}
                                Hacer Pedido
                            </Button>
                        ) : (
                            <div className="grid grid-cols-3 gap-2 w-full">
                                <Button
                                    variant="outline"
                                    className={`flex-col h-20 border-green-200 transition-all duration-300 ${selectedPaymentMethod === 'cash' ? 'bg-green-600 text-white border-green-600 scale-105 shadow-lg shadow-green-200' : 'hover:bg-green-50 text-green-700'}`}
                                    disabled={cart.length === 0 || isCheckingOut}
                                    onClick={() => {
                                        setSelectedPaymentMethod('cash')
                                        setShowPaymentModal(true)
                                    }}
                                >
                                    <div className={`p-1.5 rounded-lg mb-1 ${selectedPaymentMethod === 'cash' ? 'bg-white/20' : 'bg-green-100'}`}>
                                        <img src={cashImg} className="h-6 w-6 object-contain" alt="Efectivo" />
                                    </div>
                                    <span className="text-[10px] font-bold">Efectivo</span>
                                </Button>
                                <Button
                                    variant="outline"
                                    className={`flex-col h-20 border-blue-200 transition-all duration-300 ${selectedPaymentMethod === 'card' ? 'bg-blue-600 text-white border-blue-600 scale-105 shadow-lg shadow-blue-200' : 'hover:bg-blue-50 text-blue-700'}`}
                                    disabled={cart.length === 0 || isCheckingOut}
                                    onClick={() => {
                                        setSelectedPaymentMethod('card')
                                        setShowPaymentModal(true)
                                    }}
                                >
                                    <div className={`p-1.5 rounded-lg mb-1 ${selectedPaymentMethod === 'card' ? 'bg-white/20' : 'bg-blue-100'}`}>
                                        <img src={cardImg} className="h-6 w-6 object-contain" alt="Tarjeta" />
                                    </div>
                                    <span className="text-[10px] font-bold">Tarjeta</span>
                                </Button>
                                <Button
                                    variant="outline"
                                    className={`flex-col h-20 border-purple-200 transition-all duration-300 ${selectedPaymentMethod === 'transfer' ? 'bg-purple-600 text-white border-purple-600 scale-105 shadow-lg shadow-purple-200' : 'hover:bg-purple-50 text-purple-700'}`}
                                    disabled={cart.length === 0 || isCheckingOut}
                                    onClick={() => {
                                        setSelectedPaymentMethod('transfer')
                                        setShowPaymentModal(true)
                                    }}
                                >
                                    <div className={`p-1.5 rounded-lg mb-1 ${selectedPaymentMethod === 'transfer' ? 'bg-white/20' : 'bg-purple-100'}`}>
                                        <img src={mobileBankingImg} className="h-6 w-6 object-contain" alt="Transfer" />
                                    </div>
                                    <span className="text-[10px] font-bold">Transf.</span>
                                </Button>
                            </div>
                        )}
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

            {/* Payment Details Dialog */}
            <Dialog open={showPaymentModal} onOpenChange={setShowPaymentModal}>
                <DialogContent className="sm:max-w-[425px]">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2">
                            {selectedPaymentMethod === 'cash' && "💵 Pago en Efectivo"}
                            {selectedPaymentMethod === 'card' && "💳 Pago con Tarjeta"}
                            {selectedPaymentMethod === 'transfer' && "🏦 Pago por Transferencia"}
                        </DialogTitle>
                        <DialogDescription>
                            Detalles del pago para la orden de ${formatNumber(cartTotal)}
                        </DialogDescription>
                    </DialogHeader>

                    <div className="py-4 space-y-4">
                        {selectedPaymentMethod === 'cash' && (
                            <div className="space-y-4">
                                <div className="p-4 bg-green-50 rounded-lg border border-green-100 flex justify-between items-center">
                                    <span className="text-sm font-medium text-green-800">Total a Cobrar:</span>
                                    <span className="text-2xl font-bold text-green-900">${formatNumber(cartTotal)}</span>
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="monto-recibido">Monto Recibido</Label>
                                    <div className="relative">
                                        <span className="absolute left-3 top-2.5 text-muted-foreground">$</span>
                                        <Input
                                            id="monto-recibido"
                                            type="number"
                                            placeholder="0.00"
                                            className="pl-7 text-lg font-bold"
                                            value={montoRecibido || ''}
                                            onChange={(e) => setMontoRecibido(parseFloat(e.target.value) || 0)}
                                            autoFocus
                                        />
                                    </div>
                                </div>
                                {montoRecibido > 0 && (
                                    <div className="p-4 bg-orange-50 rounded-lg border border-orange-100 flex justify-between items-center animate-in fade-in slide-in-from-top-2">
                                        <span className="text-sm font-medium text-orange-800">Cambio a Devolver:</span>
                                        <span className={`text-3xl font-black ${montoRecibido >= cartTotal ? 'text-orange-600' : 'text-red-500'}`}>
                                            ${formatNumber(montoRecibido >= cartTotal ? (montoRecibido - cartTotal) : 0)}
                                        </span>
                                    </div>
                                )}
                            </div>
                        )}

                        {selectedPaymentMethod === 'card' && (
                            <div className="space-y-4">
                                <div className="space-y-2">
                                    <Label htmlFor="digitos-tarjeta">Últimos 4 dígitos del ticket (Recomendado)</Label>
                                    <Input
                                        id="digitos-tarjeta"
                                        placeholder="Ej: 4509"
                                        maxLength={4}
                                        value={referenciaPago}
                                        onChange={(e) => setReferenciaPago(e.target.value.replace(/\D/g, ''))}
                                        autoFocus
                                    />
                                </div>
                            </div>
                        )}

                        {selectedPaymentMethod === 'transfer' && (
                            <div className="space-y-4">
                                <div className="space-y-2">
                                    <Label htmlFor="referencia-transf">Referencia de Rastreo</Label>
                                    <Input
                                        id="referencia-transf"
                                        placeholder="Folio o concepto de la App bancaria"
                                        value={referenciaPago}
                                        onChange={(e) => setReferenciaPago(e.target.value)}
                                        autoFocus
                                    />
                                </div>
                            </div>
                        )}
                    </div>

                    <DialogFooter className="gap-2 sm:gap-0">
                        <Button variant="outline" onClick={() => setShowPaymentModal(false)}>
                            Cancelar
                        </Button>
                        <Button
                            className={`${selectedPaymentMethod === 'cash' ? 'bg-green-600 hover:bg-green-700' :
                                selectedPaymentMethod === 'card' ? 'bg-blue-600 hover:bg-blue-700' :
                                    'bg-purple-600 hover:bg-purple-700'}`}
                            disabled={isCheckingOut || (selectedPaymentMethod === 'cash' && montoRecibido < cartTotal)}
                            onClick={() => {
                                setShowPaymentModal(false)
                                handleCheckout()
                            }}
                        >
                            {isCheckingOut ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                            Confirmar Pago
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* New Customer Dialog */}
            <Dialog open={showNewCustomerDialog} onOpenChange={setShowNewCustomerDialog}>
                <DialogContent className="sm:max-w-[425px]">
                    <DialogHeader>
                        <DialogTitle>Agregar Nuevo Cliente</DialogTitle>
                        <DialogDescription>
                            Ingresa el nombre de la persona que realiza el pedido.
                        </DialogDescription>
                    </DialogHeader>
                    <form onSubmit={handleCreateCustomer} className="space-y-4 py-4">
                        <div className="space-y-2">
                            <Label htmlFor="name">Nombre Completo</Label>
                            <Input
                                id="name"
                                placeholder="Ej. Juan Pérez"
                                value={newCustomerName}
                                onChange={(e) => setNewCustomerName(e.target.value)}
                                required
                                autoFocus
                            />
                        </div>
                        <DialogFooter>
                            <Button type="button" variant="outline" onClick={() => setShowNewCustomerDialog(false)}>
                                Cancelar
                            </Button>
                            <Button type="submit" disabled={isCreatingCustomer || !newCustomerName.trim()}>
                                {isCreatingCustomer ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                                Guardar y Seleccionar
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>
        </>
    )
}
