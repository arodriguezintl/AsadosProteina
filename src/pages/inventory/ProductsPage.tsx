import { useEffect, useState } from 'react'
import { ProductService } from '@/services/product.service'
import type { Product } from '@/types/inventory'
import { useAuthStore } from '@/store/auth.store'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Plus, Search, Loader2, Edit, Trash2, PackagePlus, RotateCcw } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { Badge } from '@/components/ui/badge'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Label } from '@/components/ui/label'

type ProductsPageProps = {
    viewMode?: 'inventory' | 'menu' // inventory = raw materials/others, menu = finished products
}

export default function ProductsPage({ viewMode }: ProductsPageProps) {
    const [products, setProducts] = useState<Product[]>([])
    const [loading, setLoading] = useState(true)
    const [searchTerm, setSearchTerm] = useState('')
    const { user, storeId } = useAuthStore()
    const navigate = useNavigate()

    useEffect(() => {
        loadProducts()
    }, [storeId])

    const loadProducts = async () => {
        try {
            if (!storeId) {
                console.warn('No store ID found for current user')
                return
            }

            const data = await ProductService.getProducts(storeId)
            setProducts(data)
        } catch (error) {
            console.error('Error loading products:', error)
        } finally {
            setLoading(false)
        }
    }


    const filteredProducts = products.filter(p => {
        const matchesSearch = p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            p.sku.toLowerCase().includes(searchTerm.toLowerCase())

        if (!matchesSearch) return false

        if (viewMode === 'inventory') {
            // Show everything EXCEPT finished products (Raw Materials, Consumables, Equipment, etc.)
            // Or if user strictly wants "Only Raw Materials", we might need to adjust, but usually Inventory implies "Internal stuff"
            return p.category?.type !== 'finished_product'
        }

        if (viewMode === 'menu') {
            // Show ONLY finished products
            return p.category?.type === 'finished_product'
        }

        return true
    })

    const handleDelete = async (id: string) => {
        if (!confirm('¿Estás seguro de eliminar este producto?')) return
        try {
            await ProductService.deleteProduct(id)
            setProducts(products.filter(p => p.id !== id))
        } catch (error: any) {
            console.error('Error deleting product:', error)
            // Error code 23503 is foreign key violation in Postgres
            if (error.code === '23503') {
                const shouldArchive = confirm(
                    'No se puede eliminar permanentemente porque este producto tiene historial (ventas, recetas o inventario).\n\n' +
                    'Eliminarlo causaría inconsistencias en los reportes.\n\n' +
                    '¿Deseas DESACTIVARLO en su lugar? (Dejará de aparecer en nuevas ventas)'
                )

                if (shouldArchive) {
                    try {
                        await ProductService.updateProduct(id, { is_active: false })
                        // Update local state to reflect change
                        setProducts(products.map(p =>
                            p.id === id ? { ...p, is_active: false } : p
                        ))
                        // Optional: alert('Producto desactivado correctamente')
                    } catch (updateError) {
                        console.error('Error archiving product:', updateError)
                        alert('Ocurrió un error al intentar desactivar el producto.')
                    }
                }
            } else {
                alert('Error al eliminar producto: ' + (error.message || 'Error desconocido'))
            }
        }
    }

    const [restockDialog, setRestockDialog] = useState<{ open: boolean, product: Product | null }>({ open: false, product: null })
    const [restockForm, setRestockForm] = useState({ quantity: 0, cost: 0, notes: '' })
    const [restockLoading, setRestockLoading] = useState(false)

    const handleOpenRestock = (product: Product) => {
        setRestockDialog({ open: true, product })
        setRestockForm({ quantity: 0, cost: product.unit_cost || 0, notes: '' })
    }

    const handleRestockSubmit = async (e: React.FormEvent) => {
        e.preventDefault()

        const quantity = restockForm.quantity
        const cost = restockForm.cost

        if (!restockDialog.product) return

        if (isNaN(quantity) || quantity <= 0) {
            alert('Por favor ingresa una cantidad válida mayor a 0.')
            return
        }

        if (isNaN(cost) || cost < 0) {
            alert('Por favor ingresa un costo válido (puede ser 0).')
            return
        }

        setRestockLoading(true)
        try {
            await ProductService.addStock(
                restockDialog.product.id,
                quantity,
                cost,
                user?.id || '',
                restockForm.notes
            )
            setRestockDialog({ open: false, product: null })
            loadProducts()
            alert('Stock agregado exitosamente')
        } catch (error: any) {
            console.error('Error adding stock:', error)
            alert(`Error al agregar stock: ${error.message || JSON.stringify(error)}`)
        } finally {
            setRestockLoading(false)
        }
    }

    const handleToggleActive = async (product: Product) => {
        const action = product.is_active ? 'desactivar' : 'reactivar'
        if (!confirm(`¿Estás seguro de ${action} este producto?`)) return

        try {
            await ProductService.updateProduct(product.id, { is_active: !product.is_active })
            setProducts(products.map(p =>
                p.id === product.id ? { ...p, is_active: !product.is_active } : p
            ))
        } catch (error) {
            console.error('Error updating product status:', error)
            alert(`Error al ${action} el producto`)
        }
    }

    const pageTitle = viewMode === 'menu' ? 'Productos de Venta' : 'Inventario (Materias Primas)'
    const pageDescription = viewMode === 'menu'
        ? 'Gestiona el catálogo de productos finales para la venta.'
        : 'Gestiona el inventario de insumos y materias primas para recetas.'

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">{pageTitle}</h1>
                    <p className="text-muted-foreground">{pageDescription}</p>
                </div>
                <Button onClick={() => {
                    const typeParam = viewMode === 'menu' ? '?type=finished_product' : '?type=raw_material'
                    navigate(`/inventory/products/new${typeParam}`)
                }}>
                    <Plus className="mr-2 h-4 w-4" /> Nuevo Producto
                </Button>
            </div>

            <div className="flex items-center gap-2">
                <div className="relative flex-1 max-w-sm">
                    <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                        placeholder="Buscar por nombre o SKU..."
                        className="pl-8"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
            </div>

            <div className="rounded-md border">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Nombre</TableHead>
                            <TableHead>Categoría</TableHead>
                            <TableHead>SKU</TableHead>
                            <TableHead>Precio</TableHead>
                            <TableHead>Stock</TableHead>
                            <TableHead>Estado</TableHead>
                            <TableHead className="text-right">Acciones</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {loading ? (
                            <TableRow>
                                <TableCell colSpan={7} className="text-center h-24">
                                    <div className="flex items-center justify-center gap-2">
                                        <Loader2 className="h-4 w-4 animate-spin" /> Cargando productos...
                                    </div>
                                </TableCell>
                            </TableRow>
                        ) : filteredProducts.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={7} className="text-center h-24 text-muted-foreground">
                                    No se encontraron productos.
                                </TableCell>
                            </TableRow>
                        ) : (
                            filteredProducts.map((product) => (
                                <TableRow key={product.id} className={!product.is_active ? "bg-muted/50" : ""}>
                                    <TableCell className="font-medium">{product.name}</TableCell>
                                    <TableCell>{product.category?.name || '-'}</TableCell>
                                    <TableCell>{product.sku}</TableCell>
                                    <TableCell>${product.sale_price?.toFixed(2) || '-'}</TableCell>
                                    <TableCell>
                                        <span className={product.current_stock <= product.min_stock ? "text-red-500 font-bold" : ""}>
                                            {product.current_stock} {product.unit_of_measure}
                                        </span>
                                    </TableCell>
                                    <TableCell>
                                        <Badge variant={product.is_active ? "default" : "secondary"}>
                                            {product.is_active ? "Activo" : "Inactivo"}
                                        </Badge>
                                    </TableCell>
                                    <TableCell className="text-right flex items-center justify-end gap-1">
                                        <Button variant="ghost" size="icon" className="text-blue-600 hover:text-blue-700 hover:bg-blue-50" onClick={() => handleOpenRestock(product)} title="Resurtir Stock" disabled={!product.is_active}>
                                            <PackagePlus className="h-4 w-4" />
                                        </Button>
                                        <Button variant="ghost" size="icon" onClick={() => navigate(`/inventory/products/${product.id}`)}>
                                            <Edit className="h-4 w-4" />
                                        </Button>

                                        {product.is_active ? (
                                            <Button variant="ghost" size="icon" className="text-red-500 hover:text-red-600" onClick={() => handleDelete(product.id)} title="Eliminar / Desactivar">
                                                <Trash2 className="h-4 w-4" />
                                            </Button>
                                        ) : (
                                            <Button variant="ghost" size="icon" className="text-green-600 hover:text-green-700" onClick={() => handleToggleActive(product)} title="Reactivar Producto">
                                                <RotateCcw className="h-4 w-4" />
                                            </Button>
                                        )}
                                    </TableCell>
                                </TableRow>
                            ))
                        )}
                    </TableBody>
                </Table>
            </div>

            <Dialog open={restockDialog.open} onOpenChange={(open) => !open && setRestockDialog({ ...restockDialog, open: false })}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Resurtir Inventario - {restockDialog.product?.name}</DialogTitle>
                        <DialogDescription>
                            Registra una entrada de inventario para este producto.
                        </DialogDescription>
                    </DialogHeader>
                    <form onSubmit={handleRestockSubmit}>
                        <div className="grid gap-4 py-4">
                            <div className="grid grid-cols-4 items-center gap-4">
                                <Label htmlFor="quantity" className="text-right">
                                    Cantidad
                                </Label>
                                <Input
                                    id="quantity"
                                    type="number"
                                    min="0.01" step="0.01"
                                    value={restockForm.quantity || ''}
                                    onChange={(e) => setRestockForm({ ...restockForm, quantity: parseFloat(e.target.value) })}
                                    className="col-span-3"
                                    required
                                />
                            </div>
                            <div className="grid grid-cols-4 items-center gap-4">
                                <Label htmlFor="cost" className="text-right">
                                    Costo Unitario
                                </Label>
                                <Input
                                    id="cost"
                                    type="number"
                                    step="0.01"
                                    value={restockForm.cost || ''}
                                    onChange={(e) => setRestockForm({ ...restockForm, cost: parseFloat(e.target.value) })}
                                    className="col-span-3"
                                    required
                                />
                            </div>
                            <div className="grid grid-cols-4 items-center gap-4">
                                <Label htmlFor="notes" className="text-right">
                                    Notas/Ref
                                </Label>
                                <Input
                                    id="notes"
                                    value={restockForm.notes}
                                    onChange={(e) => setRestockForm({ ...restockForm, notes: e.target.value })}
                                    placeholder="Ej. Compra Factura 123"
                                    className="col-span-3"
                                />
                            </div>
                        </div>
                        <DialogFooter>
                            <Button type="submit" disabled={restockLoading}>
                                {restockLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <PackagePlus className="mr-2 h-4 w-4" />}
                                Registrar Entrada
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>
        </div>
    )
}
