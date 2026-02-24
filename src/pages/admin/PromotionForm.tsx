import { useState, useEffect } from "react"
import { useNavigate, useParams } from "react-router-dom"
import { useForm } from "react-hook-form"
import { useAuthStore } from "@/store/auth.store"
import { PromotionService } from "@/services/promotion.service"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { ArrowLeft, Loader2, Save } from "lucide-react"
import type { CreatePromotionDTO } from "@/types/promotions"
import { toast } from "react-toastify"

export default function PromotionForm() {
    const { id } = useParams()
    const navigate = useNavigate()
    const { storeId } = useAuthStore()
    const [loading, setLoading] = useState(false)
    const [initialLoading, setInitialLoading] = useState(!!id)

    const { register, handleSubmit, setValue, formState: { errors } } = useForm<CreatePromotionDTO>({
        defaultValues: {
            store_id: storeId || '',
            name: '',
            description: '',
            discount_percentage: 0,
            start_date: new Date().toISOString().split('T')[0],
            end_date: new Date(new Date().setMonth(new Date().getMonth() + 1)).toISOString().split('T')[0],
            is_active: true
        }
    })

    useEffect(() => {
        if (id) {
            loadPromotion()
        }
    }, [id])

    const loadPromotion = async () => {
        try {
            const data = await PromotionService.getPromotionById(id!)
            setValue('name', data.name)
            setValue('description', data.description || '')
            setValue('discount_percentage', data.discount_percentage)
            setValue('start_date', new Date(data.start_date).toISOString().split('T')[0])
            setValue('end_date', new Date(data.end_date).toISOString().split('T')[0])
            setValue('is_active', data.is_active)
        } catch (error) {
            console.error('Error loading promotion:', error)
            toast.error('Error al cargar la promoción')
        } finally {
            setInitialLoading(false)
        }
    }

    const onSubmit = async (data: CreatePromotionDTO) => {
        if (!storeId) return

        try {
            setLoading(true)
            const promotionData = {
                ...data,
                store_id: storeId
            }

            if (id) {
                await PromotionService.updatePromotion(id, promotionData)
                toast.success('Promoción actualizada exitosamente')
            } else {
                await PromotionService.createPromotion(promotionData)
                toast.success('Promoción creada exitosamente')
            }
            navigate('/admin/promotions')
        } catch (error) {
            console.error('Error saving promotion:', error)
            toast.error('Error al guardar la promoción')
        } finally {
            setLoading(false)
        }
    }

    if (initialLoading) {
        return <div className="flex h-64 items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>
    }

    return (
        <div className="max-w-2xl mx-auto space-y-6">
            <div className="flex items-center space-x-4">
                <Button variant="ghost" size="icon" onClick={() => navigate('/admin/promotions')}>
                    <ArrowLeft className="h-4 w-4" />
                </Button>
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">
                        {id ? 'Editar Promoción' : 'Nueva Promoción'}
                    </h1>
                    <p className="text-muted-foreground">
                        {id ? 'Modifica los detalles de la promoción' : 'Crea una nueva campaña de descuento'}
                    </p>
                </div>
            </div>

            <form onSubmit={handleSubmit(onSubmit)}>
                <Card>
                    <CardHeader>
                        <CardTitle>Detalles de la Promoción</CardTitle>
                        <CardDescription>Configura las reglas de la promoción</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="name">Nombre de la Promoción</Label>
                            <Input id="name" {...register('name', { required: true })} placeholder="Ej: Hot Sale 2026" />
                            {errors.name && <span className="text-xs text-red-500">Este campo es requerido</span>}
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="description">Descripción</Label>
                            <Textarea id="description" {...register('description')} placeholder="Detalles adicionales..." />
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="discount_percentage">
                                    Descuento (%)
                                </Label>
                                <Input
                                    id="discount_percentage"
                                    type="number"
                                    step="0.01"
                                    {...register('discount_percentage', { required: true, valueAsNumber: true })}
                                />
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="start_date">Fecha de Inicio</Label>
                                <Input id="start_date" type="date" {...register('start_date', { required: true })} />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="end_date">Fecha de Fin</Label>
                                <Input id="end_date" type="date" {...register('end_date', { required: true })} />
                            </div>
                        </div>

                        <div className="flex items-center space-x-2 pt-4">
                            <input
                                type="checkbox"
                                id="is_active"
                                className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
                                {...register('is_active')}
                            />
                            <Label htmlFor="is_active" className="font-normal cursor-pointer">
                                Promoción Activa
                            </Label>
                        </div>
                    </CardContent>
                </Card>

                <div className="mt-6 flex justify-end gap-4">
                    <Button variant="outline" type="button" onClick={() => navigate('/admin/promotions')}>
                        Cancelar
                    </Button>
                    <Button type="submit" disabled={loading}>
                        {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                        {id ? 'Actualizar' : 'Crear'} Promoción
                    </Button>
                </div>
            </form>
        </div>
    )
}
