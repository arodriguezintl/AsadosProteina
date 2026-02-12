import { useEffect, useState } from 'react'
import { FinanceService } from '@/services/finance.service'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { TrendingDown, TrendingUp, Wallet, DollarSign, ShoppingCart, Users as UsersIcon, ArrowUpRight, ArrowDownRight } from 'lucide-react'
import { Loader2 } from 'lucide-react'
import { useAuthStore } from '@/store/auth.store'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts'
import { Button } from '@/components/ui/button'
import { useNavigate } from 'react-router-dom'

const COLORS = ['#10b981', '#ef4444', '#3b82f6', '#f59e0b', '#8b5cf6']

export default function FinanceDashboard() {
    const [loading, setLoading] = useState(true)
    const [summary, setSummary] = useState({
        income: 0,
        expenses: 0,
        balance: 0,
        salesIncome: 0,
        transactionIncome: 0,
        payrollExpenses: 0,
        otherExpenses: 0
    })
    const [monthlyData, setMonthlyData] = useState<any[]>([])
    const [expensesByCategory, setExpensesByCategory] = useState<any[]>([])

    const { storeId } = useAuthStore()
    const navigate = useNavigate()

    useEffect(() => {
        if (storeId) {
            loadData()
        }
    }, [storeId])

    const loadData = async () => {
        try {
            if (!storeId) return

            // Get financial stats
            const stats = await FinanceService.getFinancialStats(storeId)

            // Get detailed breakdown
            const breakdown = await FinanceService.getFinancialBreakdown(storeId)

            setSummary({
                income: stats.income,
                expenses: stats.expenses,
                balance: stats.balance,
                salesIncome: breakdown.salesIncome || 0,
                transactionIncome: breakdown.transactionIncome || 0,
                payrollExpenses: breakdown.payrollExpenses || 0,
                otherExpenses: breakdown.otherExpenses || 0
            })

            // Get monthly trends (last 6 months)
            const trends = await FinanceService.getMonthlyTrends(storeId, 6)
            setMonthlyData(trends)

            // Get expenses by category
            const categoryExpenses = await FinanceService.getExpensesByCategory(storeId)
            setExpensesByCategory(categoryExpenses)

        } catch (error) {
            console.error('Error loading finance data:', error)
        } finally {
            setLoading(false)
        }
    }

    if (loading) {
        return (
            <div className="flex justify-center p-8">
                <Loader2 className="h-8 w-8 animate-spin" />
            </div>
        )
    }

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-3xl font-black text-[#0B2B26] tracking-tight">Dashboard Financiero</h1>
                    <p className="text-muted-foreground">Resumen de ingresos, gastos y balance general</p>
                </div>
                <div className="flex gap-2">
                    <Button variant="outline" onClick={() => navigate('/finance/transactions')}>
                        Ver Transacciones
                    </Button>
                </div>
            </div>

            {/* Summary Cards */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <Card className="border-l-4 border-l-green-500">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">
                            Ingresos Totales
                        </CardTitle>
                        <TrendingUp className="h-4 w-4 text-green-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-green-600">
                            ${summary.income.toFixed(2)}
                        </div>
                        <div className="text-xs text-muted-foreground mt-1">
                            <div className="flex items-center gap-1">
                                <ShoppingCart className="h-3 w-3" />
                                Ventas: ${summary.salesIncome.toFixed(2)}
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <Card className="border-l-4 border-l-red-500">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">
                            Gastos Totales
                        </CardTitle>
                        <TrendingDown className="h-4 w-4 text-red-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-red-600">
                            ${summary.expenses.toFixed(2)}
                        </div>
                        <div className="text-xs text-muted-foreground mt-1">
                            <div className="flex items-center gap-1">
                                <UsersIcon className="h-3 w-3" />
                                Nómina: ${summary.payrollExpenses.toFixed(2)}
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <Card className="border-l-4 border-l-blue-500">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">
                            Balance Neto
                        </CardTitle>
                        <Wallet className="h-4 w-4 text-blue-500" />
                    </CardHeader>
                    <CardContent>
                        <div className={`text-2xl font-bold ${summary.balance >= 0 ? 'text-blue-600' : 'text-red-600'}`}>
                            ${summary.balance.toFixed(2)}
                        </div>
                        <div className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
                            {summary.balance >= 0 ? (
                                <>
                                    <ArrowUpRight className="h-3 w-3 text-green-500" />
                                    <span className="text-green-600">Positivo</span>
                                </>
                            ) : (
                                <>
                                    <ArrowDownRight className="h-3 w-3 text-red-500" />
                                    <span className="text-red-600">Negativo</span>
                                </>
                            )}
                        </div>
                    </CardContent>
                </Card>

                <Card className="border-l-4 border-l-purple-500">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">
                            Margen de Ganancia
                        </CardTitle>
                        <DollarSign className="h-4 w-4 text-purple-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-purple-600">
                            {summary.income > 0 ? ((summary.balance / summary.income) * 100).toFixed(1) : '0.0'}%
                        </div>
                        <div className="text-xs text-muted-foreground mt-1">
                            Rentabilidad del negocio
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Charts */}
            <div className="grid gap-4 md:grid-cols-2">
                {/* Monthly Trends */}
                <Card>
                    <CardHeader>
                        <CardTitle>Tendencia Mensual</CardTitle>
                        <CardDescription>Ingresos vs Gastos (últimos 6 meses)</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <ResponsiveContainer width="100%" height={300}>
                            <BarChart data={monthlyData}>
                                <CartesianGrid strokeDasharray="3 3" />
                                <XAxis dataKey="month" />
                                <YAxis />
                                <Tooltip formatter={(value: any) => `$${Number(value).toFixed(2)}`} />
                                <Legend />
                                <Bar dataKey="income" fill="#10b981" name="Ingresos" />
                                <Bar dataKey="expenses" fill="#ef4444" name="Gastos" />
                            </BarChart>
                        </ResponsiveContainer>
                    </CardContent>
                </Card>

                {/* Expenses by Category */}
                <Card>
                    <CardHeader>
                        <CardTitle>Gastos por Categoría</CardTitle>
                        <CardDescription>Distribución de gastos</CardDescription>
                    </CardHeader>
                    <CardContent>
                        {expensesByCategory.length > 0 ? (
                            <ResponsiveContainer width="100%" height={300}>
                                <PieChart>
                                    <Pie
                                        data={expensesByCategory}
                                        cx="50%"
                                        cy="50%"
                                        labelLine={false}
                                        label={({ name, percent }: { name?: string, percent?: number }) => `${name || ''}: ${((percent || 0) * 100).toFixed(0)}%`}
                                        outerRadius={80}
                                        fill="#8884d8"
                                        dataKey="value"
                                    >
                                        {expensesByCategory.map((_entry, index) => (
                                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                        ))}
                                    </Pie>
                                    <Tooltip formatter={(value: any) => `$${Number(value).toFixed(2)}`} />
                                </PieChart>
                            </ResponsiveContainer>
                        ) : (
                            <div className="flex items-center justify-center h-[300px] text-muted-foreground">
                                No hay datos de gastos por categoría
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>

            {/* Quick Stats */}
            <div className="grid gap-4 md:grid-cols-3">
                <Card>
                    <CardHeader>
                        <CardTitle className="text-sm font-medium">Ventas del Mes</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">${summary.salesIncome.toFixed(2)}</div>
                        <p className="text-xs text-muted-foreground">Ingresos por ventas</p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle className="text-sm font-medium">Nómina del Mes</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-orange-600">${summary.payrollExpenses.toFixed(2)}</div>
                        <p className="text-xs text-muted-foreground">Gastos en personal</p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle className="text-sm font-medium">Otros Gastos</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-red-600">${summary.otherExpenses.toFixed(2)}</div>
                        <p className="text-xs text-muted-foreground">Gastos operativos</p>
                    </CardContent>
                </Card>
            </div>
        </div>
    )
}
