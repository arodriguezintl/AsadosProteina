import { useEffect, useState } from 'react'
import { useNavigate, useParams, useSearchParams } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { ProductService } from '@/services/product.service'
import type { Category, CreateProductDTO, GlobalProduct, Product } from '@/types/inventory'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Loader2, ArrowLeft, Search, Plus } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { useAuthStore } from '@/store/auth.store'
import { Badge } from '@/components/ui/badge'

interface ProductFormData extends Record<string, unknown> {
    // Store fields
    min_stock: number
    unit_cost: number
    sale_price: number
    current_stock: number

    // Global fields (only for new global products)
    name: string
    sku: string
    description: string
    category_id: string
    unit_of_measure: string
    image_url: string
}

export default function ProductForm() {
    const { id } = useParams()
    const navigate = useNavigate()
    const [searchParams] = useSearchParams()
    const typeParam = searchParams.get('type') // 'raw_material' or 'finished_product'
    const { storeId } = useAuthStore()

    const [loading, setLoading] = useState(false)
    const [searching, setSearching] = useState(false)
    const [categories, setCategories] = useState<Category[]>([])

    // Workflow state
    const [step, setStep] = useState<'search' | 'details'>(id ? 'details' : 'search')
    const [searchResults, setSearchResults] = useState<GlobalProduct[]>([])
    const [searchQuery, setSearchQuery] = useState('')
    const [selectedGlobal, setSelectedGlobal] = useState<GlobalProduct | null>(null)
    const [isNewGlobal, setIsNewGlobal] = useState(false)

    // If editing, we load the product
    const [editingProduct, setEditingProduct] = useState<Product | null>(null)

    const { register, handleSubmit, setValue, watch, formState: { errors } } = useForm<ProductFormData>({
        defaultValues: {
            min_stock: 0,
            unit_cost: 0,
            sale_price: 0,
            current_stock: 0,
            unit_of_measure: 'pza'
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
                setSelectedGlobal(product.global_product || null)
                setStep('details')
                setIsNewGlobal(false)

                // Fill form
                setValue('min_stock', product.min_stock)
                setValue('current_stock', product.current_stock)
                setValue('unit_cost', product.unit_cost)
                setValue('sale_price', product.sale_price || 0)

                // Set global fields for display/logic (even if read-only)
                if (product.global_product) {
                    setValue('name', product.global_product.name)
                    setValue('sku', product.global_product.sku)
                    setValue('category_id', product.global_product.category_id || '')
                    setValue('unit_of_measure', product.global_product.unit_of_measure)
                    setValue('image_url', product.global_product.image_url || '')
                    setValue('description', product.global_product.description || '')
                }
            }
        } catch (error) {
            console.error('Error loading product:', error)
        } finally {
            setLoading(false)
        }
    }

    const handleSearch = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!searchQuery.trim()) return

        try {
            setSearching(true)
            const results = await ProductService.searchGlobalCatalog(searchQuery)
            setSearchResults(results)
        } catch (error) {
            console.error('Search error:', error)
        } finally {
            setSearching(false)
        }
    }

    const handleSelectGlobal = (global: GlobalProduct) => {
        setSelectedGlobal(global)
        setIsNewGlobal(false)
        setStep('details')

        // Pre-fill form with global info (read-only mostly)
        setValue('name', global.name)
        setValue('sku', global.sku)
        setValue('category_id', global.category_id || '')
        setValue('unit_of_measure', global.unit_of_measure)
        setValue('image_url', global.image_url || '')
        setValue('description', global.description || '')
    }

    const handleCreateNewGlobal = () => {
        setSelectedGlobal(null)
        setIsNewGlobal(true)
        setStep('details')

        // Pre-fill name/sku from search query if user wants
        setValue('name', searchQuery) // often user searches for the new name
        setValue('sku', '')
        setValue('unit_of_measure', 'pza')
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
                    min_stock: data.min_stock,
                    unit_cost: data.unit_cost,
                    sale_price: data.sale_price,
                    current_stock: data.current_stock,
                    // We typically don't update global fields here unless we are admin and explicitly want to
                    // For now, let's assume we ONLY update store fields
                })
            } else {
                // Create New
                const createDTO: CreateProductDTO = {
                    store_id: storeId,
                    min_stock: data.min_stock,
                    unit_cost: data.unit_cost,
                    sale_price: data.sale_price,
                    current_stock: data.current_stock,
                    is_active: true
                }

                if (isNewGlobal) {
                    createDTO.new_global_product = {
                        name: data.name,
                        sku: data.sku,
                        description: data.description,
                        category_id: data.category_id,
                        unit_of_measure: data.unit_of_measure,
                        image_url: data.image_url,
                        is_active: true
                    }
                } else if (selectedGlobal) {
                    createDTO.global_product_id = selectedGlobal.id
                } else {
                    throw new Error("Invalid state: No global product selected or created")
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

    if (loading && !editingProduct && step === 'details') {
        return <div className="flex justify-center p-8"><Loader2 className="h-8 w-8 animate-spin" /></div>
    }

    return (
        <div className="space-y-6 max-w-2xl mx-auto">
            <div className="flex items-center gap-4">
                <Button variant="ghost" size="icon" onClick={() => {
                    if (step === 'details' && !id) setStep('search')
                    else navigate(-1)
                }}>
                    <ArrowLeft className="h-4 w-4" />
                </Button>
                <h1 className="text-2xl font-bold">{id ? 'Editar Producto' : 'Nuevo Producto'}</h1>
            </div>

            {/* STEP 1: SEARCH GLOBAL CATALOG */}
            {!id && step === 'search' && (
                <Card>
                    <CardHeader>
                        <CardTitle>Buscar en Catálogo Global</CardTitle>
                        <CardDescription>
                            Antes de crear un producto, verifica si ya existe en el catálogo global de la franquicia.
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        <form onSubmit={handleSearch} className="flex gap-2">
                            <Input
                                placeholder="Nombre o SKU..."
                                value={searchQuery}
                                onChange={e => setSearchQuery(e.target.value)}
                                autoFocus
                            />
                            <Button type="submit" disabled={searching}>
                                {searching ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
                            </Button>
                        </form>

                        <div className="space-y-2">
                            {searchResults.length > 0 && (
                                <div className="text-sm font-medium text-muted-foreground">Resultados encontrados:</div>
                            )}

                            {searchResults.map(global => (
                                <div key={global.id} className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted/50 transition-colors">
                                    <div>
                                        <div className="font-semibold">{global.name}</div>
                                        <div className="text-xs text-muted-foreground">SKU: {global.sku} | {global.unit_of_measure}</div>
                                    </div>
                                    <Button size="sm" variant="secondary" onClick={() => handleSelectGlobal(global)}>
                                        Seleccionar
                                    </Button>
                                </div>
                            ))}

                            {searchResults.length === 0 && searchQuery && !searching && (
                                <div className="text-center py-8 text-muted-foreground">
                                    No se encontraron productos en el catálogo global.
                                </div>
                            )}
                        </div>

                        <div className="pt-4 border-t">
                            <Button className="w-full" variant="outline" onClick={handleCreateNewGlobal}>
                                <Plus className="mr-2 h-4 w-4" /> Crear Nuevo Producto Global
                            </Button>
                        </div>
                    </CardContent>
                </Card>
            )}

            {/* STEP 2: DETAILS FORM */}
            {step === 'details' && (
                <Card>
                    <CardHeader>
                        <CardTitle>
                            {id ? 'Editar Inventario' : isNewGlobal ? 'Crear Nuevo Producto Global' : 'Agregar a Mi Tienda'}
                        </CardTitle>
                        {!isNewGlobal && selectedGlobal && (
                            <CardDescription>
                                Vinculando a: <span className="font-semibold text-primary">{selectedGlobal.name}</span> (SKU: {selectedGlobal.sku})
                            </CardDescription>
                        )}
                    </CardHeader>
                    <CardContent>
                        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">

                            {/* SECTION: GLOBAL DETAILS (Read-only if linked, Editable if new) */}
                            <div className="space-y-4 p-4 bg-muted/20 rounded-lg border">
                                <h3 className="font-semibold text-sm flex items-center gap-2">
                                    <Badge variant="outline">Catálogo Global</Badge>
                                    Datos del Producto
                                </h3>

                                <div className="grid gap-2">
                                    <Label htmlFor="name">Nombre</Label>
                                    <Input id="name" {...register('name', { required: isNewGlobal })} disabled={!isNewGlobal} />
                                    {errors.name && <span className="text-red-500 text-xs">Requerido</span>}
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div className="grid gap-2">
                                        <Label htmlFor="sku">SKU</Label>
                                        <Input id="sku" {...register('sku', { required: isNewGlobal })} disabled={!isNewGlobal} />
                                        {errors.sku && <span className="text-red-500 text-xs">Requerido</span>}
                                    </div>

                                    <div className="grid gap-2">
                                        <Label htmlFor="category">Categoría</Label>
                                        <Select
                                            disabled={!isNewGlobal}
                                            onValueChange={(val: string) => setValue('category_id', val)}
                                            defaultValue={watch('category_id')}
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
                                        {isNewGlobal && !watch('category_id') && <span className="text-red-500 text-xs">Requerido</span>}
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div className="grid gap-2">
                                        <Label htmlFor="unit">Unidad</Label>
                                        <Select
                                            disabled={!isNewGlobal}
                                            onValueChange={(val: string) => setValue('unit_of_measure', val)}
                                            defaultValue={watch('unit_of_measure')}
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
                                    <div className="grid gap-2">
                                        <Label htmlFor="image_url">Imagen URL</Label>
                                        <Input id="image_url" {...register('image_url')} disabled={!isNewGlobal} placeholder="https://..." />
                                    </div>
                                </div>
                            </div>

                            {/* SECTION: STORE DETAILS (Always Editable) */}
                            <div className="space-y-4 p-4 border rounded-lg bg-background">
                                <h3 className="font-semibold text-sm flex items-center gap-2">
                                    <Badge>Mi Tienda</Badge>
                                    Gestión de Inventario Local
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

                                    {/* Show Sale Price mainly for finished products, but allow otherwise */}
                                    <div className="grid gap-2">
                                        <Label htmlFor="sale_price">Precio Venta ($)</Label>
                                        <Input type="number" step="0.01" id="sale_price" {...register('sale_price', { valueAsNumber: true })} />
                                        <p className="text-[10px] text-muted-foreground">Dejar en 0 si es solo insumo</p>
                                    </div>
                                </div>
                            </div>

                            <Button type="submit" className="w-full" disabled={loading}>
                                {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                {id ? 'Guardar Cambios' : 'Registrar Producto'}
                            </Button>
                        </form>
                    </CardContent>
                </Card>
            )}
        </div>
    )
}
