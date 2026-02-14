import { useEffect, useState } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { FinanceService } from '@/services/finance.service'
import { OrderService } from '@/services/order.service'
import { ReportService } from '@/services/report.service'
import { CustomerService } from '@/services/customer.service'
import { useAuthStore } from '@/store/auth.store'
import { DollarSign, ShoppingBag, Users, TrendingUp, ArrowUpRight, ArrowDownRight, Clock, CheckCircle2 } from 'lucide-react'
import { Bar, BarChart, ResponsiveContainer, XAxis, YAxis, Tooltip } from 'recharts'
import { formatDistanceToNow } from 'date-fns'
import { es } from 'date-fns/locale'

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
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        if (storeId) {
            loadDashboardData()
        } else if (!authLoading) {
            setLoading(false)
        }
    }, [storeId, authLoading])

    const loadDashboardData = async () => {
        try {
            const todayStart = new Date()
            todayStart.setHours(0, 0, 0, 0)
            const todayEnd = new Date()
            todayEnd.setHours(23, 59, 59, 999)

            // Parallel data fetching
            const [todaysActivity, activeOrdersList, recentOrders, recentTransactions, newCustomersCount] = await Promise.all([
                ReportService.getSalesReport(storeId!, todayStart.toISOString(), todayEnd.toISOString()),
                OrderService.getOrders(['pending', 'preparing', 'ready', 'in_delivery']),
                OrderService.getOrders(undefined, 5),
                FinanceService.getTransactions(storeId!, { limit: 5 }),
                CustomerService.getNewCustomersCount(todayStart.toISOString(), todayEnd.toISOString())
            ])

            setStats({
                dailyRevenue: todaysActivity.totalSales,
                activeOrders: activeOrdersList.length,
                newCustomers: newCustomersCount,
                avgTicket: todaysActivity.avgTicket
            })

            // Mock Weekly Data
            setWeeklyStats([
                { name: 'Lun', total: 450 },
                { name: 'Mar', total: 600 },
                { name: 'Mie', total: 800 },
                { name: 'Jue', total: 1200 },
                { name: 'Vie', total: 900 },
                { name: 'Sab', total: 1500 },
                { name: 'Dom', total: 1300 },
            ])

            // Real Activity
            const activity = [
                ...recentOrders.map(o => ({
                    id: o.order_number || 'Pedido #' + o.id.slice(0, 4),
                    time: formatDistanceToNow(new Date(o.created_at), { addSuffix: true, locale: es }),
                    date: new Date(o.created_at),
                    amount: Number(o.total),
                    type: 'income'
                })),
                ...recentTransactions.map(t => ({
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
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <Card className="bg-asados-surface rounded-3xl shadow-soft border-none">
                    <CardContent className="p-6 flex flex-col gap-2">
                        <div className="flex justify-between items-start">
                            <div className="p-2 bg-asados-lime/20 rounded-xl text-asados-dark">
                                <DollarSign className="w-5 h-5" />
                            </div>
                            <span className="flex items-center text-xs font-bold text-green-600 bg-green-100 px-2 py-1 rounded-full">
                                +12% <ArrowUpRight className="w-3 h-3 ml-1" />
                            </span>
                        </div>
                        <div>
                            <p className="text-asados-muted text-sm font-medium">Ventas Hoy</p>
                            <h3 className="text-2xl font-bold text-asados-dark mt-1">${stats.dailyRevenue.toFixed(2)}</h3>
                        </div>
                    </CardContent>
                </Card>

                <Card className="bg-asados-surface rounded-3xl shadow-soft border-none">
                    <CardContent className="p-6 flex flex-col gap-2">
                        <div className="flex justify-between items-start">
                            <div className="p-2 bg-blue-100 rounded-xl text-blue-600">
                                <ShoppingBag className="w-5 h-5" />
                            </div>
                        </div>
                        <div>
                            <p className="text-asados-muted text-sm font-medium">Pedidos Activos</p>
                            <h3 className="text-2xl font-bold text-asados-dark mt-1">{stats.activeOrders}</h3>
                        </div>
                    </CardContent>
                </Card>

                <Card className="bg-asados-surface rounded-3xl shadow-soft border-none">
                    <CardContent className="p-6 flex flex-col gap-2">
                        <div className="flex justify-between items-start">
                            <div className="p-2 bg-orange-100 rounded-xl text-orange-600">
                                <Users className="w-5 h-5" />
                            </div>
                            <span className="flex items-center text-xs font-bold text-green-600 bg-green-100 px-2 py-1 rounded-full">
                                +5 <ArrowUpRight className="w-3 h-3 ml-1" />
                            </span>
                        </div>
                        <div>
                            <p className="text-asados-muted text-sm font-medium">Clientes Nuevos</p>
                            <h3 className="text-2xl font-bold text-asados-dark mt-1">{stats.newCustomers}</h3>
                        </div>
                    </CardContent>
                </Card>

                <Card className="bg-asados-surface rounded-3xl shadow-soft border-none">
                    <CardContent className="p-6 flex flex-col gap-2">
                        <div className="flex justify-between items-start">
                            <div className="p-2 bg-purple-100 rounded-xl text-purple-600">
                                <TrendingUp className="w-5 h-5" />
                            </div>
                        </div>
                        <div>
                            <p className="text-asados-muted text-sm font-medium">Ticket Promedio</p>
                            <h3 className="text-2xl font-bold text-asados-dark mt-1">${stats.avgTicket.toFixed(2)}</h3>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Charts & Activity Section */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Main Curve Chart */}
                <div className="lg:col-span-2 bg-asados-surface p-8 rounded-4xl shadow-soft">
                    <div className="flex justify-between items-center mb-6">
                        <h2 className="font-bold text-lg text-asados-dark">Rendimiento Semanal</h2>
                        <select className="bg-asados-bg border-none text-sm rounded-lg px-3 py-1 outline-none cursor-pointer">
                            <option>Esta semana</option>
                            <option>Semana pasada</option>
                        </select>
                    </div>
                    <div className="h-64 w-full min-h-[300px]" style={{ minWidth: 0 }}>
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={weeklyStats}>
                                <XAxis
                                    dataKey="name"
                                    axisLine={false}
                                    tickLine={false}
                                    tick={{ fill: '#6B7280', fontSize: 12 }}
                                    dy={10}
                                />
                                <YAxis
                                    hide={true}
                                />
                                <Tooltip
                                    cursor={{ fill: 'transparent' }}
                                    contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 20px rgba(0,0,0,0.1)' }}
                                />
                                <Bar
                                    dataKey="total"
                                    fill="#C1FF72"
                                    radius={[8, 8, 8, 8]}
                                    barSize={40}
                                />
                            </BarChart>
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
                                    {item.type === 'income' ? '+' : '-'}${Math.abs(item.amount).toFixed(2)}
                                </span>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    )
}

