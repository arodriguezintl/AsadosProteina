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
import OrdersPage from '@/pages/orders/OrdersPage'
import CustomersPage from '@/pages/crm/CustomersPage'
import CustomerForm from '@/pages/crm/CustomerForm'
import ReportsPage from '@/pages/reports/ReportsPage'
import HRPage from '@/pages/hr/HRPage'
import UsersPage from '@/pages/admin/UsersPage'
import StoresPage from '@/pages/admin/StoresPage'
import Login from '@/pages/Login'
import { useAuthStore } from '@/store/auth.store'
import { useEffect } from 'react'
import { supabase } from '@/lib/supabase'

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuthStore()

  // Removed redundant checkSession call here as it is handled globally in App component
  // to avoid race conditions and double loading states.

  if (loading) {
    return <div className="flex h-screen items-center justify-center">Cargando...</div>
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
          <Route path="/recipes/new" element={<RecipeForm />} />
          <Route path="/recipes/:id" element={<RecipeForm />} />
          <Route path="/admin/users" element={<UsersPage />} />
          <Route path="/admin/stores" element={<StoresPage />} />
        </Route>
      </Routes>
    </BrowserRouter>
  )
}

export default App
