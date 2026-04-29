import { useEffect, useState } from 'react'
import { FinanceService } from '@/services/finance.service'
import type { FinanceCategory, CreateCategoryDTO } from '@/types/finance'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Loader2, Plus, Trash2, Wallet, Tag, Activity, ArrowUpRight, ArrowDownRight } from 'lucide-react'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Label } from '@/components/ui/label'
import { cn } from '@/lib/utils'

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
        <div className="space-y-8 animate-in fade-in duration-700">
            {/* Header */}
            <div>
                <h1 className="text-4xl font-black text-slate-900 dark:text-white tracking-tighter">Categorías</h1>
                <div className="flex items-center gap-2 text-muted-foreground mt-1">
                    <Tag className="h-4 w-4" />
                    <span className="text-sm font-medium">Clasificación de ingresos y gastos</span>
                </div>
            </div>

            <div className="grid gap-8 md:grid-cols-12">
                {/* Creation Form */}
                <Card className="md:col-span-4 border-none rounded-3xl shadow-soft bg-white dark:bg-slate-900 h-fit">
                    <CardHeader className="pb-4">
                        <CardTitle className="text-xl font-black tracking-tight flex items-center gap-2">
                            <Plus className="h-5 w-5 text-primary" />
                            Nueva Categoría
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <form onSubmit={handleCreate} className="space-y-5">
                            <div className="space-y-2">
                                <Label htmlFor="name" className="text-xs font-bold uppercase tracking-widest opacity-70">Nombre</Label>
                                <Input
                                    id="name"
                                    placeholder="Ej: Servicios, Renta, Ventas..."
                                    className="rounded-xl border-2 h-11"
                                    value={newCategory.name}
                                    onChange={e => setNewCategory({ ...newCategory, name: e.target.value })}
                                    required
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="type" className="text-xs font-bold uppercase tracking-widest opacity-70">Tipo</Label>
                                <Select
                                    value={newCategory.type}
                                    onValueChange={(val: 'income' | 'expense') => setNewCategory({ ...newCategory, type: val })}
                                >
                                    <SelectTrigger className="rounded-xl border-2 h-11 font-bold">
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent className="rounded-xl">
                                        <SelectItem value="income" className="font-bold text-emerald-600">Ingreso</SelectItem>
                                        <SelectItem value="expense" className="font-bold text-rose-600">Gasto</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="description" className="text-xs font-bold uppercase tracking-widest opacity-70">Descripción</Label>
                                <Input
                                    id="description"
                                    placeholder="Opcional..."
                                    className="rounded-xl border-2 h-11"
                                    value={newCategory.description || ''}
                                    onChange={e => setNewCategory({ ...newCategory, description: e.target.value })}
                                />
                            </div>
                            <Button type="submit" className="w-full rounded-xl font-bold h-12 shadow-lg shadow-primary/20" disabled={isCreating}>
                                {isCreating ? <Loader2 className="mr-2 h-5 w-5 animate-spin" /> : <Plus className="mr-2 h-5 w-5" />}
                                Crear Categoría
                            </Button>
                        </form>
                    </CardContent>
                </Card>

                {/* List Table */}
                <Card className="md:col-span-8 border-none rounded-3xl shadow-soft bg-white dark:bg-slate-900 overflow-hidden">
                    <CardHeader className="pb-4 flex flex-row items-center justify-between">
                        <CardTitle className="text-xl font-black tracking-tight flex items-center gap-2">
                            <Wallet className="h-5 w-5 text-primary" />
                            Listado de Categorías
                        </CardTitle>
                        <div className="px-3 py-1 rounded-full bg-slate-100 dark:bg-slate-800 text-[10px] font-black uppercase tracking-widest">
                            {categories.length} Totales
                        </div>
                    </CardHeader>
                    <CardContent className="p-0">
                        {loading ? (
                            <div className="flex flex-col items-center justify-center p-12 space-y-4">
                                <Loader2 className="h-10 w-10 animate-spin text-primary opacity-50" />
                                <p className="text-sm font-medium text-muted-foreground">Cargando categorías...</p>
                            </div>
                        ) : (
                            <Table>
                                <TableHeader>
                                    <TableRow className="bg-slate-50/50 dark:bg-slate-800/50 hover:bg-transparent border-b border-slate-100 dark:border-slate-800">
                                        <TableHead className="font-bold text-xs uppercase tracking-widest py-4 pl-6">Nombre</TableHead>
                                        <TableHead className="font-bold text-xs uppercase tracking-widest py-4">Tipo</TableHead>
                                        <TableHead className="font-bold text-xs uppercase tracking-widest py-4">Descripción</TableHead>
                                        <TableHead className="font-bold text-xs uppercase tracking-widest py-4 text-right pr-6">Acciones</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {categories.map((category) => (
                                        <TableRow key={category.id} className="group hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors border-b border-slate-50 dark:border-slate-800">
                                            <TableCell className="pl-6 py-4">
                                                <div className="flex items-center gap-3">
                                                    <div className={cn(
                                                        "p-2 rounded-lg",
                                                        category.type === 'income' ? "bg-emerald-100 text-emerald-600" : "bg-rose-100 text-rose-600"
                                                    )}>
                                                        <Activity className="h-4 w-4" />
                                                    </div>
                                                    <span className="font-black text-slate-800 dark:text-slate-100">{category.name}</span>
                                                </div>
                                            </TableCell>
                                            <TableCell>
                                                {category.type === 'income' ? (
                                                    <div className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-emerald-100 text-emerald-600 text-[10px] font-black uppercase">
                                                        <ArrowUpRight className="h-3 w-3" /> Ingreso
                                                    </div>
                                                ) : (
                                                    <div className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-rose-100 text-rose-600 text-[10px] font-black uppercase">
                                                        <ArrowDownRight className="h-3 w-3" /> Gasto
                                                    </div>
                                                )}
                                            </TableCell>
                                            <TableCell className="text-sm font-medium text-slate-500 max-w-[200px] truncate">
                                                {category.description || '-'}
                                            </TableCell>
                                            <TableCell className="pr-6 text-right">
                                                <Button 
                                                    variant="ghost" 
                                                    size="icon" 
                                                    className="rounded-xl hover:bg-rose-50 hover:text-rose-600 dark:hover:bg-rose-950/30 transition-colors"
                                                    onClick={() => handleDelete(category.id)}
                                                >
                                                    <Trash2 className="h-4 w-4" />
                                                </Button>
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                    {categories.length === 0 && (
                                        <TableRow>
                                            <TableCell colSpan={4} className="text-center py-12">
                                                <div className="flex flex-col items-center justify-center space-y-2 text-muted-foreground opacity-50">
                                                    <Tag className="h-12 w-12" />
                                                    <p className="font-medium">No hay categorías registradas</p>
                                                </div>
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
