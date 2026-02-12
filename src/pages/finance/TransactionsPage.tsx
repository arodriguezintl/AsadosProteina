import { useEffect, useState } from 'react'
import { FinanceService } from '@/services/finance.service'
import type { Transaction, FinanceCategory } from '@/types/finance'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import { Loader2, Plus, Search, TrendingUp, TrendingDown, Filter } from 'lucide-react'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'
import { useAuthStore } from '@/store/auth.store'

export default function TransactionsPage() {
    const [transactions, setTransactions] = useState<Transaction[]>([])
    const [categories, setCategories] = useState<FinanceCategory[]>([])
    const [loading, setLoading] = useState(true)
    const [searchTerm, setSearchTerm] = useState('')
    const [typeFilter, setTypeFilter] = useState<'all' | 'income' | 'expense'>('all')
    const [isDialogOpen, setIsDialogOpen] = useState(false)
    const [formData, setFormData] = useState({
        type: 'expense' as 'income' | 'expense',
        amount: 0,
        description: '',
        category_id: '',
        transaction_date: new Date().toISOString().split('T')[0]
    })

    const { storeId } = useAuthStore()

    useEffect(() => {
        if (storeId) {
            loadData()
        }
    }, [storeId, typeFilter])

    const loadData = async () => {
        try {
            if (!storeId) return

            const filters = typeFilter !== 'all' ? { type: typeFilter } : {}
            const [transData, catData] = await Promise.all([
                FinanceService.getTransactions(storeId, filters),
                FinanceService.getCategories()
            ])

            setTransactions(transData)
            setCategories(catData)
        } catch (error) {
            console.error('Error loading data:', error)
        } finally {
            setLoading(false)
        }
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setLoading(true)
        try {
            if (!storeId) return

            await FinanceService.createTransaction({
                ...formData,
                store_id: storeId,
                amount: Number(formData.amount)
            })

            setIsDialogOpen(false)
            setFormData({
                type: 'expense',
                amount: 0,
                description: '',
                category_id: '',
                transaction_date: new Date().toISOString().split('T')[0]
            })
            loadData()
        } catch (error: any) {
            alert(error?.message || 'Error al guardar transacción')
        } finally {
            setLoading(false)
        }
    }

    const filteredTransactions = transactions.filter(t =>
        t.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        t.category?.name.toLowerCase().includes(searchTerm.toLowerCase())
    )

    const totalIncome = filteredTransactions
        .filter(t => t.type === 'income')
        .reduce((sum, t) => sum + Number(t.amount), 0)

    const totalExpenses = filteredTransactions
        .filter(t => t.type === 'expense')
        .reduce((sum, t) => sum + Number(t.amount), 0)

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-black text-[#0B2B26] tracking-tight">Transacciones</h1>
                    <p className="text-muted-foreground">Registro de ingresos y gastos</p>
                </div>
                <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                    <DialogTrigger asChild>
                        <Button>
                            <Plus className="mr-2 h-4 w-4" /> Nueva Transacción
                        </Button>
                    </DialogTrigger>
                    <DialogContent>
                        <DialogHeader>
                            <DialogTitle>Nueva Transacción</DialogTitle>
                            <DialogDescription>Registra un ingreso o gasto</DialogDescription>
                        </DialogHeader>
                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div className="space-y-2">
                                <Label>Tipo</Label>
                                <Select
                                    value={formData.type}
                                    onValueChange={(v: 'income' | 'expense') => setFormData({ ...formData, type: v })}
                                >
                                    <SelectTrigger><SelectValue /></SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="income">Ingreso</SelectItem>
                                        <SelectItem value="expense">Gasto</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label>Monto ($)</Label>
                                    <Input
                                        type="number"
                                        step="0.01"
                                        required
                                        value={formData.amount || ''}
                                        onChange={e => setFormData({ ...formData, amount: parseFloat(e.target.value) })}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label>Fecha</Label>
                                    <Input
                                        type="date"
                                        required
                                        value={formData.transaction_date}
                                        onChange={e => setFormData({ ...formData, transaction_date: e.target.value })}
                                    />
                                </div>
                            </div>
                            <div className="space-y-2">
                                <Label>Categoría</Label>
                                <Select
                                    value={formData.category_id}
                                    onValueChange={v => setFormData({ ...formData, category_id: v })}
                                >
                                    <SelectTrigger><SelectValue placeholder="Seleccionar categoría" /></SelectTrigger>
                                    <SelectContent>
                                        {categories.map(cat => (
                                            <SelectItem key={cat.id} value={cat.id}>
                                                {cat.name}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="space-y-2">
                                <Label>Descripción</Label>
                                <Input
                                    required
                                    value={formData.description}
                                    onChange={e => setFormData({ ...formData, description: e.target.value })}
                                    placeholder="Ej: Compra de ingredientes"
                                />
                            </div>
                            <DialogFooter>
                                <Button type="submit" disabled={loading}>
                                    {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                                    Guardar
                                </Button>
                            </DialogFooter>
                        </form>
                    </DialogContent>
                </Dialog>
            </div>

            {/* Summary Cards */}
            <div className="grid gap-4 md:grid-cols-3">
                <Card className="border-l-4 border-l-green-500">
                    <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm font-medium text-muted-foreground">Total Ingresos</p>
                                <p className="text-2xl font-bold text-green-600">${totalIncome.toFixed(2)}</p>
                            </div>
                            <TrendingUp className="h-8 w-8 text-green-500" />
                        </div>
                    </CardContent>
                </Card>
                <Card className="border-l-4 border-l-red-500">
                    <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm font-medium text-muted-foreground">Total Gastos</p>
                                <p className="text-2xl font-bold text-red-600">${totalExpenses.toFixed(2)}</p>
                            </div>
                            <TrendingDown className="h-8 w-8 text-red-500" />
                        </div>
                    </CardContent>
                </Card>
                <Card className="border-l-4 border-l-blue-500">
                    <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm font-medium text-muted-foreground">Balance</p>
                                <p className={`text-2xl font-bold ${totalIncome - totalExpenses >= 0 ? 'text-blue-600' : 'text-red-600'}`}>
                                    ${(totalIncome - totalExpenses).toFixed(2)}
                                </p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Filters */}
            <div className="flex gap-4 items-center">
                <div className="relative flex-1 max-w-sm">
                    <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                        placeholder="Buscar transacción..."
                        className="pl-8"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
                <div className="flex items-center gap-2">
                    <Filter className="h-4 w-4 text-muted-foreground" />
                    <Select value={typeFilter} onValueChange={(v: any) => setTypeFilter(v)}>
                        <SelectTrigger className="w-[180px]">
                            <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">Todos</SelectItem>
                            <SelectItem value="income">Ingresos</SelectItem>
                            <SelectItem value="expense">Gastos</SelectItem>
                        </SelectContent>
                    </Select>
                </div>
            </div>

            {/* Transactions Table */}
            <Card>
                <CardContent className="p-0">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Fecha</TableHead>
                                <TableHead>Descripción</TableHead>
                                <TableHead>Categoría</TableHead>
                                <TableHead>Tipo</TableHead>
                                <TableHead className="text-right">Monto</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {loading ? (
                                <TableRow>
                                    <TableCell colSpan={5} className="text-center h-24">
                                        <Loader2 className="h-6 w-6 animate-spin mx-auto" />
                                    </TableCell>
                                </TableRow>
                            ) : filteredTransactions.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={5} className="text-center h-24 text-muted-foreground">
                                        No se encontraron transacciones.
                                    </TableCell>
                                </TableRow>
                            ) : (
                                filteredTransactions.map(trans => (
                                    <TableRow key={trans.id}>
                                        <TableCell className="font-medium">
                                            {format(new Date(trans.transaction_date), 'dd MMM yyyy', { locale: es })}
                                        </TableCell>
                                        <TableCell>{trans.description}</TableCell>
                                        <TableCell>
                                            <Badge variant="outline">{trans.category?.name || 'Sin categoría'}</Badge>
                                        </TableCell>
                                        <TableCell>
                                            {trans.type === 'income' ? (
                                                <Badge className="bg-green-500">Ingreso</Badge>
                                            ) : (
                                                <Badge className="bg-red-500">Gasto</Badge>
                                            )}
                                        </TableCell>
                                        <TableCell className={`text-right font-semibold ${trans.type === 'income' ? 'text-green-600' : 'text-red-600'}`}>
                                            {trans.type === 'income' ? '+' : '-'}${Number(trans.amount).toFixed(2)}
                                        </TableCell>
                                    </TableRow>
                                ))
                            )}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>
        </div>
    )
}
