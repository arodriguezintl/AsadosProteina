import { useEffect, useState } from 'react'
import { FinanceService } from '@/services/finance.service'
import { Card, CardContent } from '@/components/ui/card'
import { TrendingDown, TrendingUp, Wallet, DollarSign, ArrowUpRight, ArrowDownRight, Activity, Calendar } from 'lucide-react'
import { Loader2 } from 'lucide-react'
import { useAuthStore } from '@/store/auth.store'
import { XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell, AreaChart, Area, BarChart, Bar } from 'recharts'
import { Button } from '@/components/ui/button'
import { useNavigate } from 'react-router-dom'
import { cn } from '@/lib/utils'
import { formatNumber, formatPercent } from '@/utils/format'
import { subDays } from 'date-fns'
import { getMexicoDayString } from '@/utils/date'

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
    const [selectedDays, setSelectedDays] = useState<7 | 30 | 90>(30)

    const { storeId } = useAuthStore()
    const navigate = useNavigate()

    useEffect(() => {
        if (storeId) {
            loadData()
        }
    }, [storeId, selectedDays])

    const loadData = async () => {
        try {
            if (!storeId) return

            const start = getMexicoDayString(subDays(new Date(), selectedDays))
            const end = getMexicoDayString(new Date())

            const [stats, breakdown, trends, categoryExpenses] = await Promise.all([
                FinanceService.getFinancialStats(storeId, start, end),
                FinanceService.getFinancialBreakdown(storeId), // Summary breakdown stays global or we could filter it too
                FinanceService.getTrends(storeId, selectedDays),
                FinanceService.getExpensesByCategory(storeId, start, end)
            ])

            setSummary({
                income: stats.income,
                expenses: stats.expenses,
                balance: stats.balance,
                salesIncome: breakdown.salesIncome || 0,
                transactionIncome: breakdown.transactionIncome || 0,
                payrollExpenses: breakdown.payrollExpenses || 0,
                otherExpenses: breakdown.otherExpenses || 0
            })
            setMonthlyData(trends)
            setExpensesByCategory(categoryExpenses)

        } catch (error) {
            console.error('Error loading finance data:', error)
        } finally {
            setLoading(false)
        }
    }

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[400px] space-y-4">
                <Loader2 className="h-12 w-12 animate-spin text-primary" />
                <p className="text-muted-foreground animate-pulse font-medium">Cargando datos financieros...</p>
            </div>
        )
    }

    const KPICard = ({ title, value, icon: Icon, trend, subtext, colorClass, gradientClass }: any) => (
        <Card className={cn("relative overflow-hidden border-none rounded-3xl shadow-soft group transition-all duration-300 hover:scale-[1.02] hover:shadow-glow", gradientClass)}>
            <CardContent className="p-6 relative z-10">
                <div className="flex justify-between items-start mb-4">
                    <div className={cn("p-3 rounded-2xl", colorClass)}>
                        <Icon className="h-6 w-6" />
                    </div>
                    {trend && (
                        <div className={cn("flex items-center gap-1 text-xs font-bold px-2 py-1 rounded-full",
                            trend > 0 ? "bg-emerald-100 text-emerald-600" : "bg-rose-100 text-rose-600")}>
                            {trend > 0 ? <ArrowUpRight className="h-3 w-3" /> : <ArrowDownRight className="h-3 w-3" />}
                            {formatPercent(Math.abs(trend))}
                        </div>
                    )}
                </div>
                <div>
                    <p className="text-sm font-bold opacity-70 uppercase tracking-wider">{title}</p>
                    <h3 className="text-3xl font-black mt-1 tracking-tighter">${formatNumber(value)}</h3>
                    <p className="text-xs mt-2 opacity-60 font-medium flex items-center gap-1">
                        <Activity className="h-3 w-3" /> {subtext}
                    </p>
                </div>
            </CardContent>
            {/* Decorative background element */}
            <div className="absolute -right-4 -bottom-4 opacity-10 group-hover:scale-110 transition-transform duration-500">
                <Icon className="h-24 w-24" />
            </div>
        </Card>
    )

    return (
        <div className="space-y-8 animate-in fade-in duration-700">
            {/* Header Section */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h1 className="text-4xl font-black text-slate-900 dark:text-white tracking-tighter">Finanzas</h1>
                    <div className="flex items-center gap-2 text-muted-foreground mt-1">
                        <Calendar className="h-4 w-4" />
                        <span className="text-sm font-medium">Resumen financiero consolidado</span>
                    </div>
                </div>
                <div className="flex flex-wrap items-center gap-3">
                    <div className="flex items-center gap-1 bg-muted/30 p-1 rounded-xl border border-slate-200 shadow-sm">
                        {[
                            { id: 7, label: '7d' },
                            { id: 30, label: '30d' },
                            { id: 90, label: '90d' }
                        ].map((pill) => (
                            <Button
                                key={pill.id}
                                variant={selectedDays === pill.id ? 'default' : 'ghost'}
                                size="sm"
                                onClick={() => setSelectedDays(pill.id as any)}
                                className={cn(
                                    "h-8 px-4 rounded-lg font-bold transition-all",
                                    selectedDays === pill.id 
                                        ? "bg-primary text-white shadow-md shadow-primary/20 scale-105" 
                                        : "text-muted-foreground hover:bg-slate-100"
                                )}
                            >
                                {pill.label}
                            </Button>
                        ))}
                    </div>
                    <Button
                        variant="outline"
                        className="rounded-xl font-bold border-2 hover:bg-slate-50 dark:hover:bg-slate-800"
                        onClick={() => navigate('/finance/categories')}
                    >
                        Gestionar Categorías
                    </Button>
                    <Button
                        className="rounded-xl font-bold bg-primary hover:bg-primary/90 text-white shadow-lg shadow-primary/20"
                        onClick={() => navigate('/finance/transactions')}
                    >
                        Ver Transacciones
                    </Button>
                </div>
            </div>

            {/* Main KPI Grid */}
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
                <KPICard
                    title="Ingresos Totales"
                    value={summary.income}
                    icon={TrendingUp}
                    colorClass="bg-emerald-500 text-white"
                    gradientClass="bg-gradient-to-br from-emerald-50 to-white dark:from-emerald-950/20 dark:to-slate-900"
                    subtext={`Ventas: $${formatNumber(summary.salesIncome)}`}
                />
                <KPICard
                    title="Gastos Totales"
                    value={summary.expenses}
                    icon={TrendingDown}
                    colorClass="bg-rose-500 text-white"
                    gradientClass="bg-gradient-to-br from-rose-50 to-white dark:from-rose-950/20 dark:to-slate-900"
                    subtext={`Nómina: $${formatNumber(summary.payrollExpenses)}`}
                />
                <KPICard
                    title="Balance Neto"
                    value={summary.balance}
                    icon={Wallet}
                    colorClass={summary.balance >= 0 ? "bg-blue-500 text-white" : "bg-orange-500 text-white"}
                    gradientClass={summary.balance >= 0
                        ? "bg-gradient-to-br from-blue-50 to-white dark:from-blue-950/20 dark:to-slate-900"
                        : "bg-gradient-to-br from-orange-50 to-white dark:from-orange-950/20 dark:to-slate-900"}
                    subtext={summary.balance >= 0 ? "Estado Saludable" : "Revisar Gastos"}
                />
                <KPICard
                    title="Margen de Utilidad"
                    value={summary.income > 0 ? (summary.balance / summary.income) * 100 : 0}
                    icon={DollarSign}
                    colorClass="bg-amber-500 text-white"
                    gradientClass="bg-gradient-to-br from-amber-50 to-white dark:from-amber-950/20 dark:to-slate-900"
                    subtext="Eficiencia Operativa"
                />
            </div>

            {/* Charts Section */}
            <div className="grid gap-6 lg:grid-cols-3">
                {/* Monthly Trends - Area Chart */}
                <Card className="lg:col-span-2 border-none rounded-3xl shadow-soft bg-white dark:bg-slate-900 overflow-hidden">
                    <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center">
                        <div>
                            <h3 className="font-black text-xl tracking-tight">Tendencia Mensual</h3>
                            <p className="text-xs text-muted-foreground font-medium uppercase tracking-widest">Ingresos vs Gastos</p>
                        </div>
                        <div className="flex gap-4">
                            <div className="flex items-center gap-2">
                                <div className="h-3 w-3 rounded-full bg-emerald-500" />
                                <span className="text-xs font-bold">Ingresos</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <div className="h-3 w-3 rounded-full bg-rose-500" />
                                <span className="text-xs font-bold">Gastos</span>
                            </div>
                        </div>
                    </div>
                    <CardContent className="p-6">
                        <div className="h-[350px] w-full">
                            <ResponsiveContainer width="100%" height="100%">
                                <AreaChart data={monthlyData}>
                                    <defs>
                                        <linearGradient id="colorIncome" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
                                            <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                                        </linearGradient>
                                        <linearGradient id="colorExpense" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor="#ef4444" stopOpacity={0.3} />
                                            <stop offset="95%" stopColor="#ef4444" stopOpacity={0} />
                                        </linearGradient>
                                    </defs>
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                                    <XAxis
                                        dataKey="label"
                                        axisLine={false}
                                        tickLine={false}
                                        tick={{ fill: '#64748b', fontSize: 12, fontWeight: 600 }}
                                        dy={10}
                                    />
                                    <YAxis
                                        axisLine={false}
                                        tickLine={false}
                                        tick={{ fill: '#64748b', fontSize: 12, fontWeight: 600 }}
                                        tickFormatter={(val) => `$${val / 1000}k`}
                                    />
                                    <Tooltip
                                        contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 30px rgba(0,0,0,0.1)' }}
                                        formatter={(value: any) => [`$${formatNumber(Number(value))}`, '']}
                                    />
                                    <Area type="monotone" dataKey="income" stroke="#10b981" strokeWidth={3} fillOpacity={1} fill="url(#colorIncome)" />
                                    <Area type="monotone" dataKey="expenses" stroke="#ef4444" strokeWidth={3} fillOpacity={1} fill="url(#colorExpense)" />
                                </AreaChart>
                            </ResponsiveContainer>
                        </div>
                    </CardContent>
                </Card>

                {/* Expenses by Category - Pie Chart */}
                <Card className="border-none rounded-3xl shadow-soft bg-white dark:bg-slate-900">
                    <div className="p-6 border-b border-slate-100 dark:border-slate-800">
                        <h3 className="font-black text-xl tracking-tight">Distribución</h3>
                        <p className="text-xs text-muted-foreground font-medium uppercase tracking-widest">Gastos por Categoría</p>
                    </div>
                    <CardContent className="p-6">
                        {expensesByCategory.length > 0 ? (
                            <div className="h-[350px] w-full">
                                <ResponsiveContainer width="100%" height="100%">
                                    <BarChart 
                                        data={expensesByCategory} 
                                        layout="vertical" 
                                        margin={{ left: -20, right: 30, top: 10, bottom: 10 }}
                                    >
                                        <XAxis type="number" hide />
                                        <YAxis 
                                            dataKey="name" 
                                            type="category" 
                                            width={120} 
                                            axisLine={false} 
                                            tickLine={false} 
                                            tick={{ fill: '#64748b', fontSize: 12, fontWeight: 700 }} 
                                        />
                                        <Tooltip
                                            cursor={{ fill: 'rgba(0,0,0,0.02)' }}
                                            contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 30px rgba(0,0,0,0.1)' }}
                                            formatter={(value: any) => [`$${formatNumber(Number(value))}`, 'Monto']}
                                        />
                                        <Bar 
                                            dataKey="value" 
                                            radius={[0, 10, 10, 0]}
                                            barSize={24}
                                        >
                                            {expensesByCategory.map((_entry, index) => (
                                                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                            ))}
                                        </Bar>
                                    </BarChart>
                                </ResponsiveContainer>
                            </div>
                        ) : (
                            <div className="flex flex-col items-center justify-center h-[350px] text-muted-foreground space-y-2">
                                <Activity className="h-12 w-12 opacity-20" />
                                <p className="text-sm font-medium">No hay datos de gastos</p>
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>

            {/* Quick Breakdown / Insights */}
            <div className="grid gap-6 md:grid-cols-3">
                {[
                    { label: 'Ventas del Mes', value: summary.salesIncome, sub: 'Ingresos directos', color: 'text-emerald-600', bg: 'bg-emerald-50' },
                    { label: 'Nómina', value: summary.payrollExpenses, sub: 'Costos de personal', color: 'text-primary', bg: 'bg-primary/10' },
                    { label: 'Operativos', value: summary.otherExpenses, sub: 'Mantenimiento y servicios', color: 'text-rose-600', bg: 'bg-rose-50' }
                ].map((item, idx) => (
                    <Card key={idx} className="border-none rounded-2xl shadow-soft bg-white dark:bg-slate-900 transition-all hover:bg-slate-50 dark:hover:bg-slate-800">
                        <CardContent className="p-5 flex items-center gap-4">
                            <div className={cn("p-3 rounded-xl", item.bg, item.color)}>
                                <Activity className="h-5 w-5" />
                            </div>
                            <div>
                                <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider">{item.label}</p>
                                <p className={cn("text-xl font-black", item.color)}>${formatNumber(item.value)}</p>
                                <p className="text-[10px] text-muted-foreground font-medium">{item.sub}</p>
                            </div>
                        </CardContent>
                    </Card>
                ))}
            </div>
        </div>
    )
}
