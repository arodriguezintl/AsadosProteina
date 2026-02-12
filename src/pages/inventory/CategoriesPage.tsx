import { useEffect, useState } from 'react'
import { ProductService } from '@/services/product.service'
import type { Category, CreateCategoryDTO } from '@/types/inventory'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Loader2, Plus, Trash2 } from 'lucide-react'

export default function CategoriesPage() {
    const [categories, setCategories] = useState<Category[]>([])
    const [loading, setLoading] = useState(true)
    const [isCreating, setIsCreating] = useState(false)
    const [newCategory, setNewCategory] = useState<CreateCategoryDTO>({
        name: '',
        type: 'raw_material', // default
        description: ''
    })

    const commonTypes = [
        { value: 'raw_material', label: 'Materia Prima' },
        { value: 'finished_product', label: 'Producto Final' },
        { value: 'consumable', label: 'Desechables' },
        { value: 'service', label: 'Servicios' },
        { value: 'equipment', label: 'Equipo' }
    ]

    useEffect(() => {
        loadCategories()
    }, [])

    const loadCategories = async () => {
        try {
            const data = await ProductService.getCategories()
            setCategories(data)
        } catch (error) {
            console.error('Error loading categories:', error)
        } finally {
            setLoading(false)
        }
    }

    const handleCreate = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!newCategory.name) return

        setIsCreating(true)
        try {
            await ProductService.createCategory(newCategory)
            await loadCategories()
            setNewCategory({ name: '', type: 'raw_material', description: '' })
        } catch (error: any) {
            console.error('Error creating category:', error)
            alert(`Error al crear categoría: ${error.message || 'Error desconocido'}`)
        } finally {
            setIsCreating(false)
        }
    }

    const handleDelete = async (id: string) => {
        if (!confirm('¿Estás seguro de eliminar esta categoría?')) return
        try {
            await ProductService.deleteCategory(id)
            await loadCategories()
        } catch (error) {
            console.error('Error deleting category:', error)
            alert('No se pudo eliminar la categoría. Asegúrate de que no tenga productos asociados.')
        }
    }

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-3xl font-bold tracking-tight">Categorías de Inventario</h1>
                <p className="text-muted-foreground">Gestiona las clasificaciones de tus productos e ingredientes.</p>
            </div>

            <div className="grid gap-6 md:grid-cols-3">
                <Card className="md:col-span-1">
                    <CardHeader>
                        <CardTitle>Nueva Categoría</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <form onSubmit={handleCreate} className="space-y-4">
                            <div className="space-y-2">
                                <Label htmlFor="name">Nombre</Label>
                                <Input
                                    id="name"
                                    placeholder="Ej: Carnes, Verduras..."
                                    value={newCategory.name}
                                    onChange={e => setNewCategory({ ...newCategory, name: e.target.value })}
                                    required
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="type">Tipo de Uso</Label>
                                <div className="space-y-3">
                                    <p className="text-sm font-medium text-amber-600">
                                        * Selecciona "Producto Final" para que aparezca en el Menú de Venta.
                                    </p>
                                    <Input
                                        id="type"
                                        placeholder="Escribe el tipo (ej: Limpieza, Oficina...)"
                                        value={newCategory.type}
                                        onChange={e => setNewCategory({ ...newCategory, type: e.target.value as any })}
                                        required
                                    />
                                    <div className="flex flex-wrap gap-2">
                                        <Button
                                            type="button"
                                            variant={newCategory.type === "finished_product" ? "default" : "outline"}
                                            size="sm"
                                            className={newCategory.type === "finished_product" ? "bg-green-600 hover:bg-green-700 h-8 font-bold" : "h-8"}
                                            onClick={() => setNewCategory({ ...newCategory, type: "finished_product" })}
                                        >
                                            Producto Final (Venta)
                                        </Button>

                                        {commonTypes.filter(t => t.value !== 'finished_product').map(t => (
                                            <Button
                                                key={t.value}
                                                type="button"
                                                variant={newCategory.type === t.value ? "default" : "outline"}
                                                size="sm"
                                                className="h-8"
                                                onClick={() => setNewCategory({ ...newCategory, type: t.value as any })}
                                            >
                                                {t.label}
                                            </Button>
                                        ))}
                                    </div>
                                    <p className="text-xs text-muted-foreground">
                                        Todo lo que NO sea "Producto Final" se considerará parte del Inventario Interno.
                                    </p>
                                </div>
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="description">Descripción (Opcional)</Label>
                                <Input
                                    id="description"
                                    placeholder="Breve descripción..."
                                    value={newCategory.description || ''}
                                    onChange={e => setNewCategory({ ...newCategory, description: e.target.value })}
                                />
                            </div>
                            <Button type="submit" className="w-full" disabled={isCreating}>
                                {isCreating ? (
                                    <>
                                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                        Creando...
                                    </>
                                ) : (
                                    <>
                                        <Plus className="mr-2 h-4 w-4" />
                                        Agregar Categoría
                                    </>
                                )}
                            </Button>
                        </form>
                    </CardContent>
                </Card>

                <Card className="md:col-span-2">
                    <CardHeader>
                        <CardTitle>Categorías Registradas</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="rounded-md border">
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Nombre</TableHead>
                                        <TableHead>Tipo</TableHead>
                                        <TableHead className="text-right">Acciones</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {loading ? (
                                        <TableRow>
                                            <TableCell colSpan={3} className="text-center h-24">
                                                <div className="flex items-center justify-center gap-2">
                                                    <Loader2 className="h-4 w-4 animate-spin" /> Cargando...
                                                </div>
                                            </TableCell>
                                        </TableRow>
                                    ) : categories.length === 0 ? (
                                        <TableRow>
                                            <TableCell colSpan={3} className="text-center h-24 text-muted-foreground">
                                                No hay categorías registradas.
                                            </TableCell>
                                        </TableRow>
                                    ) : (
                                        categories.map((cat) => (
                                            <TableRow key={cat.id}>
                                                <TableCell className="font-medium">
                                                    <div>{cat.name}</div>
                                                    {cat.description && (
                                                        <div className="text-xs text-muted-foreground">{cat.description}</div>
                                                    )}
                                                </TableCell>
                                                <TableCell>
                                                    <div className="flex flex-col gap-1">
                                                        <span className={`inline-flex w-fit items-center px-2 py-1 rounded-full text-xs font-bold ${cat.type === 'finished_product'
                                                                ? 'bg-green-100 text-green-700 border border-green-200'
                                                                : 'bg-blue-50 text-blue-700 border border-blue-100'
                                                            }`}>
                                                            {cat.type === 'finished_product' ? 'MENÚ DE VENTA' : 'INVENTARIO INTERNO'}
                                                        </span>
                                                        <span className="text-xs text-muted-foreground font-mono bg-muted/50 px-1 rounded w-fit">
                                                            {cat.type}
                                                        </span>
                                                    </div>
                                                </TableCell>
                                                <TableCell className="text-right">
                                                    <Button
                                                        variant="ghost"
                                                        size="icon"
                                                        className="text-red-500 hover:text-red-600 hover:bg-red-50"
                                                        onClick={() => handleDelete(cat.id)}
                                                    >
                                                        <Trash2 className="h-4 w-4" />
                                                    </Button>
                                                </TableCell>
                                            </TableRow>
                                        ))
                                    )}
                                </TableBody>
                            </Table>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    )
}
