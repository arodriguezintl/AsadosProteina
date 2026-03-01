import { useAuthStore } from "@/store/auth.store"
import { hasModuleAccess } from "@/config/permissions"
import { LogOut, User, ChevronUp, LayoutDashboard, Calculator, Package, List, Wallet, PieChart, ChefHat, ClipboardList, Users, BarChart3, UserCog, ArrowLeftRight, Settings, Store, Pin, PinOff } from "lucide-react"
import { Outlet, Link, useLocation } from "react-router-dom"
import { useEffect, useState } from "react"
import { supabase } from "@/lib/supabase"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { cn } from "@/lib/utils"
import logoImage from "@/assets/logo.jpg"

const NavItem = ({ to, icon: Icon, label, exact = false, prefix = false, isExpanded = true }: { to: string, icon: any, label: string, exact?: boolean, prefix?: boolean, isExpanded?: boolean }) => {
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
                    ? "bg-asados-lime text-white font-extrabold shadow-md"
                    : "text-white hover:bg-white/10"
            )}
        >
            <Icon className={cn("h-5 w-5 shrink-0 transition-colors", isActive ? "text-white" : "text-white group-hover:text-asados-lime")} />
            <span className={cn("text-sm font-medium whitespace-nowrap overflow-hidden transition-all duration-300",
                !isExpanded ? "w-0 opacity-0" : "w-auto opacity-100"
            )}>{label}</span>
        </Link>
    )
}

export function AppLayout() {
    const { user, role, modules, signOut, storeId } = useAuthStore()
    const [storeName, setStoreName] = useState<string>('')
    const [isPinned, setIsPinned] = useState(true)
    const [isHovered, setIsHovered] = useState(false)

    const isExpanded = isPinned || isHovered

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
    const canViewTransactions = hasModuleAccess(role, 'transactions', modules)
    const canViewFinanceCategories = hasModuleAccess(role, 'finance_categories', modules)
    const canViewReports = hasModuleAccess(role, 'reports', modules)
    const canViewCRM = hasModuleAccess(role, 'crm', modules)
    const canViewHR = hasModuleAccess(role, 'hr', modules)
    const canViewUsers = hasModuleAccess(role, 'users', modules)
    const canViewStores = hasModuleAccess(role, 'stores', modules)
    const canViewPromotions = hasModuleAccess(role, 'promotions', modules)

    return (
        <div className="flex min-h-screen bg-[#F4F7F2]">
            {/* Fixed Sidebar */}
            <aside
                onMouseEnter={() => setIsHovered(true)}
                onMouseLeave={() => setIsHovered(false)}
                className={cn(
                    "text-white flex flex-col fixed inset-y-0 z-50 shadow-2xl border-r border-white/10 transition-all duration-300",
                    isExpanded ? "w-64" : "w-20"
                )}
                style={{ backgroundColor: '#1F2937' }}
            >
                {/* Header */}
                <div className="p-4 pt-6 pb-2 min-h-[100px] flex flex-col items-center justify-center relative">
                    {isExpanded && (
                        <button
                            onClick={() => setIsPinned(!isPinned)}
                            className="absolute top-4 right-4 text-white/40 hover:text-white transition-colors"
                            title={isPinned ? "Unpin sidebar" : "Pin sidebar"}
                        >
                            {isPinned ? <Pin className="h-4 w-4" /> : <PinOff className="h-4 w-4" />}
                        </button>
                    )}

                    <div className={cn("relative flex flex-col items-center justify-center transition-all duration-300", isExpanded ? "w-full" : "w-10")}>
                        <img
                            src={logoImage}
                            alt="Asados Proteina"
                            className={cn("h-auto object-contain transition-all duration-300", isExpanded ? "max-h-16 w-auto" : "max-h-10 w-auto")}
                        />
                        {isExpanded && <span className="text-[10px] bg-blue-500 text-white px-1 rounded shadow-sm mt-1">BETA</span>}
                    </div>

                    <div className={cn("mt-2 text-center transition-all duration-300 whitespace-nowrap overflow-hidden", !isExpanded ? "h-0 opacity-0" : "h-auto opacity-100")}>
                        <p className="text-xs text-white/60 font-medium">ERP Management</p>
                        {storeName && <p className="text-xs text-asados-lime font-bold uppercase tracking-wider truncate px-2">{storeName}</p>}
                    </div>
                </div>

                {/* Navigation */}
                <nav className="flex-1 px-3 space-y-1 overflow-y-auto py-4 overflow-x-hidden">
                    {/* Principal Section */}
                    {(canViewDashboard || canViewOrders || canViewPOS) && (
                        <>
                            <div className={cn("text-xs font-bold text-white/50 uppercase tracking-wider mb-2 px-3 transition-opacity duration-300 whitespace-nowrap", !isExpanded && "opacity-0")}>Principal</div>
                            {canViewDashboard && <NavItem to="/dashboard" icon={LayoutDashboard} label="Inicio" exact isExpanded={isExpanded} />}
                            {canViewOrders && <NavItem to="/orders" icon={ClipboardList} label="Pedidos" isExpanded={isExpanded} />}
                            {canViewPOS && <NavItem to="/pos" icon={Calculator} label="Punto de Venta" isExpanded={isExpanded} />}
                        </>
                    )}

                    {/* Operations Section */}
                    {(canViewInventory || canViewRecipes) && (
                        <>
                            <div className={cn("text-xs font-bold text-white/50 uppercase tracking-wider mb-2 px-3 mt-6 transition-opacity duration-300 whitespace-nowrap", !isExpanded && "opacity-0")}>Operaciones</div>
                            {canViewInventory && (
                                <>
                                    <NavItem to="/inventory/stock" icon={Package} label="Inventario" prefix isExpanded={isExpanded} />
                                    <NavItem to="/inventory/menu" icon={List} label="Productos Venta" prefix isExpanded={isExpanded} />
                                    <NavItem to="/inventory/categories" icon={Settings} label="Categorías" isExpanded={isExpanded} />
                                </>
                            )}
                            {canViewRecipes && (
                                <>
                                    <NavItem to="/recipes" icon={ChefHat} label="Recetas" exact isExpanded={isExpanded} />
                                    <NavItem to="/recipes/simulator" icon={Calculator} label="Simulador" isExpanded={isExpanded} />
                                </>
                            )}
                        </>
                    )}

                    {/* Administration Section */}
                    {(canViewFinance || canViewTransactions || canViewFinanceCategories || canViewReports || canViewCRM || canViewHR || canViewUsers || canViewStores || canViewPromotions) && (
                        <>
                            <div className={cn("text-xs font-bold text-white/50 uppercase tracking-wider mb-2 px-3 mt-6 transition-opacity duration-300 whitespace-nowrap", !isExpanded && "opacity-0")}>Administración</div>
                            {canViewFinance && <NavItem to="/finance" icon={PieChart} label="Finanzas" exact isExpanded={isExpanded} />}
                            {canViewTransactions && <NavItem to="/finance/transactions" icon={ArrowLeftRight} label="Transacciones" isExpanded={isExpanded} />}
                            {canViewFinanceCategories && <NavItem to="/finance/categories" icon={Wallet} label="Categorías Fin." isExpanded={isExpanded} />}

                            {canViewReports && <NavItem to="/reports" icon={BarChart3} label="Reportes" prefix isExpanded={isExpanded} />}
                            {canViewCRM && <NavItem to="/crm/customers" icon={Users} label="Clientes" prefix isExpanded={isExpanded} />}
                            {canViewPromotions && <NavItem to="/admin/promotions" icon={PieChart} label="Promociones" prefix isExpanded={isExpanded} />}
                            {canViewHR && <NavItem to="/hr" icon={UserCog} label="Personal" prefix isExpanded={isExpanded} />}
                            {canViewStores && <NavItem to="/admin/stores" icon={Store} label="Tiendas" isExpanded={isExpanded} />}
                        </>
                    )}
                </nav>

                {/* Footer / User Profile */}
                <div className="p-3 bg-black/20">
                    {/* Plan Pro box hidden for next phase
                    <div className="bg-asados-lime/10 p-4 rounded-2xl border border-asados-lime/20 mb-4">
                        <p className="text-xs text-asados-lime font-bold uppercase mb-1">Plan Pro</p>
                        <button className="w-full mt-1 text-xs bg-asados-lime text-asados-dark py-2 rounded-lg font-bold hover:bg-asados-lime/90 transition">
                            MEJORAR
                        </button>
                    </div>
                    */}

                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <button className={cn("flex items-center p-3 rounded-xl hover:bg-white/5 transition group", isExpanded ? "justify-between w-full" : "justify-center w-auto")}>
                                <div className="flex items-center gap-3">
                                    <div className="h-10 w-10 shrink-0 rounded-full bg-gradient-to-br from-asados-lime to-orange-400 flex items-center justify-center text-asados-dark font-black text-sm">
                                        {user?.email?.[0]?.toUpperCase() || 'U'}
                                    </div>
                                    <div className={cn("text-left transition-all duration-300 overflow-hidden whitespace-nowrap", !isExpanded ? "w-0 opacity-0" : "w-auto opacity-100")}>
                                        <p className="text-sm font-bold text-white">{user?.email?.split('@')[0] || 'Usuario'}</p>
                                        <p className="text-xs text-white/60 capitalize">{role || 'cashier'}</p>
                                    </div>
                                </div>
                                {isExpanded && <ChevronUp className="h-4 w-4 shrink-0 text-white/60 group-hover:text-white transition" />}
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
            <main className={cn("flex-1 transition-all duration-300", isPinned ? "ml-64" : "ml-20")}>
                <div className="p-8">
                    <Outlet />
                </div>
            </main>
        </div>
    )
}
