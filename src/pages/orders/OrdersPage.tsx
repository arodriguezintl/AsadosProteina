import { useEffect, useState } from 'react'
import { OrderService } from '@/services/order.service'
import type { Order, OrderStatus } from '@/types/orders'
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'

import { RefreshCw, Bike, CheckCircle, Clock, ShoppingBag } from 'lucide-react'
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
    DialogFooter
} from "@/components/ui/dialog"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import { EmployeeService, type Employee } from '@/services/employee.service'
// import { toast } from '@/components/ui/use-toast'

export default function OrdersPage() {
    const [orders, setOrders] = useState<Order[]>([])
    const [loading, setLoading] = useState(true)
    const [drivers, setDrivers] = useState<Employee[]>([])
    const [selectedDriver, setSelectedDriver] = useState<string>('')
    const [assigningOrder, setAssigningOrder] = useState<string | null>(null)

    useEffect(() => {
        loadOrders()
        loadDrivers()

        // Optional: Polling for new orders every 30s
        const interval = setInterval(loadOrders, 30000)
        return () => clearInterval(interval)
    }, [])

    const loadDrivers = async () => {
        try {
            const data = await EmployeeService.getDeliveryDrivers()
            setDrivers(data)
        } catch (error) {
            console.error('Error loading drivers:', error)
        }
    }

    const loadOrders = async () => {
        try {
            const data = await OrderService.getOrders()
            setOrders(data)
        } catch (error) {
            console.error('Error loading orders:', error)
        } finally {
            setLoading(false)
        }
    }

    const handleStatusUpdate = async (orderId: string, newStatus: OrderStatus) => {
        try {
            await OrderService.updateStatus(orderId, newStatus)
            // Optimistic update or reload
            loadOrders()
        } catch (error) {
            console.error('Error updating status:', error)
            alert('Error al actualizar estado')
        }
    }

    const handleAssignDriver = async () => {
        if (!assigningOrder || !selectedDriver) return
        try {
            await OrderService.assignDelivery(assigningOrder, selectedDriver)
            await OrderService.updateStatus(assigningOrder, 'in_delivery')
            setAssigningOrder(null)
            setSelectedDriver('')
            loadOrders()
        } catch (error) {
            console.error('Error assigning driver:', error)
            alert('Error al asignar repartidor')
        }
    }

    // Group orders by status
    const columns: { status: OrderStatus; label: string; icon: any; color: string }[] = [
        { status: 'pending', label: 'Pendiente', icon: Clock, color: 'bg-yellow-100 text-yellow-800' },
        { status: 'preparing', label: 'En Preparación', icon: ShoppingBag, color: 'bg-blue-100 text-blue-800' },
        { status: 'ready', label: 'Listo', icon: CheckCircle, color: 'bg-green-100 text-green-800' },
        { status: 'in_delivery', label: 'En Reparto', icon: Bike, color: 'bg-orange-100 text-orange-800' },
        // 'completed' and 'cancelled' can be in a separate list or history view, 
        // but for now let's just show active flow.
    ]

    const getOrdersByStatus = (status: OrderStatus) => {
        return orders.filter(o => o.status === status)
    }

    return (
        <div className="h-[calc(100vh-4rem)] flex flex-col gap-4">
            <div className="flex items-center justify-between">
                <h1 className="text-2xl font-bold">Tablero de Pedidos</h1>
                <Button variant="outline" size="sm" onClick={loadOrders} disabled={loading}>
                    <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
                    Actualizar
                </Button>
            </div>

            <div className="flex-1 overflow-x-auto pb-4">
                <div className="flex gap-4 min-w-full px-4 items-start">
                    {columns.map(col => (
                        <div key={col.status} className="flex-1 min-w-[280px] flex flex-col gap-3">
                            <div className={`flex items-center gap-2 p-3 rounded-md font-bold ${col.color}`}>
                                <col.icon className="h-5 w-5" />
                                {col.label}
                                <Badge variant="secondary" className="ml-auto bg-white/50">
                                    {getOrdersByStatus(col.status).length}
                                </Badge>
                            </div>

                            <div className="flex flex-col gap-3">
                                {getOrdersByStatus(col.status).map(order => (
                                    <Card key={order.id} className="shadow-sm">
                                        <CardHeader className="p-4 pb-2">
                                            <div className="flex justify-between items-start">
                                                <CardTitle className="text-sm font-medium">#{order.order_number}</CardTitle>
                                                <Badge variant="outline">{order.order_type === 'delivery' ? 'Domicilio' : 'Para Llevar'}</Badge>
                                            </div>
                                            <div className="text-xs text-muted-foreground">
                                                {order.created_at ? new Date(order.created_at).toLocaleString('es-MX', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' }) : 'Sin fecha'}
                                            </div>
                                        </CardHeader>
                                        <CardContent className="p-4 py-2 text-sm">
                                            {order.customer_name && (
                                                <div className="font-semibold mb-2">{order.customer_name}</div>
                                            )}
                                            <ul className="list-disc pl-4 space-y-1 text-muted-foreground">
                                                {order.items?.map(item => (
                                                    <li key={item.id}>
                                                        {item.quantity}x {item.product_name}
                                                    </li>
                                                ))}
                                            </ul>
                                            <div className="mt-2 font-bold text-right pt-2 border-t">
                                                ${order.total.toFixed(2)}
                                            </div>
                                        </CardContent>
                                        <CardFooter className="p-4 pt-2 flex justify-end gap-2">
                                            {/* Action Buttons based on Status */}
                                            {col.status === 'pending' && (
                                                <Button size="sm" onClick={() => handleStatusUpdate(order.id, 'preparing')}>
                                                    Cocinar
                                                </Button>
                                            )}
                                            {col.status === 'preparing' && (
                                                <Button size="sm" className="bg-green-600 hover:bg-green-700" onClick={() => handleStatusUpdate(order.id, 'ready')}>
                                                    Terminar
                                                </Button>
                                            )}
                                            {col.status === 'ready' && order.order_type === 'delivery' && (
                                                <Dialog open={assigningOrder === order.id} onOpenChange={(open: boolean) => !open && setAssigningOrder(null)}>
                                                    <DialogTrigger asChild>
                                                        <Button size="sm" className="bg-orange-600 hover:bg-orange-700" onClick={() => setAssigningOrder(order.id)}>
                                                            Asignar Repartidor
                                                        </Button>
                                                    </DialogTrigger>
                                                    <DialogContent>
                                                        <DialogHeader>
                                                            <DialogTitle>Asignar Repartidor</DialogTitle>
                                                        </DialogHeader>
                                                        <div className="py-4">
                                                            <Select onValueChange={setSelectedDriver} value={selectedDriver}>
                                                                <SelectTrigger>
                                                                    <SelectValue placeholder="Seleccionar repartidor" />
                                                                </SelectTrigger>
                                                                <SelectContent>
                                                                    {drivers.map(driver => (
                                                                        <SelectItem key={driver.id} value={driver.id}>
                                                                            {driver.first_name} {driver.last_name}
                                                                        </SelectItem>
                                                                    ))}
                                                                </SelectContent>
                                                            </Select>
                                                        </div>
                                                        <DialogFooter>
                                                            <Button variant="outline" onClick={() => setAssigningOrder(null)}>Cancelar</Button>
                                                            <Button onClick={handleAssignDriver} disabled={!selectedDriver}>Asignar e Iniciar Reparto</Button>
                                                        </DialogFooter>
                                                    </DialogContent>
                                                </Dialog>
                                            )}
                                            {col.status === 'ready' && order.order_type === 'pickup' && (
                                                <Button size="sm" onClick={() => handleStatusUpdate(order.id, 'completed')}>
                                                    Entregado
                                                </Button>
                                            )}
                                            {col.status === 'in_delivery' && (
                                                <Button size="sm" onClick={() => handleStatusUpdate(order.id, 'completed')}>
                                                    Completado
                                                </Button>
                                            )}
                                        </CardFooter>
                                    </Card>
                                ))}
                            </div>
                        </div>
                    ))}

                    {/* Completed Column (Optional, maybe collapsible) */}
                    <div className="flex-1 min-w-[280px] flex flex-col gap-3 opacity-60">
                        <div className="flex items-center gap-2 p-3 rounded-md font-bold bg-gray-100 text-gray-800">
                            Completados
                            <Badge variant="secondary" className="ml-auto bg-white/50">
                                {getOrdersByStatus('completed').length}
                            </Badge>
                        </div>
                        <div className="flex flex-col gap-3">
                            {getOrdersByStatus('completed').map(order => (
                                <Card key={order.id} className="shadow-sm bg-gray-50">
                                    <CardHeader className="p-4 pb-2">
                                        <div className="flex justify-between">
                                            <span className="font-bold">#{order.order_number}</span>
                                            <span className="text-xs text-green-600">Pagado</span>
                                        </div>
                                    </CardHeader>
                                    <CardContent className="p-4 pt-0 text-sm">
                                        <div className="flex justify-between">
                                            <span>Total</span>
                                            <span>${Number(order.total).toFixed(2)}</span>
                                        </div>
                                    </CardContent>
                                </Card>
                            ))}
                        </div>
                    </div>

                </div>
            </div>
        </div>
    )
}
