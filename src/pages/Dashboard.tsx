import { useEffect, useState } from 'react'
import { cn } from '@/lib/utils'
import { Card, CardContent } from '@/components/ui/card'
import { FinanceService } from '@/services/finance.service'
import { OrderService } from '@/services/order.service'
import { ReportService } from '@/services/report.service'
import { CustomerService } from '@/services/customer.service'
import { useAuthStore } from '@/store/auth.store'
import { DollarSign, ShoppingBag, TrendingUp, ArrowDownRight, Clock, CheckCircle2 } from 'lucide-react'
import { Area, AreaChart, ResponsiveContainer, XAxis, YAxis, Tooltip, CartesianGrid } from 'recharts'
import { formatDistanceToNow } from 'date-fns'
import { es } from 'date-fns/locale'
import { formatNumber } from '@/utils/format'

import { Activity } from 'lucide-react'

const KPICard = ({ title, value, icon: Icon, subtext, colorClass, gradientClass, prefix = "" }: any) => (
    <Card className={cn("relative overflow-hidden border-none rounded-3xl shadow-soft group transition-all duration-300 hover:scale-[1.02] hover:shadow-glow", gradientClass)}>
        <CardContent className="p-6 relative z-10">
            <div className="flex justify-between items-start mb-4">
                <div className={cn("p-3 rounded-2xl", colorClass)}>
                    <Icon className="h-6 w-6" />
                </div>
            </div>
            <div>
                <p className="text-[10px] font-bold opacity-70 uppercase tracking-widest">{title}</p>
                <h3 className="text-3xl font-black mt-1 tracking-tighter">{prefix}{formatNumber(value)}</h3>
                <p className="text-[10px] mt-2 opacity-60 font-bold flex items-center gap-1">
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

export default function Dashboard() {
    const { storeId, loading: authLoading } = useAuthStore()
    const [stats, setStats] = useState({
        dailyRevenue: 0,
        activeOrders: 0,
        newCustomers: 0,
        avgTicket: 0
    })
    const [recentActivity, setRecentActivity] = useState<any[]>([])
    const [weeklyStats, setWeeklyStats] = useState<any[]>([])
    const [selectedPeriod, setSelectedPeriod] = useState<number>(7)
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        if (storeId) {
            loadDashboardData()
        } else if (!authLoading) {
            setLoading(false)
        }
    }, [storeId, authLoading, selectedPeriod])

    const loadDashboardData = async () => {
        try {
            const today = new Date()
            const todayStart = new Date(today.getFullYear(), today.getMonth(), today.getDate(), 0, 0, 0)
            const todayEnd = new Date(today.getFullYear(), today.getMonth(), today.getDate(), 23, 59, 59, 999)

            // Parallel data fetching
            const [todaysActivity, activeOrdersList, recentOrders, recentTransactions, newCustomersCount, trendData] = await Promise.all([
                ReportService.getSalesReport(storeId!, todayStart.toISOString(), todayEnd.toISOString()),
                OrderService.getOrders(['pending', 'preparing', 'ready', 'in_delivery'], undefined, storeId!),
                OrderService.getOrders(undefined, 5, storeId!),
                FinanceService.getTransactions(storeId!, { limit: 5 }),
                CustomerService.getNewCustomersCount(todayStart.toISOString(), todayEnd.toISOString(), storeId!),
                ReportService.getSalesTrends(storeId!, selectedPeriod)
            ])

            setStats({
                dailyRevenue: todaysActivity.totalSales,
                activeOrders: activeOrdersList.length,
                newCustomers: newCustomersCount,
                avgTicket: todaysActivity.avgTicket
            })

            setWeeklyStats(trendData)

            // Real Activity
            const activity = [
                ...recentOrders.map((o: any) => ({
                    id: o.order_number || 'Pedido #' + o.id.slice(0, 4),
                    time: formatDistanceToNow(new Date(o.created_at), { addSuffix: true, locale: es }),
                    date: new Date(o.created_at),
                    amount: Number(o.total),
                    type: 'income'
                })),
                ...recentTransactions.map((t: any) => ({
                    id: t.description || 'Movimiento',
                    time: formatDistanceToNow(new Date(t.transaction_date), { addSuffix: true, locale: es }),
                    date: new Date(t.transaction_date),
                    amount: Number(t.amount),
                    type: t.type
                }))
            ].sort((a, b) => b.date.getTime() - a.date.getTime()).slice(0, 5)

            setRecentActivity(activity)

        } catch (error) {
            console.error("Error loading dashboard:", error)
        } finally {
            setLoading(false)
        }
    }

    if (loading) return <div className="p-8">Cargando dashboard...</div>
    if (!storeId) return <div className="p-8 text-asados-muted">No tienes una tienda asignada. Por favor contacta al administrador.</div>

    return (
        <div className="space-y-8">
            {/* Header Section */}
            <div>
                <h1 className="text-3xl font-bold text-asados-dark">Dashboard</h1>
                <p className="text-asados-muted">Resumen de actividad de hoy</p>
            </div>

            {/* KPI Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <KPICard
                    title="Ventas Hoy"
                    value={stats.dailyRevenue}
                    icon={DollarSign}
                    prefix="$"
                    colorClass="bg-emerald-500 text-white"
                    gradientClass="bg-gradient-to-br from-emerald-50 to-white"
                    subtext="Ingresos del día"
                />

                <KPICard
                    title="Pedidos Activos"
                    value={stats.activeOrders}
                    icon={ShoppingBag}
                    colorClass="bg-blue-500 text-white"
                    gradientClass="bg-gradient-to-br from-blue-50 to-white"
                    subtext="En cocina o entrega"
                />

                <KPICard
                    title="Ticket Promedio"
                    value={stats.avgTicket}
                    icon={TrendingUp}
                    prefix="$"
                    colorClass="bg-purple-500 text-white"
                    gradientClass="bg-gradient-to-br from-purple-50 to-white"
                    subtext="Valor por pedido"
                />
            </div>

            {/* Charts & Activity Section */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Main Curve Chart */}
                <div className="lg:col-span-2 bg-asados-surface p-8 rounded-4xl shadow-soft">
                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
                        <div>
                            <h2 className="font-bold text-xl text-asados-dark">Rendimiento de Ventas</h2>
                            <p className="text-asados-muted text-xs">Tendencia de ingresos por periodo</p>
                        </div>
                        <div className="flex bg-asados-bg p-1 rounded-xl">
                            {[
                                { label: 'Hoy', value: 0 },
                                { label: '7d', value: 7 },
                                { label: '30d', value: 30 },
                                { label: '90d', value: 90 }
                            ].map((period) => (
                                <button
                                    key={period.value}
                                    onClick={() => setSelectedPeriod(period.value)}
                                    className={cn(
                                        "px-4 py-1.5 text-xs font-bold rounded-lg transition-all",
                                        selectedPeriod === period.value
                                            ? "bg-white text-asados-dark shadow-sm"
                                            : "text-asados-muted hover:text-asados-dark"
                                    )}
                                >
                                    {period.label}
                                </button>
                            ))}
                        </div>
                    </div>
                    <div className="h-72 w-full" style={{ minWidth: 0 }}>
                        <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={weeklyStats} margin={{ left: -20, right: 10, top: 10, bottom: 0 }}>
                                <defs>
                                    <linearGradient id="colorTotal" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#F97316" stopOpacity={0.3}/>
                                        <stop offset="95%" stopColor="#F97316" stopOpacity={0}/>
                                    </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" />
                                <XAxis
                                    dataKey="name"
                                    axisLine={false}
                                    tickLine={false}
                                    tick={{ fill: '#6B7280', fontSize: 11, fontWeight: 500 }}
                                    dy={10}
                                />
                                <YAxis
                                    axisLine={false}
                                    tickLine={false}
                                    tick={{ fill: '#6B7280', fontSize: 11 }}
                                    tickFormatter={(val) => `$${val}`}
                                />
                                <Tooltip
                                    contentStyle={{ 
                                        borderRadius: '16px', 
                                        border: 'none', 
                                        boxShadow: '0 10px 30px rgba(0,0,0,0.1)',
                                        padding: '12px'
                                    }}
                                    formatter={(value) => [`$${formatNumber(Number(value))}`, 'Ventas']}
                                />
                                <Area
                                    type="monotone"
                                    dataKey="total"
                                    stroke="#F97316"
                                    strokeWidth={4}
                                    fillOpacity={1}
                                    fill="url(#colorTotal)"
                                />
                            </AreaChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* Recent Activity List */}
                <div className="bg-asados-surface p-8 rounded-4xl shadow-soft">
                    <div className="flex justify-between items-center mb-6">
                        <h2 className="font-bold text-lg text-asados-dark">Actividad Reciente</h2>
                        <button className="text-xs text-asados-muted hover:text-asados-dark transition">Ver todo</button>
                    </div>
                    <div className="space-y-4">
                        {recentActivity.map((item, idx) => (
                            <div key={idx} className="flex justify-between items-center py-2 border-b border-asados-bg last:border-0">
                                <div className="flex items-center gap-3">
                                    <div className={`p-2 rounded-full ${item.type === 'income' ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-600'}`}>
                                        {item.type === 'income' ? <CheckCircle2 className="w-4 h-4" /> : <ArrowDownRight className="w-4 h-4" />}
                                    </div>
                                    <div>
                                        <p className="font-bold text-sm text-asados-dark">{item.id}</p>
                                        <p className="text-xs text-asados-muted flex items-center gap-1">
                                            <Clock className="w-3 h-3" /> {item.time}
                                        </p>
                                    </div>
                                </div>
                                <span className={`font-bold ${item.type === 'income' ? 'text-asados-dark' : 'text-red-500'}`}>
                                    {item.type === 'income' ? '+' : '-'}${formatNumber(Math.abs(item.amount))}
                                </span>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    )
}

