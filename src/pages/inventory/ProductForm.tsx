import { useEffect, useState } from 'react'
import { useNavigate, useParams, useSearchParams } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { ProductService } from '@/services/product.service'
import type { Category, CreateProductDTO } from '@/types/inventory'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Loader2, ArrowLeft } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Label } from '@/components/ui/label'

export default function ProductForm() {
    const { id } = useParams()
    const navigate = useNavigate()
    const [searchParams] = useSearchParams()
    const typeParam = searchParams.get('type') // 'raw_material' or 'finished_product'

    const [loading, setLoading] = useState(false)
    const [categories, setCategories] = useState<Category[]>([])

    const { register, handleSubmit, setValue, watch, formState: { errors } } = useForm<CreateProductDTO>({
        defaultValues: {
            name: '',
            sku: '',
            unit_of_measure: 'pza',
            min_stock: 0,
            unit_cost: 0,
            sale_price: 0,
            is_active: true
        }
    })

    useEffect(() => {
        loadCategories()
        if (id) {
            loadProduct(id)
        }
    }, [id])

    const loadCategories = async () => {
        try {
            const data = await ProductService.getCategories()
            setCategories(data)
        } catch (error) {
            console.error('Error loading categories:', error)
        }
    }

    const loadProduct = async (productId: string) => {
        try {
            setLoading(true)
            const storeId = '00000000-0000-0000-0000-000000000001'
            const products = await ProductService.getProducts(storeId)
            const product = products.find(p => p.id === productId)

            if (product) {
                setValue('name', product.name)
                setValue('sku', product.sku)
                setValue('category_id', product.category_id)
                setValue('unit_of_measure', product.unit_of_measure)
                setValue('min_stock', product.min_stock)
                setValue('current_stock', product.current_stock)
                setValue('unit_cost', product.unit_cost)
                setValue('sale_price', product.sale_price)
                setValue('image_url', product.image_url)
            }
        } catch (error) {
            console.error('Error loading product:', error)
        } finally {
            setLoading(false)
        }
    }

    const filteredCategories = categories.filter(c => {
        if (!typeParam && !id) return true
        if (id) return true // When editing, show all to avoid hiding current category

        if (typeParam === 'raw_material') return c.type !== 'finished_product'
        if (typeParam === 'finished_product') return c.type === 'finished_product'
        return true
    })

    const handleBack = () => {
        if (typeParam === 'finished_product') {
            navigate('/inventory/menu')
        } else {
            navigate('/inventory/stock')
        }
    }

    const onSubmit = async (data: CreateProductDTO) => {
        setLoading(true)
        try {
            const storeId = '00000000-0000-0000-0000-000000000001'
            const productData = { ...data, store_id: storeId }

            if (id) {
                await ProductService.updateProduct(id, productData)
            } else {
                await ProductService.createProduct(productData)
            }

            // Navigate back to correct list
            // If editing, check the category of the edited product to know where to go? 
            // Or just check param if available. If no param (edit mode direct link), default to stock?
            // Actually, products only list in one or the other.

            let target = '/inventory/stock'
            if (typeParam === 'finished_product') {
                target = '/inventory/menu'
            } else if (id) {
                // Determine by category
                const cat = categories.find(c => c.id === data.category_id)
                if (cat && cat.type === 'finished_product') {
                    target = '/inventory/menu'
                }
            } else if (typeParam === 'raw_material') {
                target = '/inventory/stock'
            }

            navigate(target)

        } catch (error) {
            console.error('Error saving product:', error)
            alert('Error al guardar el producto')
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="space-y-6 max-w-2xl mx-auto">
            <div className="flex items-center gap-4">
                <Button variant="ghost" size="icon" onClick={handleBack}>
                    <ArrowLeft className="h-4 w-4" />
                </Button>
                <h1 className="text-2xl font-bold">{id ? 'Editar Producto' : 'Nuevo Producto'}</h1>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>Detalles del Producto</CardTitle>
                </CardHeader>
                <CardContent>
                    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                        <div className="grid gap-2">
                            <Label htmlFor="name">Nombre</Label>
                            <Input id="name" {...register('name', { required: true })} />
                            {errors.name && <span className="text-red-500 text-xs">Este campo es requerido</span>}
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="grid gap-2">
                                <Label htmlFor="sku">SKU</Label>
                                <Input id="sku" {...register('sku', { required: true })} />
                                {errors.sku && <span className="text-red-500 text-xs">Requerido</span>}
                            </div>

                            <div className="grid gap-2">
                                <Label htmlFor="category">Categoría</Label>
                                <Select onValueChange={(val: string) => setValue('category_id', val)} defaultValue={watch('category_id')}>
                                    <SelectTrigger>
                                        <SelectValue placeholder="Seleccionar..." />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {filteredCategories.map(cat => (
                                            <SelectItem key={cat.id} value={cat.id}>{cat.name}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="grid gap-2">
                                <Label htmlFor="unit">Unidad de Medida</Label>
                                <Select onValueChange={(val: string) => setValue('unit_of_measure', val)} defaultValue={watch('unit_of_measure')}>
                                    <SelectTrigger>
                                        <SelectValue placeholder="Seleccionar..." />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="pza">Pieza (pza)</SelectItem>
                                        <SelectItem value="kg">Kilogramo (kg)</SelectItem>
                                        <SelectItem value="L">Litro (L)</SelectItem>
                                        <SelectItem value="g">Gramo (g)</SelectItem>
                                        <SelectItem value="ml">Mililitro (ml)</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>

                            <div className="grid gap-2">
                                <Label htmlFor="min_stock">Stock Mínimo</Label>
                                <Input type="number" id="min_stock" {...register('min_stock', { valueAsNumber: true })} />
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="grid gap-2">
                                <Label htmlFor="unit_cost">Costo Unitario ($)</Label>
                                <Input type="number" step="0.01" id="unit_cost" {...register('unit_cost', { valueAsNumber: true })} />
                            </div>

                            <div className="grid gap-2">
                                <Label htmlFor="sale_price">Precio Venta ($)</Label>
                                <Input type="number" step="0.01" id="sale_price" {...register('sale_price', { valueAsNumber: true })} />
                            </div>
                        </div>

                        <div className="grid gap-2">
                            <Label htmlFor="image_url">URL Imagen</Label>
                            <Input id="image_url" {...register('image_url')} placeholder="https://..." />
                        </div>

                        <Button type="submit" className="w-full" disabled={loading}>
                            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            {id ? 'Actualizar Producto' : 'Crear Producto'}
                        </Button>
                    </form>
                </CardContent>
            </Card>
        </div>
    )
}
