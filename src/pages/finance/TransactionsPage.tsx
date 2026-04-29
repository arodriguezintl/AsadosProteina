import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
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
import { Loader2, Plus, Search, TrendingUp, TrendingDown, Filter, FileText, ArrowLeftRight, Calendar, Wallet, CreditCard, Banknote } from 'lucide-react'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'
import { getMexicoDayString, parseMexicoDateToLocal } from '@/utils/date'
import { useAuthStore } from '@/store/auth.store'
import { PDFDownloadLink } from '@react-pdf/renderer'
import { TransactionsReportDocument } from '@/components/finance/TransactionsReportDocument'
import { cn } from '@/lib/utils'
import { formatNumber } from '@/utils/format'

export default function TransactionsPage() {
    const [transactions, setTransactions] = useState<Transaction[]>([])
    const [categories, setCategories] = useState<FinanceCategory[]>([])
    const [stats, setStats] = useState({ income: 0, expenses: 0, balance: 0 })
    const [loading, setLoading] = useState(true)
    const [currentPage, setCurrentPage] = useState(1)
    const [itemsPerPage] = useState(25)
    const [searchTerm, setSearchTerm] = useState('')
    const [typeFilter, setTypeFilter] = useState<'all' | 'income' | 'expense'>('all')
    const [isDialogOpen, setIsDialogOpen] = useState(false)
    const [formData, setFormData] = useState({
        type: 'expense' as 'income' | 'expense',
        amount: 0,
        description: '',
        category_id: '',
        payment_method: 'cash' as 'cash' | 'transfer' | 'card',
        transaction_date: getMexicoDayString()
    })

    const { storeId } = useAuthStore()

    useEffect(() => {
        if (storeId) {
            loadData()
        }
    }, [storeId, typeFilter])

    useEffect(() => {
        setCurrentPage(1)
    }, [searchTerm, typeFilter])

    const loadData = async () => {
        try {
            if (!storeId) return

            const filters = typeFilter !== 'all' ? { type: typeFilter } : {}
            const [transData, catData, financialStats] = await Promise.all([
                FinanceService.getTransactions(storeId, filters),
                FinanceService.getCategories(),
                FinanceService.getFinancialStats(storeId)
            ])

            // If we are showing all or income, let's also fetch recent sales to show them as "transactions"
            let unifiedTransactions = [...transData]
            
            if (typeFilter !== 'expense') {
                const { data: salesData } = await supabase
                    .from('orders')
                    .select('*')
                    .eq('store_id', storeId)
                    .eq('status', 'completed')
                    .order('created_at', { ascending: false })
                    .limit(50)

                if (salesData) {
                    const salesAsTransactions = salesData.map((order: any) => ({
                        id: `sale-${order.id}`,
                        amount: order.total,
                        description: `Venta #${order.order_number}`,
                        type: 'income' as const,
                        category_id: 'sales',
                        category: { 
                            id: 'sales', 
                            name: 'Ventas POS', 
                            is_active: true,
                            type: 'income' as const,
                            created_at: order.created_at
                        },
                        payment_method: (order.payment_method || 'cash') as any,
                        transaction_date: order.created_at.split('T')[0],
                        store_id: storeId,
                        created_at: order.created_at
                    }))
                    unifiedTransactions = [...unifiedTransactions, ...salesAsTransactions]
                }
            }

            // Sort by date descending
            unifiedTransactions.sort((a, b) => new Date(b.transaction_date).getTime() - new Date(a.transaction_date).getTime())

            setTransactions(unifiedTransactions)
            setCategories(catData)
            setStats(financialStats)
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
                payment_method: 'cash',
                transaction_date: getMexicoDayString()
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

    const totalIncome = stats.income
    const totalExpenses = stats.expenses
    const balance = stats.balance

    // Pagination Logic
    const totalPages = Math.ceil(filteredTransactions.length / itemsPerPage)
    const startIndex = (currentPage - 1) * itemsPerPage
    const paginatedTransactions = filteredTransactions.slice(startIndex, startIndex + itemsPerPage)

    const PaymentMethodIcon = ({ method }: { method: string }) => {
        switch (method) {
            case 'card': return <CreditCard className="h-3 w-3" />
            case 'transfer': return <Banknote className="h-3 w-3" />
            default: return <Wallet className="h-3 w-3" />
        }
    }

    return (
        <div className="space-y-8 animate-in fade-in duration-700">
            {/* Header */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h1 className="text-4xl font-black text-slate-900 dark:text-white tracking-tighter">Transacciones</h1>
                    <div className="flex items-center gap-2 text-muted-foreground mt-1">
                        <ArrowLeftRight className="h-4 w-4" />
                        <span className="text-sm font-medium">Historial completo de movimientos</span>
                    </div>
                </div>
                <div className="flex gap-3">
                    <PDFDownloadLink
                        document={
                            <TransactionsReportDocument
                                transactions={filteredTransactions}
                                totalIncome={totalIncome}
                                totalExpenses={totalExpenses}
                                period={format(new Date(), 'MMMM yyyy', { locale: es })}
                            />
                        }
                        fileName={`Transacciones_${format(new Date(), 'yyyy-MM-dd')}.pdf`}
                    >
                        {({ loading: pdfLoading }) => (
                            <Button variant="outline" className="rounded-xl font-bold border-2" disabled={pdfLoading}>
                                {pdfLoading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <FileText className="h-4 w-4 mr-2" />}
                                Exportar PDF
                            </Button>
                        )}
                    </PDFDownloadLink>
                    <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                        <DialogTrigger asChild>
                            <Button className="rounded-xl font-bold bg-primary hover:bg-primary/90 text-white shadow-lg shadow-primary/20">
                                <Plus className="mr-2 h-4 w-4" /> Nueva Transacción
                            </Button>
                        </DialogTrigger>
                        <DialogContent className="rounded-3xl border-none shadow-2xl sm:max-w-[500px]">
                            <DialogHeader>
                                <DialogTitle className="text-2xl font-black tracking-tight">Registrar Movimiento</DialogTitle>
                                <DialogDescription className="font-medium">Completa los detalles de la transacción financiera.</DialogDescription>
                            </DialogHeader>
                            <form onSubmit={handleSubmit} className="space-y-5 mt-4">
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <Label className="font-bold text-xs uppercase tracking-widest opacity-70">Tipo</Label>
                                        <Select
                                            value={formData.type}
                                            onValueChange={(v: 'income' | 'expense') => setFormData({ ...formData, type: v })}
                                        >
                                            <SelectTrigger className="rounded-xl border-2"><SelectValue /></SelectTrigger>
                                            <SelectContent className="rounded-xl">
                                                <SelectItem value="income">Ingreso</SelectItem>
                                                <SelectItem value="expense">Gasto</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>
                                    <div className="space-y-2">
                                        <Label className="font-bold text-xs uppercase tracking-widest opacity-70">Método de Pago</Label>
                                        <Select
                                            value={formData.payment_method}
                                            onValueChange={(v: any) => setFormData({ ...formData, payment_method: v })}
                                        >
                                            <SelectTrigger className="rounded-xl border-2"><SelectValue /></SelectTrigger>
                                            <SelectContent className="rounded-xl">
                                                <SelectItem value="cash">Efectivo</SelectItem>
                                                <SelectItem value="transfer">Transferencia</SelectItem>
                                                <SelectItem value="card">Tarjeta</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <Label className="font-bold text-xs uppercase tracking-widest opacity-70">Monto ($)</Label>
                                        <Input
                                            type="number"
                                            step="0.01"
                                            required
                                            className="rounded-xl border-2 font-bold text-lg"
                                            value={formData.amount || ''}
                                            onChange={e => setFormData({ ...formData, amount: parseFloat(e.target.value) })}
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label className="font-bold text-xs uppercase tracking-widest opacity-70">Fecha</Label>
                                        <Input
                                            type="date"
                                            required
                                            className="rounded-xl border-2"
                                            value={formData.transaction_date}
                                            onChange={e => setFormData({ ...formData, transaction_date: e.target.value })}
                                        />
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <Label className="font-bold text-xs uppercase tracking-widest opacity-70">Categoría</Label>
                                    <Select
                                        value={formData.category_id}
                                        onValueChange={v => setFormData({ ...formData, category_id: v })}
                                    >
                                        <SelectTrigger className="rounded-xl border-2"><SelectValue placeholder="Seleccionar categoría" /></SelectTrigger>
                                        <SelectContent className="rounded-xl">
                                            {categories.map(cat => (
                                                <SelectItem key={cat.id} value={cat.id}>
                                                    {cat.name}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="space-y-2">
                                    <Label className="font-bold text-xs uppercase tracking-widest opacity-70">Descripción</Label>
                                    <Input
                                        required
                                        className="rounded-xl border-2"
                                        value={formData.description}
                                        onChange={e => setFormData({ ...formData, description: e.target.value })}
                                        placeholder="Ej: Pago de renta, Insumos carne..."
                                    />
                                </div>
                                <DialogFooter className="mt-6">
                                    <Button type="submit" className="w-full rounded-xl font-bold h-12 text-lg shadow-lg" disabled={loading}>
                                        {loading ? <Loader2 className="mr-2 h-5 w-5 animate-spin" /> : null}
                                        Guardar Transacción
                                    </Button>
                                </DialogFooter>
                            </form>
                        </DialogContent>
                    </Dialog>
                </div>
            </div>

            {/* Quick Summary Section */}
            <div className="grid gap-6 md:grid-cols-3">
                <Card className="border-none rounded-3xl shadow-soft bg-gradient-to-br from-emerald-500 to-emerald-600 text-white overflow-hidden group">
                    <CardContent className="p-6 relative">
                        <div className="flex justify-between items-start">
                            <div>
                                <p className="text-xs font-bold uppercase tracking-widest opacity-80">Total Ingresos</p>
                                <p className="text-3xl font-black mt-1">${formatNumber(totalIncome)}</p>
                            </div>
                            <div className="p-3 bg-white/20 rounded-2xl">
                                <TrendingUp className="h-6 w-6" />
                            </div>
                        </div>
                        <TrendingUp className="absolute -right-4 -bottom-4 h-24 w-24 opacity-10 group-hover:scale-110 transition-transform duration-500" />
                    </CardContent>
                </Card>

                <Card className="border-none rounded-3xl shadow-soft bg-gradient-to-br from-rose-500 to-rose-600 text-white overflow-hidden group">
                    <CardContent className="p-6 relative">
                        <div className="flex justify-between items-start">
                            <div>
                                <p className="text-xs font-bold uppercase tracking-widest opacity-80">Total Gastos</p>
                                <p className="text-3xl font-black mt-1">${formatNumber(totalExpenses)}</p>
                            </div>
                            <div className="p-3 bg-white/20 rounded-2xl">
                                <TrendingDown className="h-6 w-6" />
                            </div>
                        </div>
                        <TrendingDown className="absolute -right-4 -bottom-4 h-24 w-24 opacity-10 group-hover:scale-110 transition-transform duration-500" />
                    </CardContent>
                </Card>

                <Card className={cn(
                    "border-none rounded-3xl shadow-soft overflow-hidden group text-white transition-all duration-500",
                    totalIncome - totalExpenses >= 0 ? "bg-gradient-to-br from-blue-500 to-blue-600" : "bg-gradient-to-br from-orange-500 to-orange-600"
                )}>
                    <CardContent className="p-6 relative">
                        <div className="flex justify-between items-start">
                            <div>
                                <p className="text-xs font-bold uppercase tracking-widest opacity-80">Balance Neto</p>
                                <p className="text-3xl font-black mt-1">${formatNumber(balance)}</p>
                            </div>
                            <div className="p-3 bg-white/20 rounded-2xl">
                                <ArrowLeftRight className="h-6 w-6" />
                            </div>
                        </div>
                        <ArrowLeftRight className="absolute -right-4 -bottom-4 h-24 w-24 opacity-10 group-hover:scale-110 transition-transform duration-500" />
                    </CardContent>
                </Card>
            </div>

            {/* Filters Bar */}
            <Card className="border-none rounded-2xl shadow-soft bg-white dark:bg-slate-900">
                <CardContent className="p-4 flex flex-col md:flex-row gap-4">
                    <div className="relative flex-1">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input
                            placeholder="Buscar descripción o categoría..."
                            className="pl-10 rounded-xl border-2 h-11 bg-slate-50 dark:bg-slate-800"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                    <div className="flex items-center gap-3">
                        <div className="flex items-center gap-2 px-3 h-11 rounded-xl bg-slate-50 dark:bg-slate-800 border-2">
                            <Filter className="h-4 w-4 text-muted-foreground" />
                            <span className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Filtrar:</span>
                        </div>
                        <Select value={typeFilter} onValueChange={(v: any) => setTypeFilter(v)}>
                            <SelectTrigger className="w-[150px] rounded-xl border-2 h-11 bg-slate-50 dark:bg-slate-800 font-bold">
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent className="rounded-xl">
                                <SelectItem value="all">Todos</SelectItem>
                                <SelectItem value="income">Ingresos</SelectItem>
                                <SelectItem value="expense">Gastos</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                </CardContent>
            </Card>

            {/* Transactions Table */}
            <Card className="border-none rounded-3xl shadow-soft bg-white dark:bg-slate-900 overflow-hidden">
                <CardContent className="p-0">
                    <Table>
                        <TableHeader>
                            <TableRow className="bg-slate-50/50 dark:bg-slate-800/50 hover:bg-transparent border-b border-slate-100 dark:border-slate-800">
                                <TableHead className="font-bold text-xs uppercase tracking-widest py-4 pl-6">Fecha</TableHead>
                                <TableHead className="font-bold text-xs uppercase tracking-widest py-4">Descripción</TableHead>
                                <TableHead className="font-bold text-xs uppercase tracking-widest py-4">Categoría</TableHead>
                                <TableHead className="font-bold text-xs uppercase tracking-widest py-4">Método</TableHead>
                                <TableHead className="font-bold text-xs uppercase tracking-widest py-4">Tipo</TableHead>
                                <TableHead className="font-bold text-xs uppercase tracking-widest py-4 text-right pr-6">Monto</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {loading ? (
                                <TableRow>
                                    <TableCell colSpan={6} className="text-center h-48">
                                        <Loader2 className="h-10 w-10 animate-spin mx-auto text-primary opacity-50" />
                                    </TableCell>
                                </TableRow>
                            ) : filteredTransactions.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={6} className="text-center h-48">
                                        <div className="flex flex-col items-center justify-center space-y-2 text-muted-foreground">
                                            <ArrowLeftRight className="h-12 w-12 opacity-20" />
                                            <p className="font-medium">No se encontraron movimientos financieros</p>
                                        </div>
                                    </TableCell>
                                </TableRow>
                            ) : (
                                paginatedTransactions.map(trans => (
                                    <TableRow key={trans.id} className="group hover:bg-slate-50 dark:hover:bg-slate-800/50 border-b border-slate-50 dark:border-slate-800 transition-colors">
                                        <TableCell className="pl-6 py-4 font-bold text-slate-500 dark:text-slate-400">
                                            <div className="flex items-center gap-2">
                                                <Calendar className="h-3 w-3 opacity-50" />
                                                {format(parseMexicoDateToLocal(trans.transaction_date), 'dd MMM, yyyy', { locale: es })}
                                            </div>
                                        </TableCell>
                                        <TableCell className="font-black text-slate-800 dark:text-slate-100">{trans.description}</TableCell>
                                        <TableCell>
                                            <Badge variant="outline" className="rounded-lg bg-slate-50 dark:bg-slate-800 border-none font-bold text-[10px] uppercase px-2">
                                                {trans.category?.name || 'General'}
                                            </Badge>
                                        </TableCell>
                                        <TableCell>
                                            <div className="flex items-center gap-1.5 text-xs font-bold text-slate-500 capitalize">
                                                <PaymentMethodIcon method={trans.payment_method || 'cash'} />
                                                {trans.payment_method === 'cash' ? 'Efectivo' :
                                                    trans.payment_method === 'card' ? 'Tarjeta' :
                                                        trans.payment_method === 'transfer' ? 'Transferencia' :
                                                            trans.payment_method || '-'}
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            {trans.type === 'income' ? (
                                                <div className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-emerald-100 text-emerald-600 text-[10px] font-black uppercase">
                                                    <TrendingUp className="h-3 w-3" /> Ingreso
                                                </div>
                                            ) : (
                                                <div className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-rose-100 text-rose-600 text-[10px] font-black uppercase">
                                                    <TrendingDown className="h-3 w-3" /> Gasto
                                                </div>
                                            )}
                                        </TableCell>
                                        <TableCell className={cn(
                                            "pr-6 text-right font-black text-lg tracking-tight",
                                            trans.type === 'income' ? 'text-emerald-600' : 'text-rose-600'
                                        )}>
                                            {trans.type === 'income' ? '+' : '-'}${formatNumber(trans.amount)}
                                        </TableCell>
                                    </TableRow>
                                ))
                            )}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>

            {/* Pagination Controls */}
            {totalPages > 1 && (
                <div className="flex justify-center items-center gap-2 mt-6 pb-10">
                    <Button
                        variant="outline"
                        size="sm"
                        className="rounded-xl border-2 font-bold px-4"
                        onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                        disabled={currentPage === 1}
                    >
                        Anterior
                    </Button>
                    
                    <div className="flex items-center gap-1 mx-4">
                        {[...Array(totalPages)].map((_, i) => {
                            const pageNum = i + 1;
                            // Show only nearby pages if there are too many
                            if (
                                pageNum === 1 || 
                                pageNum === totalPages || 
                                (pageNum >= currentPage - 2 && pageNum <= currentPage + 2)
                            ) {
                                return (
                                    <Button
                                        key={pageNum}
                                        variant={currentPage === pageNum ? "default" : "outline"}
                                        size="sm"
                                        className={cn(
                                            "w-10 h-10 rounded-xl font-bold border-2 transition-all duration-200",
                                            currentPage === pageNum 
                                                ? "bg-primary text-white border-primary shadow-lg shadow-primary/20 scale-110" 
                                                : "hover:bg-slate-50 dark:hover:bg-slate-800"
                                        )}
                                        onClick={() => setCurrentPage(pageNum)}
                                    >
                                        {pageNum}
                                    </Button>
                                );
                            } else if (
                                pageNum === currentPage - 3 || 
                                pageNum === currentPage + 3
                            ) {
                                return <span key={pageNum} className="px-2 opacity-50 font-black">...</span>;
                            }
                            return null;
                        })}
                    </div>

                    <Button
                        variant="outline"
                        size="sm"
                        className="rounded-xl border-2 font-bold px-4"
                        onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                        disabled={currentPage === totalPages}
                    >
                        Siguiente
                    </Button>
                </div>
            )}
        </div>
    )
}
