import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { CustomerService } from '@/services/customer.service'
import { OrderService } from '@/services/order.service'
import { useAuthStore } from '@/store/auth.store'
import type { CreateCustomerDTO } from '@/types/customers'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Loader2, ArrowLeft, Save, ShoppingBag } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Label } from '@/components/ui/label'

export default function CustomerForm() {
    const { id } = useParams()
    const navigate = useNavigate()
    const [loading, setLoading] = useState(false)
    const [orders, setOrders] = useState<any[]>([])
    const { storeId } = useAuthStore()

    const { register, handleSubmit, setValue, formState: { errors } } = useForm<CreateCustomerDTO>({
        defaultValues: {
            full_name: ''
        }
    })

    useEffect(() => {
        if (id && id !== 'new') {
            loadCustomer(id)
            loadHistory(id)
        }
    }, [id])

    const loadHistory = async (customerId: string) => {
        try {
            const data = await OrderService.getOrdersByCustomer(customerId)
            setOrders(data)
        } catch (error) {
            console.error('Error loading history:', error)
        }
    }

    const loadCustomer = async (customerId: string) => {
        try {
            setLoading(true)
            const customer = await CustomerService.getCustomerById(customerId)
            if (customer) {
                setValue('full_name', customer.full_name)
                setValue('email', customer.email)
                setValue('phone', customer.phone)
            }
        } catch (error) {
            console.error('Error loading customer:', error)
        } finally {
            setLoading(false)
        }
    }

    const onSubmit = async (data: CreateCustomerDTO) => {
        setLoading(true)
        try {
            if (id && id !== 'new') {
                await CustomerService.updateCustomer(id, data)
            } else {
                if (!storeId) {
                    alert('Error: No se ha identificado la tienda actual.')
                    setLoading(false)
                    return
                }
                await CustomerService.createCustomer({ ...data, store_id: storeId })
            }
            navigate('/crm/customers')
        } catch (error) {
            console.error('Error saving customer:', error)
            alert('Error al guardar cliente')
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="space-y-6 max-w-2xl mx-auto">
            <div className="flex items-center gap-4">
                <Button variant="ghost" size="icon" onClick={() => navigate('/crm/customers')}>
                    <ArrowLeft className="h-4 w-4" />
                </Button>
                <h1 className="text-2xl font-bold">{id && id !== 'new' ? 'Editar Cliente' : 'Nuevo Cliente'}</h1>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>Información del Cliente</CardTitle>
                </CardHeader>
                <CardContent>
                    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                        <div className="grid gap-2">
                            <Label htmlFor="full_name">Nombre Completo</Label>
                            <Input id="full_name" {...register('full_name', { required: true })} />
                            {errors.full_name && <span className="text-red-500 text-xs">Requerido</span>}
                        </div>

                        <div className="grid gap-2">
                            <Label htmlFor="email">Email</Label>
                            <Input type="email" id="email" {...register('email')} placeholder="cliente@ejemplo.com" />
                        </div>

                        <div className="grid gap-2">
                            <Label htmlFor="phone">Teléfono / Celular</Label>
                            <Input type="tel" id="phone" {...register('phone')} placeholder="+52 ..." />
                        </div>

                        <Button type="submit" className="w-full" disabled={loading}>
                            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            <Save className="mr-2 h-4 w-4" />
                            {id && id !== 'new' ? 'Actualizar' : 'Registrar'} Cliente
                        </Button>
                    </form>
                </CardContent>
            </Card>

            {id && id !== 'new' && (
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <ShoppingBag className="h-5 w-5" />
                            Historial de Compras
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <HistoryTable orders={orders} />
                    </CardContent>
                </Card>
            )}
        </div>
    )
}

function HistoryTable({ orders }: { orders: any[] }) {
    if (orders.length === 0) {
        return <div className="text-center py-8 text-muted-foreground">No hay historial de compras</div>
    }

    return (
        <Table>
            <TableHeader>
                <TableRow>
                    <TableHead>Fecha</TableHead>
                    <TableHead>Pedido</TableHead>
                    <TableHead>Estado</TableHead>
                    <TableHead>Total</TableHead>
                </TableRow>
            </TableHeader>
            <TableBody>
                {orders.map((order) => (
                    <TableRow key={order.id}>
                        <TableCell>{new Date(order.created_at).toLocaleDateString()}</TableCell>
                        <TableCell className="font-medium">{order.order_number}</TableCell>
                        <TableCell className="capitalize">{order.status.replace('_', ' ')}</TableCell>
                        <TableCell className="font-bold">${order.total}</TableCell>
                    </TableRow>
                ))}
            </TableBody>
        </Table>
    )
}
