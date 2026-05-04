import { useEffect, useState } from 'react'
import { ReportService } from '@/services/report.service'
import { StoreService } from '@/services/store.service'
import { cn } from '@/lib/utils'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Textarea } from '@/components/ui/textarea'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Button } from '@/components/ui/button'
import { 
    TrendingUp, ShoppingBag, 
    Loader2, Printer, ChevronLeft, ChevronRight, Store as StoreIcon, RotateCcw,
    DollarSign, FileSpreadsheet, FileText
} from 'lucide-react'
import { subDays } from 'date-fns'
import { exportToExcel, exportToPDF } from '@/utils/export'
import { ResponsiveContainer } from 'recharts'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { RestockReport } from './RestockReport'
import { Cell, Tooltip, BarChart, Bar, XAxis, YAxis } from 'recharts'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog'
import { Badge } from '@/components/ui/badge'
import { Label } from '@/components/ui/label'
import { toast } from 'react-toastify'
import { OrderService } from '@/services/order.service'
import { getMexicoDayString, getMexicoStartOfDayISO, getMexicoEndOfDayISO } from '@/utils/date'
import { PDFDownloadLink } from '@react-pdf/renderer'
import { SalesReportDocument } from '@/components/reports/SalesReportDocument'
import { useAuthStore } from '@/store/auth.store'
import { useTicketPrint } from '@/hooks/useTicketPrint'
import { PrintService } from '@/services/print.service'
import { formatNumber } from '@/utils/format'
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuLabel,
    DropdownMenuRadioGroup,
    DropdownMenuRadioItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
    DropdownMenuSub,
    DropdownMenuSubContent,
    DropdownMenuSubTrigger,
} from "@/components/ui/dropdown-menu"
import { Filter } from 'lucide-react'

export default function ReportsPage() {
    const [loading, setLoading] = useState(true)
    const [dateRange, setDateRange] = useState({
        start: getMexicoDayString(new Date()),
        end: getMexicoDayString(new Date())
    })
    const [selectedPill, setSelectedPill] = useState<'hoy' | '7d' | '30d'>('hoy')

    const { role, storeId: userStoreId } = useAuthStore()
    const isSuperAdmin = role === 'super_admin'

    // Filter state
    const [selectedStoreId, setSelectedStoreId] = useState<string | 'all'>('00000000-0000-0000-0000-000000000001')
    const [storesList, setStoresList] = useState<any[]>([])
    const [paymentFilter, setPaymentFilter] = useState<string>('all')

    // Stats
    const [salesStats, setSalesStats] = useState({ totalSales: 0, totalOrders: 0, avgTicket: 0 })
    const [topProducts, setTopProducts] = useState<any[]>([])
    const [valuation, setValuation] = useState({ totalValuation: 0, productCount: 0 })
    const [storeComparison, setStoreComparison] = useState<any[]>([])
    const [ordersList, setOrdersList] = useState<any[]>([])
    const [paymentMethodSales, setPaymentMethodSales] = useState<any[]>([])
    const [currentPage, setCurrentPage] = useState(1)
    const [showReturnDialog, setShowReturnDialog] = useState(false)
    const [selectedOrder, setSelectedOrder] = useState<any>(null)
    const [returnReason, setReturnReason] = useState('')
    const [selectedItems, setSelectedItems] = useState<string[]>([])
    const [isCancelling, setIsCancelling] = useState(false)
    const { user } = useAuthStore()
    const ITEMS_PER_PAGE = 10
    const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8', '#ffc658']
    
    const REASON_TAGS = [
        "No vendido",
        "Producto dañado",
        "Cliente insatisfecho",
        "Demora excesiva",
        "Falta de insumos"
    ]

    const { buildTicketData } = useTicketPrint()


    useEffect(() => {
        if (isSuperAdmin) {
            loadStoresList()
        } else if (userStoreId) {
            setSelectedStoreId(userStoreId)
        }
    }, [isSuperAdmin, userStoreId])

    useEffect(() => {
        if (!isSuperAdmin && !userStoreId) return
        setCurrentPage(1) // Reset to first page on filter change
        loadReports()
    }, [selectedStoreId, isSuperAdmin, userStoreId, dateRange.start, dateRange.end])

    const loadStoresList = async () => {
        try {
            const stores = await StoreService.getStores()
            setStoresList(stores || [])
        } catch (error) {
            console.error('Error loading stores list:', error)
        }
    }

    const loadReports = async () => {
        setLoading(true)
        console.log('Loading reports for:', { selectedStoreId, dateRange })
        try {
            const start = getMexicoStartOfDayISO(dateRange.start)
            const end = getMexicoEndOfDayISO(dateRange.end)
            const targetStoreId = isSuperAdmin ? (selectedStoreId === 'all' ? null : selectedStoreId) : userStoreId

            const promises: Promise<any>[] = []

            if (targetStoreId) {
                promises.push(ReportService.getSalesReport(targetStoreId, start, end))
                promises.push(ReportService.getTopProducts(targetStoreId, start, end, 5))
                promises.push(ReportService.getInventoryValuation(targetStoreId))
                promises.push(ReportService.getSalesByPaymentMethod(targetStoreId, start, end))
            } else if (isSuperAdmin && selectedStoreId === 'all') {
                promises.push(ReportService.getSalesByStore(start, end))
            }

            const results = await Promise.all(promises)

            if (targetStoreId) {
                setSalesStats(results[0])
                setOrdersList(results[0].orders || [])
                setTopProducts(results[1])
                setValuation(results[2])
                setPaymentMethodSales(results[3])
                setStoreComparison([])
            } else if (isSuperAdmin && selectedStoreId === 'all') {
                const comparison = results[0]
                setStoreComparison(comparison)
                setOrdersList([])

                const totalSales = comparison.reduce((sum: number, s: any) => sum + s.totalSales, 0)
                const totalOrders = comparison.reduce((sum: number, s: any) => sum + s.totalOrders, 0)
                const avgTicket = totalOrders > 0 ? totalSales / totalOrders : 0

                setSalesStats({ totalSales, totalOrders, avgTicket })
                setTopProducts([])
                setValuation({ totalValuation: 0, productCount: 0 })
            }
        } catch (error) {
            console.error('Error loading reports details:', JSON.stringify(error, null, 2))
            console.error('Full Error Object:', error)
        } finally {
            setLoading(false)
        }
    }

    const handlePillChange = (pill: 'hoy' | '7d' | '30d') => {
        setSelectedPill(pill)
        const end = new Date()
        let start = new Date()

        if (pill === '7d') {
            start = subDays(end, 6)
        } else if (pill === '30d') {
            start = subDays(end, 29)
        }
        // 'hoy' leaves start = end

        setDateRange({
            start: getMexicoDayString(start),
            end: getMexicoDayString(end)
        })
    }

    return (
        <div className="space-y-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold">Reportes y Análisis</h1>
                    <p className="text-muted-foreground">Resumen de ventas y estado del inventario</p>
                </div>

                <div className="flex flex-col sm:flex-row items-end sm:items-center gap-2">
                    {/* Consolidated Filters Dropdown */}
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button variant="outline" className="h-8 rounded-lg border-2 font-bold px-4 bg-white hover:bg-slate-50">
                                <Filter className="h-4 w-4 mr-2 text-muted-foreground" />
                                Filtros Adicionales
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent className="w-56 rounded-xl" align="end">
                            <DropdownMenuLabel>Filtrar Reportes</DropdownMenuLabel>
                            <DropdownMenuSeparator />
                            
                            {/* Sucursal Filter (Admin only) */}
                            {isSuperAdmin && (
                                <DropdownMenuSub>
                                    <DropdownMenuSubTrigger>
                                        <span>Sucursal</span>
                                    </DropdownMenuSubTrigger>
                                    <DropdownMenuSubContent className="rounded-xl">
                                        <DropdownMenuRadioGroup value={selectedStoreId} onValueChange={setSelectedStoreId}>
                                            <DropdownMenuRadioItem value="all">Todas las tiendas</DropdownMenuRadioItem>
                                            {storesList.map(store => (
                                                <DropdownMenuRadioItem key={store.id} value={store.id}>{store.name}</DropdownMenuRadioItem>
                                            ))}
                                        </DropdownMenuRadioGroup>
                                    </DropdownMenuSubContent>
                                </DropdownMenuSub>
                            )}

                            {/* Payment Method Filter */}
                            <DropdownMenuSub>
                                <DropdownMenuSubTrigger>
                                    <span>Método de Pago</span>
                                </DropdownMenuSubTrigger>
                                <DropdownMenuSubContent className="rounded-xl">
                                    <DropdownMenuRadioGroup value={paymentFilter} onValueChange={setPaymentFilter}>
                                        <DropdownMenuRadioItem value="all">Todos</DropdownMenuRadioItem>
                                        <DropdownMenuRadioItem value="cash">Efectivo</DropdownMenuRadioItem>
                                        <DropdownMenuRadioItem value="card">Tarjeta</DropdownMenuRadioItem>
                                        <DropdownMenuRadioItem value="transfer">Transferencia</DropdownMenuRadioItem>
                                    </DropdownMenuRadioGroup>
                                </DropdownMenuSubContent>
                            </DropdownMenuSub>

                        </DropdownMenuContent>
                    </DropdownMenu>

                    <div className="flex items-center gap-1 bg-muted/30 p-1 rounded-xl border border-slate-200 shadow-sm">
                        {[
                            { id: 'hoy', label: 'Hoy' },
                            { id: '7d', label: '7d' },
                            { id: '30d', label: '30d' }
                        ].map((pill) => (
                            <Button
                                key={pill.id}
                                variant={selectedPill === pill.id ? 'default' : 'ghost'}
                                size="sm"
                                onClick={() => handlePillChange(pill.id as any)}
                                className={cn(
                                    "h-8 px-4 rounded-lg font-bold transition-all",
                                    selectedPill === pill.id 
                                        ? "bg-primary text-white shadow-md shadow-primary/20 scale-105" 
                                        : "text-muted-foreground hover:bg-slate-100"
                                )}
                            >
                                {pill.label}
                            </Button>
                        ))}
                    </div>
                </div>
            </div>

            {loading && !salesStats.totalSales ? (
                <div className="flex justify-center h-40 items-center">
                    <Loader2 className="h-8 w-8 animate-spin" />
                </div>
            ) : (
                <Tabs defaultValue="overview" className="space-y-4">
                    <TabsList className="bg-white border text-gray-500">
                        <TabsTrigger value="overview" className="data-[state=active]:bg-orange-50 data-[state=active]:text-orange-700">Resumen Ventas</TabsTrigger>
                        <TabsTrigger value="restock" className="data-[state=active]:bg-orange-50 data-[state=active]:text-orange-700">Reabastecimiento y OC</TabsTrigger>
                    </TabsList>

                    <TabsContent value="overview" className="space-y-4">
                        {/* Key Metrics Cards */}
                        <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
                            <Card>
                                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                    <CardTitle className="text-sm font-medium">Ventas Totales</CardTitle>
                                    <DollarSign className="h-4 w-4 text-green-600" />
                                </CardHeader>
                                <CardContent>
                                    <div className="text-2xl font-bold text-green-600">${formatNumber(salesStats.totalSales)}</div>
                                    <p className="text-xs text-muted-foreground">En el periodo seleccionado</p>
                                </CardContent>
                            </Card>
                            <Card>
                                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                    <CardTitle className="text-sm font-medium">Pedidos</CardTitle>
                                    <ShoppingBag className="h-4 w-4 text-blue-600" />
                                </CardHeader>
                                <CardContent>
                                    <div className="text-2xl font-bold">{salesStats.totalOrders}</div>
                                    <p className="text-xs text-muted-foreground">Ordenes completadas</p>
                                </CardContent>
                            </Card>
                            <Card>
                                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                    <CardTitle className="text-sm font-medium">Ticket Promedio</CardTitle>
                                    <TrendingUp className="h-4 w-4 text-orange-600" />
                                </CardHeader>
                                <CardContent>
                                    <div className="text-2xl font-bold">${formatNumber(salesStats.avgTicket)}</div>
                                    <p className="text-xs text-muted-foreground">Promedio por orden</p>
                                </CardContent>
                            </Card>
                            <Card>
                                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                    <CardTitle className="text-sm font-medium">Valor Inventario</CardTitle>
                                    <DollarSign className="h-4 w-4 text-purple-600" />
                                </CardHeader>
                                <CardContent>
                                    <div className="text-2xl font-bold text-purple-600">${formatNumber(valuation.totalValuation)}</div>
                                    <p className="text-xs text-muted-foreground">Costo actual almacenado</p>
                                </CardContent>
                            </Card>
                        </div>

                        {/* Stores Comparison Table (Super Admin Only) */}
                        {isSuperAdmin && selectedStoreId === 'all' && storeComparison.length > 0 && (
                            <Card>
                                <CardHeader className="flex flex-row items-center justify-between pb-2">
                                    <CardTitle className="flex items-center gap-2">
                                        <StoreIcon className="h-5 w-5" />
                                        Ventas por Tienda
                                    </CardTitle>
                                    <div className="flex gap-2">
                                        <Button
                                            variant="outline"
                                            className="h-12 w-12 rounded-xl border-green-200 bg-white shadow-sm hover:bg-green-50 hover:border-green-300 transition-all p-0 flex items-center justify-center"
                                            title="Exportar a Excel"
                                            onClick={() => exportToExcel(
                                                storeComparison.map(s => ({ Tienda: s.name, Pedidos: s.totalOrders, "Ventas Totales": s.totalSales, "Ticket Promedio": s.totalOrders > 0 ? s.totalSales / s.totalOrders : 0 })),
                                                `Ventas_Por_Tienda_${dateRange.start}_al_${dateRange.end}`
                                            )}
                                        >
                                            <FileSpreadsheet className="w-6 h-6 text-green-500" />
                                        </Button>
                                        <Button
                                            variant="outline"
                                            className="h-12 w-12 rounded-xl border-red-200 bg-white shadow-sm hover:bg-red-50 hover:border-red-300 transition-all p-0 flex items-center justify-center"
                                            title="Exportar a PDF"
                                            onClick={() => exportToPDF(
                                                'Ventas por Tienda',
                                                ['Tienda', 'Pedidos', 'Ventas Totales ($)', 'Ticket Promedio ($)'],
                                                storeComparison.map(s => [s.name, s.totalOrders, formatNumber(s.totalSales), formatNumber(s.totalOrders > 0 ? s.totalSales / s.totalOrders : 0)]),
                                                `Ventas_Por_Tienda_${dateRange.start}_al_${dateRange.end}`
                                            )}
                                        >
                                            <FileText className="w-6 h-6 text-red-500" />
                                        </Button>
                                    </div>
                                </CardHeader>
                                <CardContent className="overflow-x-auto">
                                    <Table className="min-w-[600px]">
                                        <TableHeader>
                                            <TableRow>
                                                <TableHead>Tienda</TableHead>
                                                <TableHead className="text-right">Pedidos</TableHead>
                                                <TableHead className="text-right">Ventas Totales</TableHead>
                                                <TableHead className="text-right">Ticket Promedio</TableHead>
                                            </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                            {storeComparison.map((store) => (
                                                <TableRow key={store.id}>
                                                    <TableCell className="font-medium">{store.name}</TableCell>
                                                    <TableCell className="text-right">{store.totalOrders}</TableCell>
                                                    <TableCell className="text-right font-bold text-green-600">${formatNumber(store.totalSales)}</TableCell>
                                                    <TableCell className="text-right">${formatNumber(store.totalOrders > 0 ? store.totalSales / store.totalOrders : 0)}</TableCell>
                                                </TableRow>
                                            ))}
                                        </TableBody>
                                    </Table>
                                </CardContent>
                            </Card>
                        )}

                        {/* Detailed Store View */}
                        {selectedStoreId !== 'all' && (
                            <div className="grid gap-4 md:grid-cols-2">
                                {/* Top Products */}
                                <Card className="col-span-1">
                                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                                        <CardTitle>Productos Más Vendidos</CardTitle>
                                        <div className="flex gap-2">
                                            <Button
                                                variant="outline"
                                                className="h-12 w-12 rounded-xl border-green-200 bg-white shadow-sm hover:bg-green-50 hover:border-green-300 transition-all p-0 flex items-center justify-center"
                                                disabled={topProducts.length === 0}
                                                title="Exportar a Excel"
                                                onClick={() => exportToExcel(
                                                    topProducts.map(p => ({ Producto: p.name, Cantidad: p.quantity, "Total Venta": p.revenue })),
                                                    `Reporte_Ventas_Productos_${dateRange.start}_al_${dateRange.end}`
                                                )}
                                            >
                                                <FileSpreadsheet className="w-6 h-6 text-green-500" />
                                            </Button>
                                            <PDFDownloadLink
                                                document={
                                                    <SalesReportDocument
                                                        data={topProducts}
                                                        totalRevenue={salesStats.totalSales}
                                                        totalOrders={salesStats.totalOrders}
                                                        averageTicket={salesStats.avgTicket}
                                                        period={`${dateRange.start} a ${dateRange.end}`}
                                                    />
                                                }
                                                fileName={`Reporte_Ventas_${dateRange.start}_al_${dateRange.end}.pdf`}
                                            >
                                                {({ loading: pdfLoading }) => (
                                                    <Button
                                                        variant="outline"
                                                        className="h-12 w-12 rounded-xl border-red-200 bg-white shadow-sm hover:bg-red-50 hover:border-red-300 transition-all p-0 flex items-center justify-center"
                                                        disabled={topProducts.length === 0 || pdfLoading}
                                                        title="Exportar a PDF"
                                                    >
                                                        {pdfLoading ? <Loader2 className="w-6 h-6 animate-spin text-red-500" /> : <FileText className="w-6 h-6 text-red-500" />}
                                                    </Button>
                                                )}
                                            </PDFDownloadLink>
                                        </div>
                                    </CardHeader>
                                    <CardContent className="overflow-x-auto">
                                        {topProducts.length === 0 ? (
                                            <p className="text-center text-muted-foreground py-4">No hay datos de ventas</p>
                                        ) : (
                                            <Table className="min-w-[400px]">
                                                <TableHeader>
                                                    <TableRow>
                                                        <TableHead>Producto</TableHead>
                                                        <TableHead className="text-right">Cant.</TableHead>
                                                        <TableHead className="text-right">Venta</TableHead>
                                                    </TableRow>
                                                </TableHeader>
                                                <TableBody>
                                                    {topProducts.map((product, idx) => (
                                                        <TableRow key={idx}>
                                                            <TableCell className="font-medium">{product.name}</TableCell>
                                                            <TableCell className="text-right">{product.quantity}</TableCell>
                                                            <TableCell className="text-right">${formatNumber(product.revenue)}</TableCell>
                                                        </TableRow>
                                                    ))}
                                                </TableBody>
                                            </Table>
                                        )}
                                    </CardContent>
                                </Card>

                                {/* Recent Activity or Chart Placeholder */}
                                <Card className="col-span-1">
                                    <CardHeader>
                                        <CardTitle>Ventas por Método de Pago</CardTitle>
                                    </CardHeader>
                                    <CardContent className="space-y-6">
                                        <div className="h-[250px]">
                                            {paymentMethodSales.length === 0 ? (
                                                <div className="h-full flex items-center justify-center">
                                                    <p className="text-muted-foreground">Sin datos de métodos de pago</p>
                                                </div>
                                            ) : (
                                                <ResponsiveContainer width="100%" height="100%" minWidth={0}>
                                                    <BarChart 
                                                        data={paymentMethodSales} 
                                                        layout="vertical" 
                                                        margin={{ left: -30, right: 30, top: 10, bottom: 10 }}
                                                    >
                                                        <XAxis type="number" hide />
                                                        <YAxis 
                                                            dataKey="name" 
                                                            type="category" 
                                                            width={120} 
                                                            axisLine={false} 
                                                            tickLine={false} 
                                                            tick={{ fill: '#64748b', fontSize: 12, fontWeight: 700 }} 
                                                        />
                                                        <Tooltip
                                                            cursor={{ fill: 'rgba(0,0,0,0.02)' }}
                                                            formatter={(value) => [`$${formatNumber(Number(value))}`, 'Ventas']}
                                                            contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 25px rgba(0,0,0,0.1)' }}
                                                        />
                                                        <Bar 
                                                            dataKey="value" 
                                                            radius={[0, 8, 8, 0]}
                                                            barSize={28}
                                                        >
                                                            {paymentMethodSales.map((_entry, index) => (
                                                                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                                            ))}
                                                        </Bar>
                                                    </BarChart>
                                                </ResponsiveContainer>
                                            )}
                                        </div>

                                        {paymentMethodSales.length > 0 && (
                                            <div className="border rounded-lg overflow-x-auto">
                                                <Table className="min-w-[300px]">
                                                    <TableHeader className="bg-muted/50">
                                                        <TableRow>
                                                            <TableHead className="h-9">Método</TableHead>
                                                            <TableHead className="text-right h-9">Ventas</TableHead>
                                                            <TableHead className="text-right h-9">Pedidos</TableHead>
                                                        </TableRow>
                                                    </TableHeader>
                                                    <TableBody>
                                                        {paymentMethodSales.map((item, idx) => (
                                                            <TableRow key={idx}>
                                                                <TableCell className="py-2">
                                                                    <div className="flex items-center gap-2">
                                                                        <div 
                                                                            className="w-3 h-3 rounded-full" 
                                                                            style={{ backgroundColor: COLORS[idx % COLORS.length] }}
                                                                        />
                                                                        {item.name}
                                                                    </div>
                                                                </TableCell>
                                                                <TableCell className="text-right py-2 font-medium">
                                                                    ${formatNumber(item.value)}
                                                                </TableCell>
                                                                <TableCell className="text-right py-2 text-muted-foreground">
                                                                    {item.count}
                                                                </TableCell>
                                                            </TableRow>
                                                        ))}
                                                        <TableRow className="bg-muted/30 font-bold">
                                                            <TableCell className="py-2">Total</TableCell>
                                                            <TableCell className="text-right py-2">
                                                                ${formatNumber(paymentMethodSales.reduce((sum, item) => sum + item.value, 0))}
                                                            </TableCell>
                                                            <TableCell className="text-right py-2">
                                                                {paymentMethodSales.reduce((sum, item) => sum + item.count, 0)}
                                                            </TableCell>
                                                        </TableRow>
                                                    </TableBody>
                                                </Table>
                                            </div>
                                        )}
                                    </CardContent>
                                </Card>
                            </div>
                        )}

                        {/* Recent Orders Table with Reprint Option */}
                        {selectedStoreId !== 'all' && ordersList.length > 0 && (
                            <Card className="mt-6">
                                <CardHeader>
                                    <CardTitle className="flex items-center gap-2">
                                        <ShoppingBag className="h-5 w-5" />
                                        Detalle de Ventas Recientes
                                    </CardTitle>
                                </CardHeader>
                                <CardContent className="overflow-x-auto">
                                    <Table className="min-w-[800px]">
                                        <TableHeader>
                                            <TableRow>
                                                <TableHead>Folio</TableHead>
                                                <TableHead>Fecha / Hora</TableHead>
                                                <TableHead>Cliente</TableHead>
                                                <TableHead>Método</TableHead>
                                                <TableHead className="text-right">Total</TableHead>
                                                <TableHead className="text-center">Acciones</TableHead>
                                            </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                            {ordersList
                                                .filter(o => paymentFilter === 'all' || o.payment_method === paymentFilter)
                                                .slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE)
                                                .map((order) => (
                                                    <TableRow key={order.id}>
                                                        <TableCell className="font-mono text-xs font-bold">{order.order_number}</TableCell>
                                                        <TableCell className="text-xs">
                                                            {new Date(order.created_at).toLocaleString('es-MX', {
                                                                day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit'
                                                            })}
                                                        </TableCell>
                                                        <TableCell className="text-xs">{order.customer?.full_name || 'Mostrador'}</TableCell>
                                                        <TableCell className="text-xs capitalize">
                                                            {order.payment_method === 'cash' ? '💵 Efectivo' :
                                                                order.payment_method === 'card' ? `💳 Tarjeta ${order.referencia_pago ? `(****${order.referencia_pago})` : ''}` :
                                                                    `🏦 Transf. ${order.referencia_pago ? `(${order.referencia_pago})` : ''}`}
                                                        </TableCell>
                                                        <TableCell className="text-right font-bold">${formatNumber(Number(order.total))}</TableCell>
                                                        <TableCell className="text-center flex gap-2 justify-center">
                                                            <Button
                                                                variant="outline"
                                                                size="icon"
                                                                className="h-8 w-8 border-orange-200 text-orange-700 hover:bg-orange-50"
                                                                title="Reimprimir Ticket"
                                                                onClick={async () => {
                                                                    const storeData = await StoreService.getStoreById(order.store_id)
                                                                    const ticketData = buildTicketData(
                                                                        order.order_number,
                                                                        order.items?.map((item: any) => ({
                                                                            product: { name: item.product?.name || 'Producto', sale_price: item.unit_price },
                                                                            quantity: item.quantity
                                                                        })) || [],
                                                                        order.tax || 0,
                                                                        order.customer || null,
                                                                        order.order_type,
                                                                        storeData,
                                                                        order.delivery_fee
                                                                    )
                                                                    PrintService.printTicket(ticketData)
                                                                }}
                                                            >
                                                                <Printer className="h-4 w-4" />
                                                            </Button>
                                                            {order.status !== 'cancelled' && (
                                                                <Button
                                                                    variant="outline"
                                                                    size="icon"
                                                                    className="h-8 w-8 border-red-200 text-red-700 hover:bg-red-50"
                                                                    title="Procesar Devolución"
                                                                    onClick={() => {
                                                                        setSelectedOrder(order)
                                                                        setSelectedItems(order.items?.map((i: any) => i.id) || [])
                                                                        setShowReturnDialog(true)
                                                                    }}
                                                                >
                                                                    <RotateCcw className="h-4 w-4" />
                                                                </Button>
                                                            )}
                                                        </TableCell>
                                                    </TableRow>
                                                ))}
                                        </TableBody>
                                    </Table>

                                    {/* Pagination Controls */}
                                    {ordersList.length > ITEMS_PER_PAGE && (
                                        <div className="flex items-center justify-between px-2 py-4 border-t">
                                            <div className="text-sm text-muted-foreground">
                                                Mostrando <span className="font-medium">{Math.min((currentPage - 1) * ITEMS_PER_PAGE + 1, ordersList.length)}</span> a <span className="font-medium">{Math.min(currentPage * ITEMS_PER_PAGE, ordersList.length)}</span> de <span className="font-medium">{ordersList.length}</span> registros
                                            </div>
                                            <div className="flex items-center space-x-2">
                                                <Button
                                                    variant="outline"
                                                    size="sm"
                                                    onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                                                    disabled={currentPage === 1}
                                                    className="h-8 w-8 p-0"
                                                >
                                                    <ChevronLeft className="h-4 w-4" />
                                                </Button>
                                                <div className="text-xs font-medium">
                                                    Página {currentPage} de {Math.ceil(ordersList.length / ITEMS_PER_PAGE)}
                                                </div>
                                                <Button
                                                    variant="outline"
                                                    size="sm"
                                                    onClick={() => setCurrentPage(prev => Math.min(prev + 1, Math.ceil(ordersList.length / ITEMS_PER_PAGE)))}
                                                    disabled={currentPage === Math.ceil(ordersList.length / ITEMS_PER_PAGE)}
                                                    className="h-8 w-8 p-0"
                                                >
                                                    <ChevronRight className="h-4 w-4" />
                                                </Button>
                                            </div>
                                        </div>
                                    )}
                                </CardContent>
                            </Card>
                        )}
                    </TabsContent>

                    <TabsContent value="restock" className="space-y-4 mt-6">
                        <RestockReport />
                    </TabsContent>
                </Tabs>
            )}

            {/* Return/Cancellation Dialog */}
            <Dialog open={showReturnDialog} onOpenChange={setShowReturnDialog}>
                <DialogContent className="sm:max-w-[550px] bg-white dark:bg-zinc-950 border-none shadow-2xl p-0 overflow-hidden rounded-3xl">
                    <div className="bg-primary/5 p-6 border-b border-primary/10">
                        <DialogHeader>
                            <DialogTitle className="text-2xl font-black italic flex items-center gap-2">
                                <RotateCcw className="h-6 w-6 text-primary" />
                                PROCESAR DEVOLUCIÓN
                            </DialogTitle>
                            <DialogDescription className="text-sm font-medium opacity-70">
                                Orden: <span className="font-mono font-bold text-primary">{selectedOrder?.order_number}</span> • Total Original: <span className="font-bold">${formatNumber(Number(selectedOrder?.total))}</span>
                            </DialogDescription>
                        </DialogHeader>
                    </div>
                    
                    <div className="p-6 space-y-6">
                        <div className="space-y-3">
                            <Label className="text-[10px] uppercase tracking-widest font-bold opacity-50">Motivo de la Devolución</Label>
                            <div className="flex flex-wrap gap-2 mb-2">
                                {REASON_TAGS.map(tag => (
                                    <button
                                        key={tag}
                                        type="button"
                                        onClick={() => setReturnReason(tag)}
                                        className={cn(
                                            "text-[10px] font-bold px-3 py-1 rounded-full border transition-all",
                                            returnReason === tag 
                                                ? "bg-primary text-white border-primary shadow-lg shadow-primary/20" 
                                                : "bg-muted/50 text-muted-foreground border-transparent hover:border-primary/30"
                                        )}
                                    >
                                        {tag}
                                    </button>
                                ))}
                            </div>
                            <Textarea 
                                placeholder="Describe el motivo detalladamente..." 
                                value={returnReason}
                                onChange={e => setReturnReason(e.target.value)}
                                className="min-h-[80px] bg-muted/30 border-none rounded-2xl resize-none focus-visible:ring-primary/30"
                            />
                        </div>

                        <div className="space-y-3">
                            <Label className="text-[10px] uppercase tracking-widest font-bold opacity-50">Items a Devolver</Label>
                            <div className="bg-muted/20 rounded-2xl border border-muted/30 overflow-hidden max-h-48">
                                <div className="divide-y divide-muted/30 overflow-y-auto max-h-48 scrollbar-hide">
                                    {selectedOrder?.items?.map((item: any) => (
                                        <div key={item.id} className="p-3 flex items-center justify-between group hover:bg-primary/5 transition-colors">
                                            <div className="flex items-center gap-3">
                                                <div className="relative flex items-center justify-center">
                                                    <input 
                                                        type="checkbox" 
                                                        id={`item-${item.id}`}
                                                        checked={selectedItems.includes(item.id)}
                                                        onChange={(e) => {
                                                            if (e.target.checked) setSelectedItems([...selectedItems, item.id])
                                                            else setSelectedItems(selectedItems.filter(id => id !== item.id))
                                                        }}
                                                        className="h-5 w-5 rounded-md border-2 border-primary/20 checked:bg-primary transition-all cursor-pointer accent-primary"
                                                    />
                                                </div>
                                                <label htmlFor={`item-${item.id}`} className="cursor-pointer">
                                                    <p className="text-sm font-bold">{item.product?.name}</p>
                                                    <p className="text-[10px] text-muted-foreground">Cantidad: {item.quantity}</p>
                                                </label>
                                            </div>
                                            <span className="font-mono font-bold text-sm">${formatNumber(Number(item.subtotal))}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>

                        {/* Refund Preview */}
                        {selectedItems.length > 0 && (
                            <div className="bg-orange-50 dark:bg-orange-950/20 p-4 rounded-2xl border border-orange-100 dark:border-orange-900/30 flex justify-between items-center animate-in fade-in slide-in-from-bottom-2">
                                <div>
                                    <p className="text-[10px] uppercase tracking-widest font-bold text-orange-600 dark:text-orange-400">Total a Reembolsar</p>
                                    <p className="text-2xl font-black text-orange-700 dark:text-orange-300">
                                        ${formatNumber(
                                            selectedOrder?.items
                                                ?.filter((item: any) => selectedItems.includes(item.id))
                                                ?.reduce((sum: number, item: any) => sum + Number(item.subtotal), 0) || 0
                                        )}
                                    </p>
                                </div>
                                <div className="text-right">
                                    <Badge className="bg-orange-600 hover:bg-orange-600 text-white border-none rounded-full px-4">
                                        {selectedItems.length} {selectedItems.length === 1 ? 'item' : 'items'}
                                    </Badge>
                                </div>
                            </div>
                        )}
                        
                        <div className="flex gap-2 text-[9px] text-muted-foreground italic bg-blue-50 dark:bg-blue-950/20 p-2 rounded-lg border border-blue-100 dark:border-blue-900/30">
                            <span className="font-bold text-blue-600 dark:text-blue-400">INFO:</span>
                            Los productos seleccionados se restaurarán automáticamente al inventario.
                        </div>
                    </div>

                    <div className="p-6 bg-muted/30 flex flex-col sm:flex-row gap-3">
                        <Button 
                            variant="outline" 
                            className="flex-1 h-12 rounded-2xl border-red-200 text-red-600 hover:bg-red-50 hover:text-red-700 font-bold transition-all border-2"
                            disabled={isCancelling || !returnReason}
                            onClick={async () => {
                                if (!confirm('¿Seguro que deseas CANCELAR toda la orden? Esto restaurará el stock de TODO.')) return
                                setIsCancelling(true)
                                try {
                                    await OrderService.cancelOrder(selectedOrder.id, user?.id, returnReason)
                                    toast.success('Orden cancelada correctamente')
                                    setShowReturnDialog(false)
                                    loadReports()
                                } catch (e) {
                                    toast.error('Error al cancelar orden')
                                } finally {
                                    setIsCancelling(false)
                                }
                            }}
                        >
                            {isCancelling ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                            Cancelar Orden Completa
                        </Button>
                        <Button 
                            variant="default" 
                            className="flex-1 h-12 rounded-2xl bg-primary hover:bg-primary/90 text-white shadow-xl shadow-primary/20 font-bold transition-all"
                            disabled={isCancelling || selectedItems.length === 0 || !returnReason}
                            onClick={async () => {
                                setIsCancelling(true)
                                try {
                                    await OrderService.returnItems(selectedOrder.id, selectedItems, user?.id, returnReason)
                                    toast.success('Devolución parcial procesada')
                                    setShowReturnDialog(false)
                                    loadReports()
                                } catch (e) {
                                    toast.error('Error al procesar devolución')
                                } finally {
                                    setIsCancelling(false)
                                }
                            }}
                        >
                            Confirmar Devolución
                        </Button>
                    </div>
                </DialogContent>
            </Dialog>
        </div>
    )
}
