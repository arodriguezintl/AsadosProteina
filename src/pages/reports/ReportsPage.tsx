import { useEffect, useState } from 'react'
import { ReportService } from '@/services/report.service'
import { StoreService } from '@/services/store.service'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Loader2, DollarSign, ShoppingBag, TrendingUp, Store as StoreIcon, FileSpreadsheet, FileText } from 'lucide-react'
import { format, startOfMonth, endOfMonth } from 'date-fns'
import { exportToExcel, exportToPDF } from '@/utils/export'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts'

import { useAuthStore } from '@/store/auth.store'

export default function ReportsPage() {
    const [loading, setLoading] = useState(true)
    const [dateRange, setDateRange] = useState({
        start: format(startOfMonth(new Date()), 'yyyy-MM-dd'),
        end: format(endOfMonth(new Date()), 'yyyy-MM-dd')
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

    useEffect(() => {
        if (isSuperAdmin) {
            loadStoresList()
        } else if (userStoreId) {
            setSelectedStoreId(userStoreId)
        }
    }, [isSuperAdmin, userStoreId])

    useEffect(() => {
        // If not super admin, wait for storeId to be set
        if (!isSuperAdmin && !userStoreId) return

        // If super admin and 'all' is selected, maybe we show aggregate? 
        // For now, let's load reports when filter changes
        loadReports()
    }, [selectedStoreId, isSuperAdmin, userStoreId])

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
            const start = `${dateRange.start}T00:00:00`
            const end = `${dateRange.end}T23:59:59`

            // Determine which store to fetch for main stats
            // If Super Admin and 'all', we might want aggregate of all? 
            // Or just disable main stats if 'all' selected and only show comparison.
            // Let's assume if 'all', we fetch comparison. If specific, we fetch stats for that store.

            const targetStoreId = isSuperAdmin ? (selectedStoreId === 'all' ? null : selectedStoreId) : userStoreId

            const promises: Promise<any>[] = []

            if (targetStoreId) {
                // Fetch specific store stats
                promises.push(ReportService.getSalesReport(targetStoreId, start, end))
                promises.push(ReportService.getTopProducts(targetStoreId, start, end, 5))
                promises.push(ReportService.getInventoryValuation(targetStoreId))
            } else if (isSuperAdmin && selectedStoreId === 'all') {
                // Fetch comparison for all stores
                promises.push(ReportService.getSalesByStore(start, end))
                // We can also calculate total aggregate sales from comparison
            }

            const results = await Promise.all(promises)

            if (targetStoreId) {
                setSalesStats(results[0])
                setTopProducts(results[1])
                setValuation(results[2])
                setStoreComparison([]) // clear comparison if focused on one store
            } else if (isSuperAdmin && selectedStoreId === 'all') {
                const comparison = results[0]
                setStoreComparison(comparison)

                // Aggregate for top cards
                const totalSales = comparison.reduce((sum: number, s: any) => sum + s.totalSales, 0)
                const totalOrders = comparison.reduce((sum: number, s: any) => sum + s.totalOrders, 0)
                const avgTicket = totalOrders > 0 ? totalSales / totalOrders : 0

                setSalesStats({ totalSales, totalOrders, avgTicket })
                setTopProducts([])
                setValuation({ totalValuation: 0, productCount: 0 })
            }

        } catch (error) {
            console.error('Error loading reports:', error)
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
                <>
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
                                        <Button
                                            variant="outline"
                                            className="h-12 w-12 rounded-xl border-red-200 bg-white shadow-sm hover:bg-red-50 hover:border-red-300 transition-all p-0 flex items-center justify-center"
                                            disabled={topProducts.length === 0}
                                            title="Exportar a PDF"
                                            onClick={() => exportToPDF(
                                                'Reporte de Ventas por Producto',
                                                ['Producto', 'Cantidad', 'Venta Total ($)'],
                                                topProducts.map(p => [p.name, p.quantity, p.revenue.toFixed(2)]),
                                                `Reporte_Ventas_Productos_${dateRange.start}_al_${dateRange.end}`
                                            )}
                                        >
                                            <FileText className="w-6 h-6 text-red-500" />
                                        </Button>
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
                                    <CardTitle>Resumen por Producto</CardTitle>
                                </CardHeader>
                                <CardContent className="h-[300px] flex items-center justify-center border-dashed border-2 rounded-md bg-muted/20">
                                    {topProducts.length === 0 ? (
                                        <p className="text-muted-foreground">Sin datos suficientes</p>
                                    ) : (
                                        <ResponsiveContainer width="100%" height="100%">
                                            <BarChart data={topProducts} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                                                <XAxis dataKey="name" stroke="#888888" fontSize={12} tickLine={false} axisLine={false} />
                                                <YAxis stroke="#888888" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(value) => `$${value}`} />
                                                <Tooltip
                                                    formatter={(value: any) => [`$${Number(value).toFixed(2)}`, 'Venta Total']}
                                                    labelFormatter={(label) => `Producto: ${label}`}
                                                />
                                                <Bar dataKey="revenue" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                                            </BarChart>
                                        </ResponsiveContainer>
                                    )}
                                </CardContent>
                            </Card>
                        </div>
                    )}
                </>
            )}
        </div>
    )
}
