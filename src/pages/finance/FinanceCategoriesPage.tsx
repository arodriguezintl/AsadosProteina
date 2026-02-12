import { useEffect, useState } from 'react'
import { FinanceService } from '@/services/finance.service'
import type { FinanceCategory, CreateCategoryDTO } from '@/types/finance'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Loader2, Plus, Trash2 } from 'lucide-react'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Label } from '@/components/ui/label'

export default function FinanceCategoriesPage() {
    const [categories, setCategories] = useState<FinanceCategory[]>([])
    const [loading, setLoading] = useState(true)
    const [isCreating, setIsCreating] = useState(false)
    const [newCategory, setNewCategory] = useState<CreateCategoryDTO>({
        name: '',
        type: 'expense',
        description: ''
    })

    useEffect(() => {
        loadCategories()
    }, [])

    const loadCategories = async () => {
        try {
            const data = await FinanceService.getCategories()
            setCategories(data)
        } catch (error) {
            console.error('Error loading categories:', error)
        } finally {
            setLoading(false)
        }
    }

    const handleCreate = async (e: React.FormEvent) => {
        e.preventDefault()
        setIsCreating(true)
        try {
            await FinanceService.createCategory(newCategory)
            await loadCategories()
            setNewCategory({ name: '', type: 'expense', description: '' })
        } catch (error) {
            console.error('Error creating category:', error)
        } finally {
            setIsCreating(false)
        }
    }

    const handleDelete = async (id: string) => {
        if (!confirm('¿Estás seguro de eliminar esta categoría?')) return
        try {
            await FinanceService.deleteCategory(id)
            await loadCategories()
        } catch (error) {
            console.error('Error deleting category:', error)
        }
    }

    return (
        <div className="space-y-6">
            <h1 className="text-3xl font-bold">Categorías de Finanzas</h1>

            <div className="grid gap-6 md:grid-cols-2">
                <Card>
                    <CardHeader>
                        <CardTitle>Nueva Categoría</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <form onSubmit={handleCreate} className="space-y-4">
                            <div className="grid gap-2">
                                <Label htmlFor="name">Nombre</Label>
                                <Input
                                    id="name"
                                    value={newCategory.name}
                                    onChange={e => setNewCategory({ ...newCategory, name: e.target.value })}
                                    required
                                />
                            </div>
                            <div className="grid gap-2">
                                <Label htmlFor="type">Tipo</Label>
                                <Select
                                    value={newCategory.type}
                                    onValueChange={(val: 'income' | 'expense') => setNewCategory({ ...newCategory, type: val })}
                                >
                                    <SelectTrigger>
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="income">Ingreso</SelectItem>
                                        <SelectItem value="expense">Gasto</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="grid gap-2">
                                <Label htmlFor="description">Descripción</Label>
                                <Input
                                    id="description"
                                    value={newCategory.description || ''}
                                    onChange={e => setNewCategory({ ...newCategory, description: e.target.value })}
                                />
                            </div>
                            <Button type="submit" disabled={isCreating}>
                                {isCreating && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                <Plus className="mr-2 h-4 w-4" /> Crear Categoría
                            </Button>
                        </form>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle>Listado de Categorías</CardTitle>
                    </CardHeader>
                    <CardContent>
                        {loading ? (
                            <div className="flex justify-center p-4">
                                <Loader2 className="h-6 w-6 animate-spin" />
                            </div>
                        ) : (
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Nombre</TableHead>
                                        <TableHead>Tipo</TableHead>
                                        <TableHead>Descripción</TableHead>
                                        <TableHead>Acciones</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {categories.map((category) => (
                                        <TableRow key={category.id}>
                                            <TableCell className="font-medium">{category.name}</TableCell>
                                            <TableCell>
                                                {category.type === 'income' ? (
                                                    <span className="text-green-600 font-bold">Ingreso</span>
                                                ) : (
                                                    <span className="text-red-600 font-bold">Gasto</span>
                                                )}
                                            </TableCell>
                                            <TableCell>{category.description}</TableCell>
                                            <TableCell>
                                                <Button variant="ghost" size="icon" onClick={() => handleDelete(category.id)}>
                                                    <Trash2 className="h-4 w-4 text-red-500" />
                                                </Button>
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                    {categories.length === 0 && (
                                        <TableRow>
                                            <TableCell colSpan={4} className="text-center text-muted-foreground">
                                                No hay categorías registradas
                                            </TableCell>
                                        </TableRow>
                                    )}
                                </TableBody>
                            </Table>
                        )}
                    </CardContent>
                </Card>
            </div>
        </div>
    )
}
