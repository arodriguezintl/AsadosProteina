import { useState, useEffect } from 'react'
import { format } from 'date-fns'
import { AlertCircle, PackageSearch, PackageCheck, ShoppingCart, RefreshCw, FileText, CheckCircle2, Download } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { PDFDownloadLink } from '@react-pdf/renderer'
import { SupplierService } from '@/services/supplier.service'
import { PurchaseOrderService } from '@/services/purchase-order.service'
import { useAuthStore } from '@/store/auth.store'
import type { LowStockProduct, PurchaseOrder } from '@/types/suppliers'
import { CreatePOModal } from '@/components/purchase-orders/CreatePOModal'
import { PurchaseOrderDocument } from '@/components/purchase-orders/PurchaseOrderDocument'

export function RestockReport() {
    const { storeId } = useAuthStore()

    // Data
    const [lowStock, setLowStock] = useState<LowStockProduct[]>([])
    const [orders, setOrders] = useState<PurchaseOrder[]>([])
    const [loading, setLoading] = useState(false)

    // Modals & UI State
    const [selectedForPO, setSelectedForPO] = useState<LowStockProduct[]>([])
    const [showPOModal, setShowPOModal] = useState(false)

    useEffect(() => {
        if (storeId) {
            loadData()
        }
    }, [storeId])

    const loadData = async () => {
        if (!storeId) return
        setLoading(true)
        try {
            const [products, pos] = await Promise.all([
                SupplierService.getLowStockProducts(storeId),
                PurchaseOrderService.getPurchaseOrders(storeId)
            ])
            setLowStock(products)
            setOrders(pos)
        } catch (error) {
            console.error('Error loading restock data:', error)
        } finally {
            setLoading(false)
        }
    }

    // Handlers
    const handleReceiveOrder = async (orderId: string) => {
        if (!storeId) return
        if (!confirm('¿Marcar orden como RECIBIDA y actualizar inventario? Esta acción no se puede deshacer.')) return

        try {
            await PurchaseOrderService.receiveOrder(orderId, storeId)
            alert('Inventario actualizado exitosamente.')
            loadData() // Recargar datos
        } catch (error: any) {
            console.error(error)
            alert(error.message || 'Error al recibir stock')
        }
    }

    const openPOModalWith = (product?: LowStockProduct) => {
        setSelectedForPO(product ? [product] : lowStock)
        setShowPOModal(true)
    }

    // Render Helpers
    const getStockLevel = (current: number, min: number) => {
        const ratio = current / min
        if (ratio <= 0) return { label: 'Agotado', color: 'bg-red-500', text: 'text-red-700 bg-red-50 border-red-200' }
        if (ratio <= 0.5) return { label: 'Crítico', color: 'bg-orange-500', text: 'text-orange-700 bg-orange-50 border-orange-200' }
        return { label: 'Bajo', color: 'bg-amber-400', text: 'text-amber-700 bg-amber-50 border-amber-200' }
    }

    const getStatusBadge = (status: string) => {
        switch (status) {
            case 'draft': return <Badge variant="secondary" className="bg-gray-100 text-gray-700 border-gray-200">Borrador</Badge>
            case 'sent': return <Badge variant="secondary" className="bg-blue-50 text-blue-700 border-blue-200">Enviada</Badge>
            case 'received': return <Badge variant="secondary" className="bg-green-50 text-green-700 border-green-200">Recibida</Badge>
            case 'cancelled': return <Badge variant="secondary" className="bg-red-50 text-red-700 border-red-200">Cancelada</Badge>
            default: return <Badge>{status}</Badge>
        }
    }

    return (
        <div className="space-y-6">
            <div className="grid gap-4 md:grid-cols-2">
                {/* Panel Alertas de Stock */}
                <Card className="border-orange-200 shadow-sm">
                    <CardHeader className="bg-orange-50/50 pb-4">
                        <div className="flex items-center justify-between">
                            <CardTitle className="text-lg flex items-center gap-2 text-orange-900">
                                <AlertCircle className="h-5 w-5 text-orange-500" />
                                Alertas de Stock
                            </CardTitle>
                            {lowStock.length > 0 && (
                                <Button size="sm" onClick={() => openPOModalWith()} className="bg-orange-500 hover:bg-orange-600">
                                    Pedir Todo <ShoppingCart className="h-4 w-4 ml-2" />
                                </Button>
                            )}
                        </div>
                        <CardDescription>
                            Productos que han alcanzado o están por debajo del nivel mínimo.
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="p-0">
                        {loading ? (
                            <div className="p-8 text-center text-gray-400">Cargando...</div>
                        ) : lowStock.length === 0 ? (
                            <div className="p-12 text-center text-green-600 flex flex-col items-center">
                                <PackageCheck className="h-12 w-12 mb-2 opacity-50" />
                                <p className="font-medium">Inventario Saludable</p>
                                <p className="text-sm text-green-600/70">No hay alertas de stock en este momento.</p>
                            </div>
                        ) : (
                            <Table>
                                <TableHeader>
                                    <TableRow className="bg-gray-50/50">
                                        <TableHead>Producto</TableHead>
                                        <TableHead className="text-right">Stock / Mín</TableHead>
                                        <TableHead className="text-center">Estado</TableHead>
                                        <TableHead className="w-[80px]"></TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {lowStock.map(product => {
                                        const level = getStockLevel(product.current_stock, product.min_stock)
                                        return (
                                            <TableRow key={product.id}>
                                                <TableCell className="font-medium">
                                                    {product.name}
                                                    {product.preferred_supplier && (
                                                        <span className="block text-xs text-gray-500 mt-0.5">
                                                            Prov: {product.preferred_supplier.name}
                                                        </span>
                                                    )}
                                                </TableCell>
                                                <TableCell className="text-right">
                                                    <span className="font-bold">{product.current_stock}</span>
                                                    <span className="text-gray-400 mx-1">/</span>
                                                    {product.min_stock} {product.unit_of_measure}
                                                </TableCell>
                                                <TableCell className="text-center">
                                                    <div className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold border ${level.text}`}>
                                                        {level.label}
                                                    </div>
                                                </TableCell>
                                                <TableCell>
                                                    <Button size="icon" variant="ghost" onClick={() => openPOModalWith(product)} title="Crear Orden de Compra">
                                                        <ShoppingCart className="h-4 w-4 text-orange-600" />
                                                    </Button>
                                                </TableCell>
                                            </TableRow>
                                        )
                                    })}
                                </TableBody>
                            </Table>
                        )}
                    </CardContent>
                </Card>

                {/* Panel Historial de Órdenes */}
                <Card className="shadow-sm">
                    <CardHeader className="pb-4">
                        <div className="flex items-center justify-between">
                            <CardTitle className="text-lg flex items-center gap-2">
                                <PackageSearch className="h-5 w-5 text-blue-500" />
                                Órdenes de Compra
                            </CardTitle>
                            <Button size="sm" variant="outline" onClick={loadData}>
                                <RefreshCw className="h-4 w-4" />
                            </Button>
                        </div>
                        <CardDescription>
                            Historial reciente de pedidos a proveedores.
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="p-0 border-t">
                        {loading ? (
                            <div className="p-8 text-center text-gray-400">Cargando...</div>
                        ) : orders.length === 0 ? (
                            <div className="p-12 text-center text-gray-400 flex flex-col items-center">
                                <FileText className="h-12 w-12 mb-2 opacity-30" />
                                <p>No hay órdenes de compra registradas.</p>
                            </div>
                        ) : (
                            <Table>
                                <TableHeader>
                                    <TableRow className="bg-gray-50/50">
                                        <TableHead>Folio / Fecha</TableHead>
                                        <TableHead>Proveedor</TableHead>
                                        <TableHead>Estado</TableHead>
                                        <TableHead className="w-[120px] text-right">Acciones</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {orders.map(order => (
                                        <TableRow key={order.id}>
                                            <TableCell>
                                                <div className="font-medium font-mono text-sm">{order.folio}</div>
                                                <div className="text-xs text-gray-500">
                                                    {format(new Date(order.created_at), 'dd/MM/yyyy')}
                                                </div>
                                            </TableCell>
                                            <TableCell className="text-sm">
                                                {order.supplier?.name || 'Desconocido'}
                                                <div className="text-xs font-semibold text-gray-600 mt-0.5">
                                                    Total: ${order.total_amount?.toFixed(2)}
                                                </div>
                                            </TableCell>
                                            <TableCell>
                                                {getStatusBadge(order.status)}
                                            </TableCell>
                                            <TableCell className="text-right">
                                                <div className="flex justify-end gap-1">
                                                    <PDFDownloadLink
                                                        document={<PurchaseOrderDocument po={order} />}
                                                        fileName={`${order.folio}.pdf`}
                                                    >
                                                        {({ loading }) => (
                                                            <Button size="icon" variant="ghost" disabled={loading} title="Descargar PDF">
                                                                <Download className="h-4 w-4 text-blue-600" />
                                                            </Button>
                                                        )}
                                                    </PDFDownloadLink>

                                                    {order.status === 'draft' || order.status === 'sent' ? (
                                                        <Button
                                                            size="sm"
                                                            variant="outline"
                                                            className="h-8 border-green-200 text-green-700 hover:bg-green-50 px-2 ml-1"
                                                            onClick={() => handleReceiveOrder(order.id)}
                                                            title="Marcar como Recibida (Suma stock)"
                                                        >
                                                            <CheckCircle2 className="h-4 w-4 mr-1" /> Recibir
                                                        </Button>
                                                    ) : null}
                                                </div>
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        )}
                    </CardContent>
                </Card>
            </div>

            {/* Modal de Generación OC */}
            {showPOModal && (
                <CreatePOModal
                    preselectedProducts={selectedForPO}
                    onClose={() => setShowPOModal(false)}
                    onCreated={() => {
                        setShowPOModal(false)
                        loadData() // Recargar tablas
                    }}
                />
            )}
        </div>
    )
}
