import { useEffect, useState } from 'react'
import { ReportService } from '@/services/report.service'
import { StoreService } from '@/services/store.service'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { 
    TrendingUp, ShoppingBag, 
    Loader2, Printer, ChevronLeft, ChevronRight, Store as StoreIcon, RotateCcw,
    DollarSign, FileSpreadsheet, FileText
} from 'lucide-react'
import { startOfMonth, endOfMonth } from 'date-fns'
import { exportToExcel, exportToPDF } from '@/utils/export'
import { ResponsiveContainer } from 'recharts'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { RestockReport } from './RestockReport'
import { PieChart, Pie, Cell, Legend, Tooltip } from 'recharts'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import { toast } from 'react-toastify'
import { OrderService } from '@/services/order.service'
import { getMexicoDayString, getMexicoStartOfDayISO, getMexicoEndOfDayISO } from '@/utils/date'
import { PDFDownloadLink } from '@react-pdf/renderer'
import { SalesReportDocument } from '@/components/reports/SalesReportDocument'
import { useAuthStore } from '@/store/auth.store'
import { useTicketPrint } from '@/hooks/useTicketPrint'
import { PrintService } from '@/services/print.service'

export default function ReportsPage() {
    const [loading, setLoading] = useState(true)
    const [dateRange, setDateRange] = useState({
        start: getMexicoDayString(startOfMonth(new Date())),
        end: getMexicoDayString(endOfMonth(new Date()))
    })

    const { role, storeId: userStoreId } = useAuthStore()
    const isSuperAdmin = role === 'super_admin'

    // Filter state
    const [selectedStoreId, setSelectedStoreId] = useState<string | 'all'>('all')
    const [storesList, setStoresList] = useState<any[]>([])

    // Stats
    const [salesStats, setSalesStats] = useState({ totalSales: 0, totalOrders: 0, avgTicket: 0 })
    const [topProducts, setTopProducts] = useState<any[]>([])
    const [valuation, setValuation] = useState({ totalValuation: 0, productCount: 0 })
    const [storeComparison, setStoreComparison] = useState<any[]>([])
    const [ordersList, setOrdersList] = useState<any[]>([])
    const [channelSales, setChannelSales] = useState<any[]>([])
    const [currentPage, setCurrentPage] = useState(1)
    const [showReturnDialog, setShowReturnDialog] = useState(false)
    const [selectedOrder, setSelectedOrder] = useState<any>(null)
    const [returnReason, setReturnReason] = useState('')
    const [selectedItems, setSelectedItems] = useState<string[]>([])
    const [isCancelling, setIsCancelling] = useState(false)
    const { user } = useAuthStore()
    const ITEMS_PER_PAGE = 10
    const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8', '#ffc658']

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
        try {
            const start = getMexicoStartOfDayISO(dateRange.start)
            const end = getMexicoEndOfDayISO(dateRange.end)
            const targetStoreId = isSuperAdmin ? (selectedStoreId === 'all' ? null : selectedStoreId) : userStoreId

            const promises: Promise<any>[] = []

            if (targetStoreId) {
                promises.push(ReportService.getSalesReport(targetStoreId, start, end))
                promises.push(ReportService.getTopProducts(targetStoreId, start, end, 5))
                promises.push(ReportService.getInventoryValuation(targetStoreId))
                promises.push(ReportService.getSalesByChannel(targetStoreId, start, end))
            } else if (isSuperAdmin && selectedStoreId === 'all') {
                promises.push(ReportService.getSalesByStore(start, end))
            }

            const results = await Promise.all(promises)

            if (targetStoreId) {
                setSalesStats(results[0])
                setOrdersList(results[0].orders || [])
                setTopProducts(results[1])
                setValuation(results[2])
                setChannelSales(results[3])
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

    return (
        <div className="space-y-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold">Reportes y Análisis</h1>
                    <p className="text-muted-foreground">Resumen de ventas y estado del inventario</p>
                </div>

                <div className="flex flex-col sm:flex-row items-end sm:items-center gap-2">
                    {isSuperAdmin && (
                        <Select value={selectedStoreId} onValueChange={setSelectedStoreId}>
                            <SelectTrigger className="w-[180px]">
                                <SelectValue placeholder="Seleccionar Tienda" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">Todas las tiendas</SelectItem>
                                {storesList.map(store => (
                                    <SelectItem key={store.id} value={store.id}>{store.name}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    )}

                    <div className="flex items-center gap-2 bg-card p-1 rounded-md border shadow-sm">
                        <Input
                            type="date"
                            value={dateRange.start}
                            onChange={(e) => setDateRange(prev => ({ ...prev, start: e.target.value }))}
                            className="w-auto h-8 border-none"
                        />
                        <span className="text-muted-foreground">-</span>
                        <Input
                            type="date"
                            value={dateRange.end}
                            onChange={(e) => setDateRange(prev => ({ ...prev, end: e.target.value }))}
                            className="w-auto h-8 border-none"
                        />
                        <Button size="sm" variant="ghost" onClick={loadReports} disabled={loading}>
                            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Filtrar'}
                        </Button>
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
                        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                            <Card>
                                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                    <CardTitle className="text-sm font-medium">Ventas Totales</CardTitle>
                                    <DollarSign className="h-4 w-4 text-green-600" />
                                </CardHeader>
                                <CardContent>
                                    <div className="text-2xl font-bold text-green-600">${salesStats.totalSales.toFixed(2)}</div>
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
                                    <div className="text-2xl font-bold">${salesStats.avgTicket.toFixed(2)}</div>
                                    <p className="text-xs text-muted-foreground">Promedio por orden</p>
                                </CardContent>
                            </Card>
                            <Card>
                                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                    <CardTitle className="text-sm font-medium">Valor Inventario</CardTitle>
                                    <DollarSign className="h-4 w-4 text-purple-600" />
                                </CardHeader>
                                <CardContent>
                                    <div className="text-2xl font-bold text-purple-600">${valuation.totalValuation.toFixed(2)}</div>
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
                                                storeComparison.map(s => [s.name, s.totalOrders, s.totalSales.toFixed(2), (s.totalOrders > 0 ? s.totalSales / s.totalOrders : 0).toFixed(2)]),
                                                `Ventas_Por_Tienda_${dateRange.start}_al_${dateRange.end}`
                                            )}
                                        >
                                            <FileText className="w-6 h-6 text-red-500" />
                                        </Button>
                                    </div>
                                </CardHeader>
                                <CardContent>
                                    <Table>
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
                                                    <TableCell className="text-right font-bold text-green-600">${store.totalSales.toFixed(2)}</TableCell>
                                                    <TableCell className="text-right">${(store.totalOrders > 0 ? store.totalSales / store.totalOrders : 0).toFixed(2)}</TableCell>
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
                                    <CardContent>
                                        {topProducts.length === 0 ? (
                                            <p className="text-center text-muted-foreground py-4">No hay datos de ventas</p>
                                        ) : (
                                            <Table>
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
                                                            <TableCell className="text-right">${product.revenue.toFixed(2)}</TableCell>
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
                                        <CardTitle>Ventas por Canal</CardTitle>
                                    </CardHeader>
                                    <CardContent className="h-[300px] flex items-center justify-center">
                                        {channelSales.length === 0 ? (
                                            <p className="text-muted-foreground">Sin datos de canales</p>
                                        ) : (
                                            <ResponsiveContainer width="100%" height="100%">
                                                <PieChart>
                                                    <Pie
                                                        data={channelSales}
                                                        cx="50%"
                                                        cy="50%"
                                                        labelLine={false}
                                                        outerRadius={80}
                                                        fill="#8884d8"
                                                        dataKey="value"
                                                        label={({ name, percent }) => `${name} ${((percent || 0) * 100).toFixed(0)}%`}
                                                    >
                                                        {channelSales.map((_entry, index) => (
                                                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                                        ))}
                                                    </Pie>
                                                    <Tooltip formatter={(value) => `$${Number(value).toFixed(2)}`} />
                                                    <Legend />
                                                </PieChart>
                                            </ResponsiveContainer>
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
                                <CardContent>
                                    <Table>
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
                                                        <TableCell className="text-right font-bold">${Number(order.total).toFixed(2)}</TableCell>
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
                <DialogContent className="sm:max-w-[500px]">
                    <DialogHeader>
                        <DialogTitle>Procesar Devolución / Cancelación</DialogTitle>
                        <DialogDescription>
                            Orden: {selectedOrder?.order_number} - Total: ${Number(selectedOrder?.total).toFixed(2)}
                        </DialogDescription>
                    </DialogHeader>
                    
                    <div className="py-4 space-y-4">
                        <div className="space-y-2">
                            <Label>Motivo de la Devolución</Label>
                            <Input 
                                placeholder="Ej: Error en pedido, producto dañado..." 
                                value={returnReason}
                                onChange={e => setReturnReason(e.target.value)}
                            />
                        </div>

                        <div className="space-y-2">
                            <Label>Seleccionar Items a Devolver</Label>
                            <div className="border rounded-md divide-y max-h-40 overflow-auto">
                                {selectedOrder?.items?.map((item: any) => (
                                    <div key={item.id} className="p-2 flex items-center justify-between text-sm">
                                        <div className="flex items-center gap-2">
                                            <input 
                                                type="checkbox" 
                                                checked={selectedItems.includes(item.id)}
                                                onChange={(e) => {
                                                    if (e.target.checked) setSelectedItems([...selectedItems, item.id])
                                                    else setSelectedItems(selectedItems.filter(id => id !== item.id))
                                                }}
                                            />
                                            <span>{item.product?.name} x{item.quantity}</span>
                                        </div>
                                        <span className="font-bold">${Number(item.subtotal).toFixed(2)}</span>
                                    </div>
                                ))}
                            </div>
                            <p className="text-[10px] text-muted-foreground italic">
                                * Se restaurará el stock de los productos seleccionados.
                            </p>
                        </div>
                    </div>

                    <DialogFooter className="flex flex-col sm:flex-row gap-2">
                        <Button 
                            variant="destructive" 
                            className="flex-1"
                            disabled={isCancelling || !returnReason}
                            onClick={async () => {
                                if (!confirm('¿Seguro que deseas CANCELAR toda la orden? Esto restaurará el stock de TODO.')) return
                                setIsCancelling(true)
                                try {
                                    await OrderService.cancelOrder(selectedOrder.id, user?.id || '', returnReason)
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
                            className="flex-1"
                            disabled={isCancelling || selectedItems.length === 0 || !returnReason}
                            onClick={async () => {
                                setIsCancelling(true)
                                try {
                                    await OrderService.returnItems(selectedOrder.id, selectedItems, user?.id || '', returnReason)
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
                            Devolución Parcial
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    )
}
