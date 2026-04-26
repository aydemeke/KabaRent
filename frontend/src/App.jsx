import { BrowserRouter, Routes, Route, useLocation } from 'react-router-dom'
import Navbar from './components/Navbar'
import Footer from './components/Footer'
import AdminGuard from './components/AdminGuard'

// Customer pages
import BrowsePage from './pages/customer/BrowsePage'
import NewOrderPage from './pages/customer/NewOrderPage'
import OrderStatusPage from './pages/customer/OrderStatusPage'

// Admin pages
import AdminDashboardPage from './pages/admin/AdminDashboardPage'
import AdminKabasPage from './pages/admin/AdminKabasPage'
import AdminOrdersPage from './pages/admin/AdminOrdersPage'
import AdminCustomersPage from './pages/admin/AdminCustomersPage'
import AdminPaymentsPage from './pages/admin/AdminPaymentsPage'

function AppLayout() {
  const { pathname } = useLocation()
  const isAdmin = pathname.startsWith('/admin')

  return (
    <div className={`min-h-screen flex flex-col${!isAdmin ? ' customer-bg' : ''}`}>
      <Navbar />
      <main className="flex-1 max-w-6xl mx-auto w-full px-4 pt-0 pb-6">
        <Routes>
          {/* Customer portal */}
          <Route path="/" element={<BrowsePage />} />
          <Route path="/order/new" element={<NewOrderPage />} />
          <Route path="/order/:id" element={<OrderStatusPage />} />

          {/* Admin dashboard */}
          <Route path="/admin" element={<AdminGuard><AdminDashboardPage /></AdminGuard>} />
          <Route path="/admin/kabas" element={<AdminGuard><AdminKabasPage /></AdminGuard>} />
          <Route path="/admin/orders" element={<AdminGuard><AdminOrdersPage /></AdminGuard>} />
          <Route path="/admin/customers" element={<AdminGuard><AdminCustomersPage /></AdminGuard>} />
          <Route path="/admin/payments" element={<AdminGuard><AdminPaymentsPage /></AdminGuard>} />
        </Routes>
      </main>
      {!isAdmin && <Footer />}
    </div>
  )
}

export default function App() {
  return (
    <BrowserRouter>
      <AppLayout />
    </BrowserRouter>
  )
}
