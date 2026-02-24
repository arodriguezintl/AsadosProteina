import { useEffect, useState } from 'react'
import { useNavigate, useParams, useSearchParams } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { ProductService } from '@/services/product.service'
import type { Category, CreateProductDTO, Product } from '@/types/inventory'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Loader2, ArrowLeft } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { useAuthStore } from '@/store/auth.store'
import { Badge } from '@/components/ui/badge'

interface ProductFormData extends Record<string, unknown> {
    name: string
    sku: string
    description: string
    category_id: string
    unit_of_measure: string
    min_stock: number
    unit_cost: number
    sale_price: number
    current_stock: number
    is_taxable: boolean
}

export default function ProductForm() {
    const { id } = useParams()
    const navigate = useNavigate()
    const [searchParams] = useSearchParams()
    const typeParam = searchParams.get('type') // 'raw_material' or 'finished_product'
    const { storeId } = useAuthStore()

    const [loading, setLoading] = useState(false)
    const [categories, setCategories] = useState<Category[]>([])

    // If editing, we load the product
    const [editingProduct, setEditingProduct] = useState<Product | null>(null)

    const { register, handleSubmit, setValue, watch, formState: { errors } } = useForm<ProductFormData>({
        defaultValues: {
            min_stock: 0,
            unit_cost: 0,
            sale_price: 0,
            current_stock: 0,
            unit_of_measure: 'pza',
            is_taxable: false
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
            if (!storeId) return

            const products = await ProductService.getProducts(storeId)
            const product = products.find(p => p.id === productId)

            if (product) {
                setEditingProduct(product)
                // Fill form
                setValue('name', product.name)
                setValue('sku', product.sku)
                setValue('category_id', product.category_id || '')
                setValue('unit_of_measure', product.unit_of_measure)
                setValue('description', product.description || '')
                setValue('min_stock', product.min_stock)
                setValue('current_stock', product.current_stock)
                setValue('unit_cost', product.unit_cost)
                setValue('sale_price', product.sale_price || 0)
                setValue('is_taxable', product.is_taxable || false)
            }
        } catch (error) {
            console.error('Error loading product:', error)
        } finally {
            setLoading(false)
        }
    }

    const onSubmit = async (data: ProductFormData) => {
        if (!storeId) {
            alert('No store selected')
            return
        }

        setLoading(true)
        try {
            if (id) {
                // Update existing Store Product
                await ProductService.updateProduct(id, {
                    name: data.name,
                    sku: data.sku,
                    description: data.description,
                    category_id: data.category_id,
                    unit_of_measure: data.unit_of_measure,
                    min_stock: data.min_stock,
                    unit_cost: data.unit_cost,
                    sale_price: data.sale_price,
                    current_stock: data.current_stock,
                    is_taxable: data.is_taxable,
                })
            } else {
                // Create New
                const createDTO: CreateProductDTO = {
                    store_id: storeId,
                    name: data.name,
                    sku: data.sku,
                    description: data.description,
                    category_id: data.category_id,
                    unit_of_measure: data.unit_of_measure,
                    min_stock: data.min_stock,
                    unit_cost: data.unit_cost,
                    sale_price: data.sale_price,
                    current_stock: data.current_stock,
                    is_taxable: data.is_taxable,
                    is_active: true
                }

                await ProductService.createProduct(createDTO)
            }

            // Navigate back
            navigate(-1)

        } catch (error: any) {
            console.error('Error saving product:', error)
            alert('Error al guardar: ' + (error.message || 'Error desconocido'))
        } finally {
            setLoading(false)
        }
    }

    const filteredCategories = categories.filter(c => {
        if (!typeParam && !id) return true
        if (id) return true

        if (typeParam === 'raw_material') return c.type !== 'finished_product'
        if (typeParam === 'finished_product') return c.type === 'finished_product'
        return true
    })

    if (loading && !editingProduct && id) {
        return <div className="flex justify-center p-8"><Loader2 className="h-8 w-8 animate-spin" /></div>
    }

    return (
        <div className="space-y-6 max-w-2xl mx-auto">
            <div className="flex items-center gap-4">
                <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
                    <ArrowLeft className="h-4 w-4" />
                </Button>
                <h1 className="text-2xl font-bold">{id ? 'Editar Producto' : 'Nuevo Producto'}</h1>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>
                        {id ? 'Editar Inventario' : 'Crear Producto'}
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">

                        {/* SECTION: GLOBAL DETAILS */}
                        <div className="space-y-4 p-4 bg-muted/20 rounded-lg border">
                            <h3 className="font-semibold text-sm flex items-center gap-2">
                                <Badge variant="outline">Información</Badge>
                                Datos del Producto
                            </h3>

                            <div className="grid gap-2">
                                <Label htmlFor="name">Nombre</Label>
                                <Input id="name" {...register('name', { required: true })} />
                                {errors.name && <span className="text-red-500 text-xs">Requerido</span>}
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="grid gap-2">
                                    <Label htmlFor="sku">SKU</Label>
                                    <Input id="sku" {...register('sku', { required: true })} />
                                    {errors.sku && <span className="text-red-500 text-xs">Requerido</span>}
                                </div>

                                <div className="grid gap-2">
                                    <Label htmlFor="category">Categoría</Label>
                                    <Select
                                        onValueChange={(val: string) => setValue('category_id', val)}
                                        value={watch('category_id')}
                                    >
                                        <SelectTrigger>
                                            <SelectValue placeholder="Seleccionar..." />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {filteredCategories.map(cat => (
                                                <SelectItem key={cat.id} value={cat.id}>{cat.name}</SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                    {!watch('category_id') && <span className="text-red-500 text-xs">Requerido</span>}
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="grid gap-2">
                                    <Label htmlFor="unit">Unidad</Label>
                                    <Select
                                        onValueChange={(val: string) => setValue('unit_of_measure', val)}
                                        value={watch('unit_of_measure')}
                                    >
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
                            </div>
                        </div>

                        {/* SECTION: STORE DETAILS */}
                        <div className="space-y-4 p-4 border rounded-lg bg-background">
                            <h3 className="font-semibold text-sm flex items-center gap-2">
                                <Badge>Inventario</Badge>
                                Gestión de Inventario
                            </h3>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="grid gap-2">
                                    <Label htmlFor="current_stock">Stock Actual</Label>
                                    <Input type="number" step="0.01" id="current_stock" {...register('current_stock', { valueAsNumber: true })} />
                                </div>
                                <div className="grid gap-2">
                                    <Label htmlFor="min_stock">Stock Mínimo (Alerta)</Label>
                                    <Input type="number" step="0.01" id="min_stock" {...register('min_stock', { valueAsNumber: true })} />
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="grid gap-2">
                                    <Label htmlFor="unit_cost">Costo Unitario ($)</Label>
                                    <Input type="number" step="0.01" id="unit_cost" {...register('unit_cost', { valueAsNumber: true })} />
                                    <p className="text-[10px] text-muted-foreground">Último costo de compra</p>
                                </div>

                                <div className="grid gap-2">
                                    <Label htmlFor="sale_price">Precio Venta ($)</Label>
                                    <Input type="number" step="0.01" id="sale_price" {...register('sale_price', { valueAsNumber: true })} />
                                    <p className="text-[10px] text-muted-foreground">Dejar en 0 si es solo insumo</p>
                                </div>
                            </div>

                            <div className="flex items-center space-x-2 pt-4">
                                <input
                                    type="checkbox"
                                    id="is_taxable"
                                    className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
                                    {...register('is_taxable')}
                                />
                                <Label htmlFor="is_taxable" className="font-normal cursor-pointer">
                                    Desglosar IVA en ticket (Ej: bebidas, no alimentos)
                                </Label>
                            </div>
                        </div>

                        <Button type="submit" className="w-full" disabled={loading}>
                            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            {id ? 'Guardar Cambios' : 'Registrar Producto'}
                        </Button>
                    </form>
                </CardContent>
            </Card>
        </div>
    )
}
