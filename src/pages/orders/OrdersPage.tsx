import { useEffect, useState } from 'react'
import { OrderService } from '@/services/order.service'
import { useAuthStore } from '@/store/auth.store'
import type { Order, OrderStatus } from '@/types/orders'
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { DndContext, useDraggable, useDroppable, closestCorners, useSensor, useSensors, PointerSensor, DragOverlay } from '@dnd-kit/core'
import type { DragEndEvent, DragStartEvent } from '@dnd-kit/core'
import { CSS } from '@dnd-kit/utilities'

import { RefreshCw, CheckCircle, Clock, ShoppingBag } from 'lucide-react'

function DroppableColumn({ id, title, icon: Icon, color, children, count }: any) {
    const { isOver, setNodeRef } = useDroppable({ id });
    return (
        <div ref={setNodeRef} className={`flex-1 min-w-[320px] max-w-[400px] max-h-full flex flex-col gap-3 transition-colors rounded-xl p-3 bg-gray-50/50 border border-transparent ${isOver ? 'ring-2 ring-primary bg-primary/5 border-primary/20' : ''}`}>
            <div className={`flex items-center gap-2 p-3 rounded-lg font-bold shadow-sm ${color}`}>
                <Icon className="h-5 w-5" />
                {title}
                <Badge variant="secondary" className="ml-auto bg-white/60 text-current">{count}</Badge>
            </div>
            <div className="flex flex-col gap-3 flex-1 min-h-[150px] overflow-y-auto p-1 rounded-md">
                {children}
            </div>
        </div>
    );
}

function DraggableOrderCard({ order, children }: any) {
    const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
        id: order.id,
        data: { order }
    });

    const style = {
        transform: CSS.Transform.toString(transform),
        opacity: isDragging ? 0.3 : 1,
        touchAction: 'none'
    };

    return (
        <div ref={setNodeRef} style={style} {...listeners} {...attributes} className="cursor-grab active:cursor-grabbing outline-none">
            {children}
        </div>
    );
}

function OrderCardDisplay({ order, actionButtons = null, isOverlay = false }: any) {
    return (
        <Card className={`h-full flex flex-col ${isOverlay ? 'shadow-2xl ring-2 ring-primary rotate-[2deg] cursor-grabbing' : 'shadow-sm hover:shadow-md transition-shadow'}`}>
            <CardHeader className="p-4 pb-2">
                <div className="flex justify-between items-start">
                    <CardTitle className="text-sm font-medium">#{order.order_number}</CardTitle>
                    <Badge variant="outline">{order.order_type === 'delivery' ? 'Domicilio' : 'Para Llevar'}</Badge>
                </div>
                <div className="text-xs text-muted-foreground">
                    {order.created_at ? new Date(order.created_at).toLocaleString('es-MX', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' }) : 'Sin fecha'}
                </div>
            </CardHeader>
            <CardContent className="p-4 py-2 text-sm flex-1">
                {order.customer_name && (
                    <div className="font-semibold mb-2">{order.customer_name}</div>
                )}
                <ul className="list-disc pl-4 space-y-1 text-muted-foreground">
                    {order.items?.map((item: any) => (
                        <li key={item.id}>
                            {item.quantity}x {item.product_name}
                        </li>
                    ))}
                </ul>
                <div className="mt-3 font-bold flex justify-between pt-3 border-t">
                    <span>Total</span>
                    <span>${Number(order.total).toFixed(2)}</span>
                </div>
            </CardContent>
            {actionButtons && (
                <CardFooter className="p-4 pt-2 flex justify-end gap-2 mt-auto">
                    {actionButtons}
                </CardFooter>
            )}
        </Card>
    )
}

export default function OrdersPage() {
    const [orders, setOrders] = useState<Order[]>([])
    const [loading, setLoading] = useState(true)
    const [activeId, setActiveId] = useState<string | null>(null)

    const { storeId } = useAuthStore()

    const sensors = useSensors(
        useSensor(PointerSensor, {
            activationConstraint: {
                distance: 5,
            },
        })
    );

    useEffect(() => {
        if (storeId) {
            loadOrders()
        }

        const interval = setInterval(() => {
            if (storeId) loadOrders()
        }, 30000)
        return () => clearInterval(interval)
    }, [storeId])

    const loadOrders = async () => {
        if (!storeId) return
        try {
            const data = await OrderService.getKanbanOrders(storeId)
            setOrders(data)
        } catch (error) {
            console.error('Error loading orders:', error)
        } finally {
            setLoading(false)
        }
    }

    const handleStatusUpdate = async (orderId: string, newStatus: OrderStatus) => {
        setOrders(prev => prev.map(o => o.id === orderId ? { ...o, status: newStatus } : o));
        try {
            await OrderService.updateStatus(orderId, newStatus)
            loadOrders()
        } catch (error) {
            console.error('Error updating status:', error)
            alert('Error al actualizar estado')
            loadOrders()
        }
    }

    const handleDragStart = (event: DragStartEvent) => {
        setActiveId(event.active.id as string);
    };

    const handleDragEnd = (event: DragEndEvent) => {
        setActiveId(null);
        const { active, over } = event;
        if (!over) return;

        const orderId = active.id as string;
        const newStatus = over.id as OrderStatus;

        const order = orders.find(o => o.id === orderId);
        if (!order || order.status === newStatus) return;

        handleStatusUpdate(orderId, newStatus);
    };

    const columns: { status: OrderStatus; label: string; icon: any; color: string }[] = [
        { status: 'pending', label: 'Pendiente', icon: Clock, color: 'bg-yellow-100/80 text-yellow-800' },
        { status: 'preparing', label: 'En Preparación', icon: ShoppingBag, color: 'bg-blue-100/80 text-blue-800' },
        { status: 'ready', label: 'Listo', icon: CheckCircle, color: 'bg-green-100/80 text-green-800' },
    ]

    const getOrdersByStatus = (status: OrderStatus) => {
        return orders.filter(o => o.status === status)
    }

    const activeOrder = activeId ? orders.find(o => o.id === activeId) : null;

    const renderActionButtons = (order: Order, status: OrderStatus) => (
        <>
            {status === 'pending' && (
                <Button size="sm" onPointerDown={e => e.stopPropagation()} onClick={() => handleStatusUpdate(order.id, 'preparing')}>
                    Cocinar
                </Button>
            )}
            {status === 'preparing' && (
                <Button size="sm" className="bg-green-600 hover:bg-green-700" onPointerDown={e => e.stopPropagation()} onClick={() => handleStatusUpdate(order.id, 'ready')}>
                    Terminar
                </Button>
            )}
            {status === 'ready' && (
                <Button size="sm" className="bg-blue-600 hover:bg-blue-700" onPointerDown={e => e.stopPropagation()} onClick={() => handleStatusUpdate(order.id, 'completed')}>
                    Completado
                </Button>
            )}
        </>
    );

    return (
        <div className="h-[calc(100vh-4rem)] flex flex-col gap-4">
            <div className="flex items-center justify-between">
                <h1 className="text-2xl font-bold">Tablero de Pedidos</h1>
                <Button variant="outline" size="sm" onClick={loadOrders} disabled={loading}>
                    <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
                    Actualizar
                </Button>
            </div>

            <div className="flex-1 overflow-x-auto overflow-y-hidden pb-4">
                <DndContext
                    sensors={sensors}
                    collisionDetection={closestCorners}
                    onDragStart={handleDragStart}
                    onDragEnd={handleDragEnd}
                >
                    <div className="flex gap-4 min-w-max px-4 items-start h-full pb-6">
                        {columns.map(col => (
                            <DroppableColumn key={col.status} id={col.status} title={col.label} icon={col.icon} color={col.color} count={getOrdersByStatus(col.status).length}>
                                {getOrdersByStatus(col.status).map(order => (
                                    <DraggableOrderCard key={order.id} order={order}>
                                        <OrderCardDisplay order={order} actionButtons={renderActionButtons(order, col.status)} />
                                    </DraggableOrderCard>
                                ))}
                            </DroppableColumn>
                        ))}

                        {/* Completed Column */}
                        <DroppableColumn id="completed" title="Completados" icon={CheckCircle} color="bg-gray-200/50 text-gray-800" count={getOrdersByStatus('completed').length}>
                            {getOrdersByStatus('completed').map(order => (
                                <div key={order.id} className="opacity-80 scale-[0.98]">
                                    <OrderCardDisplay order={order} />
                                </div>
                            ))}
                        </DroppableColumn>
                    </div>

                    <DragOverlay>
                        {activeOrder ? (
                            <div className="w-[300px]">
                                <OrderCardDisplay order={activeOrder} isOverlay={true} />
                            </div>
                        ) : null}
                    </DragOverlay>
                </DndContext>
            </div>
        </div>
    )
}
