import { useEffect, useState } from 'react'
import { ReportService } from '@/services/report.service'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Loader2, DollarSign, ShoppingBag, TrendingUp, Calendar } from 'lucide-react'
import { format, startOfMonth, endOfMonth } from 'date-fns'

import { useAuthStore } from '@/store/auth.store'

export default function ReportsPage() {
    const [loading, setLoading] = useState(true)
    const [dateRange, setDateRange] = useState({
        start: format(startOfMonth(new Date()), 'yyyy-MM-dd'),
        end: format(endOfMonth(new Date()), 'yyyy-MM-dd')
    })
    const { storeId } = useAuthStore()

    // Stats
    const [salesStats, setSalesStats] = useState({ totalSales: 0, totalOrders: 0, avgTicket: 0 })
    const [topProducts, setTopProducts] = useState<any[]>([])
    const [valuation, setValuation] = useState({ totalValuation: 0, productCount: 0 })

    useEffect(() => {
        if (storeId) {
            loadReports()
        }
    }, [dateRange, storeId])

    const loadReports = async () => {
        try {
            if (!storeId) return
            setLoading(true)
            const start = new Date(dateRange.start).toISOString()
            // Add time to end date to cover the full day
            const end = new Date(dateRange.end + 'T23:59:59').toISOString()

            const [sales, top, invVal] = await Promise.all([
                ReportService.getSalesReport(storeId, start, end),
                ReportService.getTopProducts(storeId, start, end, 5),
                ReportService.getInventoryValuation(storeId)
            ])

            setSalesStats(sales)
            setTopProducts(top)
            setValuation(invVal)
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

                <div className="flex items-center gap-2 bg-card p-2 rounded-md border shadow-sm">
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                    <Input
                        type="date"
                        value={dateRange.start}
                        onChange={(e) => setDateRange(prev => ({ ...prev, start: e.target.value }))}
                        className="w-auto h-8"
                    />
                    <span className="text-muted-foreground">-</span>
                    <Input
                        type="date"
                        value={dateRange.end}
                        onChange={(e) => setDateRange(prev => ({ ...prev, end: e.target.value }))}
                        className="w-auto h-8"
                    />
                </div>
            </div>

            {loading ? (
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

                    <div className="grid gap-4 md:grid-cols-2">
                        {/* Top Products */}
                        <Card className="col-span-1">
                            <CardHeader>
                                <CardTitle>Productos Más Vendidos</CardTitle>
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
                                <CardTitle>Resumen por Categoría</CardTitle>
                            </CardHeader>
                            <CardContent className="h-[300px] flex items-center justify-center border-dashed border-2 rounded-md bg-muted/20">
                                <p className="text-muted-foreground">Gráfico de pastel próximamente...</p>
                            </CardContent>
                        </Card>
                    </div>
                </>
            )}
        </div>
    )
}
