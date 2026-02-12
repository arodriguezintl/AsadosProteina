import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AppLayout } from '@/components/layout/AppLayout'
import Dashboard from '@/pages/Dashboard'
import POS from '@/pages/POS'
import ProductsPage from '@/pages/inventory/ProductsPage'
import ProductForm from '@/pages/inventory/ProductForm'
import CategoriesPage from '@/pages/inventory/CategoriesPage'
import FinanceCategoriesPage from '@/pages/finance/FinanceCategoriesPage'
import ExpensesPage from '@/pages/finance/ExpensesPage'
import ExpenseForm from '@/pages/finance/ExpenseForm'
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
import Login from '@/pages/Login'
import { useAuthStore } from '@/store/auth.store'
import { useEffect } from 'react'

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, loading, checkSession } = useAuthStore()

  useEffect(() => {
    checkSession()
  }, [checkSession])

  if (loading) {
    return <div className="flex h-screen items-center justify-center">Cargando...</div>
  }

  if (!user) {
    return <Navigate to="/login" replace />
  }

  return <>{children}</>
}

function App() {
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
          <Route path="/inventory/products" element={<ProductsPage />} />
          <Route path="/inventory/products/new" element={<ProductForm />} />
          <Route path="/inventory/products/:id" element={<ProductForm />} />
          <Route path="/inventory/categories" element={<CategoriesPage />} />
          <Route path="/finance/categories" element={<FinanceCategoriesPage />} />
          <Route path="/finance/transactions" element={<TransactionsPage />} />
          <Route path="/finance/expenses" element={<ExpensesPage />} />
          <Route path="/finance/expenses/new" element={<ExpenseForm />} />
          <Route path="/finance" element={<FinanceDashboard />} />

          <Route path="/recipes" element={<RecipesPage />} />
          <Route path="/recipes/new" element={<RecipeForm />} />
          <Route path="/recipes/:id" element={<RecipeForm />} />
          <Route path="/admin/users" element={<UsersPage />} />
        </Route>
      </Routes>
    </BrowserRouter>
  )
}

export default App
