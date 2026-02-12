import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { FinanceService } from '@/services/finance.service'
import type { Transaction } from '@/types/finance'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Loader2, Plus, Search } from 'lucide-react'
import { format } from 'date-fns'

import { useAuthStore } from '@/store/auth.store'

export default function ExpensesPage() {
    const [transactions, setTransactions] = useState<Transaction[]>([])
    const [loading, setLoading] = useState(true)
    const [searchTerm, setSearchTerm] = useState('')
    const { storeId } = useAuthStore()

    useEffect(() => {
        if (storeId) {
            loadTransactions()
        }
    }, [storeId])

    const loadTransactions = async () => {
        try {
            if (!storeId) return
            // Default load expenses only? Or all? Plan said "Expenses Tracking", so maybe only expenses.
            // But having a view of everything is good. Let's filter in UI or service.
            // Let's load expenses for now.
            const data = await FinanceService.getTransactions(storeId, { type: 'expense' })
            setTransactions(data)
        } catch (error) {
            console.error('Error loading transactions:', error)
        } finally {
            setLoading(false)
        }
    }


    const filteredTransactions = transactions.filter(t =>
        t.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        t.category?.name.toLowerCase().includes(searchTerm.toLowerCase())
    )

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold">Gastos</h1>
                    <p className="text-muted-foreground">Registro y control de gastos</p>
                </div>
                <Button asChild>
                    <Link to="/finance/expenses/new">
                        <Plus className="mr-2 h-4 w-4" /> Registrar Gasto
                    </Link>
                </Button>
            </div>

            <div className="flex items-center space-x-2">
                <div className="relative flex-1 max-w-sm">
                    <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                        placeholder="Buscar gastos..."
                        className="pl-8"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
            </div>

            <div className="border rounded-md">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Fecha</TableHead>
                            <TableHead>Categoría</TableHead>
                            <TableHead>Descripción</TableHead>
                            <TableHead className="text-right">Monto</TableHead>
                            <TableHead>Método</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {loading ? (
                            <TableRow>
                                <TableCell colSpan={5} className="h-24 text-center">
                                    <div className="flex justify-center">
                                        <Loader2 className="h-6 w-6 animate-spin" />
                                    </div>
                                </TableCell>
                            </TableRow>
                        ) : filteredTransactions.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={5} className="h-24 text-center">
                                    No se encontraron gastos.
                                </TableCell>
                            </TableRow>
                        ) : (
                            filteredTransactions.map((transaction) => (
                                <TableRow key={transaction.id}>
                                    <TableCell>{format(new Date(transaction.transaction_date), 'dd/MM/yyyy')}</TableCell>
                                    <TableCell>
                                        <span className="inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 border-transparent bg-secondary text-secondary-foreground hover:bg-secondary/80">
                                            {transaction.category?.name || 'Sin categoría'}
                                        </span>
                                    </TableCell>
                                    <TableCell>{transaction.description}</TableCell>
                                    <TableCell className="text-right font-medium text-red-600">
                                        -${transaction.amount.toFixed(2)}
                                    </TableCell>
                                    <TableCell className="capitalize">
                                        {transaction.payment_method === 'cash' ? 'Efectivo' :
                                            transaction.payment_method === 'card' ? 'Tarjeta' :
                                                transaction.payment_method === 'transfer' ? 'Transferencia' :
                                                    transaction.payment_method}
                                    </TableCell>
                                </TableRow>
                            ))
                        )}
                    </TableBody>
                </Table>
            </div>
        </div>
    )
}
