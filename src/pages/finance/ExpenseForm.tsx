import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { FinanceService } from '@/services/finance.service'
import type { CreateTransactionDTO, FinanceCategory } from '@/types/finance'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Loader2, ArrowLeft } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { useAuthStore } from '@/store/auth.store'


export default function ExpenseForm() {
    const navigate = useNavigate()
    const [loading, setLoading] = useState(false)
    const [categories, setCategories] = useState<FinanceCategory[]>([])
    const { storeId } = useAuthStore()


    const { register, handleSubmit, setValue, formState: { errors } } = useForm<CreateTransactionDTO>({
        defaultValues: {
            type: 'expense',
            transaction_date: new Date().toISOString().split('T')[0],
            payment_method: 'cash'
        }
    })

    useEffect(() => {
        loadCategories()
    }, [])

    const loadCategories = async () => {
        try {
            const data = await FinanceService.getCategories()
            // Filter only expense categories
            setCategories(data.filter(c => c.type === 'expense'))
        } catch (error) {
            console.error('Error loading categories:', error)
        }
    }

    const onSubmit = async (data: CreateTransactionDTO) => {
        setLoading(true)
        try {
            if (!storeId) {
                alert('No se pudo identificar la sucursal. Por favor, reinicia sesión.')
                return
            }
            await FinanceService.createTransaction({
                ...data,
                store_id: storeId,
                type: 'expense'
            })

            navigate('/finance/expenses')
        } catch (error) {
            console.error('Error saving expenses:', error)
            alert('Error al registrar el gasto')
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="space-y-6 max-w-2xl mx-auto">
            <div className="flex items-center gap-4">
                <Button variant="ghost" size="icon" onClick={() => navigate('/finance/expenses')}>
                    <ArrowLeft className="h-4 w-4" />
                </Button>
                <h1 className="text-2xl font-bold">Registrar Nuevo Gasto</h1>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>Detalles del Gasto</CardTitle>
                </CardHeader>
                <CardContent>
                    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                        <div className="grid gap-2">
                            <Label htmlFor="date">Fecha</Label>
                            <Input type="date" id="date" {...register('transaction_date', { required: true })} />
                        </div>

                        <div className="grid gap-2">
                            <Label htmlFor="category">Categoría</Label>
                            <Select onValueChange={(val) => setValue('category_id', val)} required>
                                <SelectTrigger>
                                    <SelectValue placeholder="Seleccionar categoría..." />
                                </SelectTrigger>
                                <SelectContent>
                                    {categories.map(cat => (
                                        <SelectItem key={cat.id} value={cat.id}>{cat.name}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="grid gap-2">
                            <Label htmlFor="amount">Monto ($)</Label>
                            <Input
                                type="number"
                                step="0.01"
                                id="amount"
                                {...register('amount', { required: true, valueAsNumber: true, min: 0.01 })}
                            />
                            {errors.amount && <span className="text-red-500 text-xs">Monto requerido</span>}
                        </div>

                        <div className="grid gap-2">
                            <Label htmlFor="description">Descripción / Concepto</Label>
                            <Input id="description" {...register('description', { required: true })} />
                            {errors.description && <span className="text-red-500 text-xs">Descripción requerida</span>}
                        </div>

                        <div className="grid gap-2">
                            <Label htmlFor="payment_method">Método de Pago</Label>
                            <Select onValueChange={(val: any) => setValue('payment_method', val)} defaultValue="cash">
                                <SelectTrigger>
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="cash">Efectivo</SelectItem>
                                    <SelectItem value="transfer">Transferencia</SelectItem>
                                    <SelectItem value="card">Tarjeta</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        <Button type="submit" className="w-full" disabled={loading}>
                            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            Registrar Gasto
                        </Button>
                    </form>
                </CardContent>
            </Card>
        </div>
    )
}
