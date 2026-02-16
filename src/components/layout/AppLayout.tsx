import { useAuthStore } from "@/store/auth.store"
import { hasModuleAccess } from "@/config/permissions"
import { LogOut, User, ChevronUp, LayoutDashboard, Calculator, Package, List, DollarSign, Wallet, PieChart, ChefHat, ClipboardList, Users, BarChart3, UserCog, ArrowLeftRight, Settings, Store } from "lucide-react"
import { Outlet, Link, useLocation } from "react-router-dom"
import { useEffect, useState } from "react"
import { supabase } from "@/lib/supabase"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { cn } from "@/lib/utils"

const NavItem = ({ to, icon: Icon, label, exact = false, prefix = false }: { to: string, icon: any, label: string, exact?: boolean, prefix?: boolean }) => {
    const location = useLocation()
    const isActive = exact
        ? location.pathname === to
        : prefix
            ? location.pathname.startsWith(to)
            : location.pathname === to

    return (
        <Link
            to={to}
            className={cn(
                "flex items-center gap-3 p-3 rounded-xl transition-all duration-200 group",
                isActive
                    ? "bg-[#C1FF72] text-[#0B2B26] font-extrabold shadow-md"
                    : "text-white hover:bg-white/10"
            )}
        >
            <Icon className={cn("h-5 w-5 transition-colors", isActive ? "text-[#0B2B26]" : "text-white group-hover:text-[#C1FF72]")} />
            <span className="text-sm font-medium">{label}</span>
        </Link>
    )
}

export function AppLayout() {
    const { user, role, modules, signOut, storeId } = useAuthStore()
    const [storeName, setStoreName] = useState<string>('')

    useEffect(() => {
        if (storeId) {
            supabase.from('stores').select('name').eq('id', storeId).single()
                .then(({ data }) => {
                    if (data) setStoreName(data.name)
                })
        }
    }, [storeId])

    const handleSignOut = async () => {
        await signOut()
    }

    // Check permissions for each module
    const canViewDashboard = hasModuleAccess(role, 'dashboard', modules)
    const canViewPOS = hasModuleAccess(role, 'pos', modules)
    const canViewOrders = hasModuleAccess(role, 'orders', modules)
    const canViewInventory = hasModuleAccess(role, 'inventory', modules)
    const canViewRecipes = hasModuleAccess(role, 'recipes', modules)
    const canViewFinance = hasModuleAccess(role, 'finance', modules)
    const canViewReports = hasModuleAccess(role, 'reports', modules)
    const canViewCRM = hasModuleAccess(role, 'crm', modules)
    const canViewHR = hasModuleAccess(role, 'hr', modules)
    const canViewUsers = hasModuleAccess(role, 'users', modules)
    const canViewStores = hasModuleAccess(role, 'stores', modules)

    return (
        <div className="flex min-h-screen bg-[#F4F7F2]">
            {/* Fixed Sidebar */}
            <aside
                className="w-64 text-white flex flex-col fixed inset-y-0 z-50 shadow-2xl border-r border-white/10"
                style={{ backgroundColor: '#0B2B26' }}
            >
                {/* Header */}
                <div className="p-8 pb-4">
                    <div className="text-2xl font-black text-[#C1FF72] tracking-tight relative inline-block">
                        Asados P.
                        <span className="text-[10px] absolute -top-1 -right-8 bg-blue-500 text-white px-1 rounded">BETA</span>
                    </div>
                    <div className="mt-1">
                        <p className="text-xs text-white/60 font-medium">ERP Management</p>
                        {storeName && <p className="text-xs text-[#C1FF72] font-bold uppercase tracking-wider">{storeName}</p>}
                    </div>
                </div>

                {/* Navigation */}
                <nav className="flex-1 px-4 space-y-1 overflow-y-auto py-4">
                    {/* Principal Section */}
                    {(canViewDashboard || canViewOrders || canViewPOS) && (
                        <>
                            <div className="text-xs font-bold text-white/50 uppercase tracking-wider mb-2 px-3">Principal</div>
                            {canViewDashboard && <NavItem to="/dashboard" icon={LayoutDashboard} label="Inicio" exact />}
                            {canViewOrders && <NavItem to="/orders" icon={ClipboardList} label="Pedidos" />}
                            {canViewPOS && <NavItem to="/pos" icon={Calculator} label="Punto de Venta" />}
                        </>
                    )}

                    {/* Operations Section */}
                    {(canViewInventory || canViewRecipes) && (
                        <>
                            <div className="text-xs font-bold text-white/50 uppercase tracking-wider mb-2 px-3 mt-6">Operaciones</div>
                            {canViewInventory && (
                                <>
                                    <NavItem to="/inventory/stock" icon={Package} label="Inventario" prefix />
                                    <NavItem to="/inventory/menu" icon={List} label="Productos Venta" prefix />
                                    <NavItem to="/inventory/categories" icon={Settings} label="Categorías" />
                                </>
                            )}
                            {canViewRecipes && <NavItem to="/recipes" icon={ChefHat} label="Recetas" prefix />}
                        </>
                    )}

                    {/* Administration Section */}
                    {(canViewFinance || canViewReports || canViewCRM || canViewHR || canViewUsers || canViewStores) && (
                        <>
                            <div className="text-xs font-bold text-white/50 uppercase tracking-wider mb-2 px-3 mt-6">Administración</div>
                            {canViewFinance && (
                                <>
                                    <NavItem to="/finance" icon={PieChart} label="Finanzas" exact />
                                    <NavItem to="/finance/transactions" icon={ArrowLeftRight} label="Transacciones" />
                                    <NavItem to="/finance/expenses" icon={DollarSign} label="Gastos" prefix />
                                    <NavItem to="/finance/categories" icon={Wallet} label="Categorías Fin." />
                                </>
                            )}
                            {canViewReports && <NavItem to="/reports" icon={BarChart3} label="Reportes" prefix />}
                            {canViewCRM && <NavItem to="/crm/customers" icon={Users} label="Clientes" prefix />}
                            {canViewHR && <NavItem to="/hr" icon={UserCog} label="Personal" prefix />}
                            {canViewStores && <NavItem to="/admin/stores" icon={Store} label="Tiendas" />}
                        </>
                    )}
                </nav>

                {/* Footer / User Profile */}
                <div className="p-4 bg-black/20">
                    <div className="bg-asados-lime/10 p-4 rounded-2xl border border-asados-lime/20 mb-4">
                        <p className="text-xs text-asados-lime font-bold uppercase mb-1">Plan Pro</p>
                        <button className="w-full mt-1 text-xs bg-asados-lime text-asados-dark py-2 rounded-lg font-bold hover:bg-asados-lime/90 transition">
                            MEJORAR
                        </button>
                    </div>

                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <button className="w-full flex items-center justify-between p-3 rounded-xl hover:bg-white/5 transition group">
                                <div className="flex items-center gap-3">
                                    <div className="h-10 w-10 rounded-full bg-gradient-to-br from-asados-lime to-green-400 flex items-center justify-center text-asados-dark font-black text-sm">
                                        {user?.email?.[0]?.toUpperCase() || 'U'}
                                    </div>
                                    <div className="text-left">
                                        <p className="text-sm font-bold text-white">{user?.email?.split('@')[0] || 'Usuario'}</p>
                                        <p className="text-xs text-white/60 capitalize">{role || 'cashier'}</p>
                                    </div>
                                </div>
                                <ChevronUp className="h-4 w-4 text-white/60 group-hover:text-white transition" />
                            </button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-56">
                            <DropdownMenuItem disabled>
                                <User className="mr-2 h-4 w-4" />
                                <span>Perfil</span>
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={handleSignOut}>
                                <LogOut className="mr-2 h-4 w-4" />
                                <span>Cerrar Sesión</span>
                            </DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>
                </div>
            </aside>

            {/* Main Content */}
            <main className="flex-1 ml-64">
                <div className="p-8">
                    <Outlet />
                </div>
            </main>
        </div>
    )
}
