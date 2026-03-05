import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AppLayout } from '@/components/layout/AppLayout'
import Dashboard from '@/pages/Dashboard'
import POS from '@/pages/POS'
import ProductsPage from '@/pages/inventory/ProductsPage'
import ProductForm from '@/pages/inventory/ProductForm'
import CategoriesPage from '@/pages/inventory/CategoriesPage'
import FinanceCategoriesPage from '@/pages/finance/FinanceCategoriesPage'
import FinanceDashboard from '@/pages/finance/FinanceDashboard'
import TransactionsPage from '@/pages/finance/TransactionsPage'
import RecipesPage from './pages/recipes/RecipesPage'
import RecipeForm from './pages/recipes/RecipeForm'
import RecipeSimulator from './pages/recipes/RecipeSimulator'
import OrdersPage from '@/pages/orders/OrdersPage'
import CustomersPage from '@/pages/crm/CustomersPage'
import CustomerForm from '@/pages/crm/CustomerForm'
import ReportsPage from '@/pages/reports/ReportsPage'
import HRPage from '@/pages/hr/HRPage'
import UsersPage from '@/pages/admin/UsersPage'
import StoresPage from '@/pages/admin/StoresPage'
import PromotionsPage from '@/pages/admin/PromotionsPage'
import PromotionForm from '@/pages/admin/PromotionForm'
import Login from '@/pages/Login'
import { useAuthStore } from '@/store/auth.store'
import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { ToastContainer } from 'react-toastify'
import 'react-toastify/dist/ReactToastify.css'

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, loading, checkSession, signOut } = useAuthStore()
  const [isTakingLong, setIsTakingLong] = useState(false)

  useEffect(() => {
    let timeoutId: ReturnType<typeof setTimeout>;
    if (loading) {
      timeoutId = setTimeout(() => {
        setIsTakingLong(true)
      }, 5000) // Show retry option after 5 seconds of loading
    } else {
      setIsTakingLong(false)
    }

    return () => clearTimeout(timeoutId)
  }, [loading])

  // Removed redundant checkSession call here as it is handled globally in App component
  // to avoid race conditions and double loading states.

  if (loading) {
    return (
      <div className="flex flex-col h-screen items-center justify-center p-4">
        <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin mb-4"></div>
        <p className="text-lg font-medium text-gray-700 dark:text-gray-200">Cargando aplicación...</p>

        {isTakingLong && (
          <div className="mt-8 text-center animate-fade-in max-w-sm">
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
              La carga está tomando más de lo esperado. Esto puede deberse a bloqueadores de rastreo (como Brave Shields) o una conexión lenta.
            </p>
            <div className="flex flex-col gap-2 relative z-50">
              <button
                onClick={() => checkSession()}
                className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-orange-600 transition-colors pointer-events-auto cursor-pointer"
              >
                Reintentar
              </button>
              <button
                onClick={() => signOut()}
                className="px-4 py-2 bg-gray-200 text-gray-800 dark:bg-gray-800 dark:text-gray-200 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-700 transition-colors pointer-events-auto cursor-pointer mt-2"
              >
                Cerrar sesión / Reiniciar
              </button>
            </div>
          </div>
        )}
      </div>
    )
  }

  if (!user) {
    return <Navigate to="/login" replace />
  }

  return <>{children}</>
}

function App() {
  const { checkSession } = useAuthStore()

  useEffect(() => {
    // Initial check
    checkSession()

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, _session) => {
      if (_event === 'SIGNED_IN' || _event === 'TOKEN_REFRESHED') {
        await checkSession()
      }
      // Removed SIGNED_OUT listener: manual signOut now handles the redirect/reset via hard reload.
      // Keeping a listener here can cause infinite loops in some browsers.
    })

    return () => {
      subscription.unsubscribe()
    }
  }, [])

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<Login />} />

        <Route element={
          <ProtectedRoute>
            <AppLayout />
          </ProtectedRoute>
        }>
          <Route path="/" element={<Navigate to="/dashboard" replace />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/orders" element={<OrdersPage />} />
          <Route path="/crm/customers" element={<CustomersPage />} />
          <Route path="/crm/customers/:id" element={<CustomerForm />} />
          <Route path="/hr" element={<HRPage />} />
          <Route path="/reports" element={<ReportsPage />} />
          <Route path="/pos" element={<POS />} />
          <Route path="/inventory/products" element={<Navigate to="/inventory/stock" replace />} />
          <Route path="/inventory/stock" element={<ProductsPage viewMode="inventory" />} />
          <Route path="/inventory/menu" element={<ProductsPage viewMode="menu" />} />
          <Route path="/inventory/products/new" element={<ProductForm />} />
          <Route path="/inventory/products/:id" element={<ProductForm />} />
          <Route path="/inventory/categories" element={<CategoriesPage />} />
          <Route path="/finance/categories" element={<FinanceCategoriesPage />} />
          <Route path="/finance/transactions" element={<TransactionsPage />} />
          <Route path="/finance" element={<FinanceDashboard />} />

          <Route path="/recipes" element={<RecipesPage />} />
          <Route path="/recipes/simulator" element={<RecipeSimulator />} />
          <Route path="/recipes/new" element={<RecipeForm />} />
          <Route path="/recipes/:id" element={<RecipeForm />} />
          <Route path="/admin/promotions" element={<PromotionsPage />} />
          <Route path="/admin/promotions/new" element={<PromotionForm />} />
          <Route path="/admin/promotions/:id" element={<PromotionForm />} />
          <Route path="/admin/users" element={<UsersPage />} />
          <Route path="/admin/stores" element={<StoresPage />} />
        </Route>
      </Routes>
      <ToastContainer position="top-right" autoClose={5000} />
    </BrowserRouter >
  )
}

export default App
