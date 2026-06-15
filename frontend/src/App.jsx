import React, { Suspense } from 'react'
import { useEffect } from 'react'
import { BrowserRouter, Routes, Route, useLocation, useNavigationType } from 'react-router-dom'
import Navbar from './components/Navbar'
import Footer from './components/Footer'
import AdminGuard from './components/AdminGuard'
import ColdStartIndicator from './components/ColdStartIndicator'
import RequireCustomer from './auth/RequireCustomer'

// Customer pages
import BrowsePage from './pages/customer/BrowsePage'
import NewOrderPage from './pages/customer/NewOrderPage'
import OrderStatusPage from './pages/customer/OrderStatusPage'
import LoginPage from './pages/customer/LoginPage'
import RegisterPage from './pages/customer/RegisterPage'
import MyOrdersPage from './pages/customer/MyOrdersPage'
import MyOrderDetailPage from './pages/customer/MyOrderDetailPage'

// Content / info pages using Lazy Loading
const AboutPage = React.lazy(() => import('./pages/content/AboutPage'))
const HowItWorksPage = React.lazy(() => import('./pages/content/HowItWorksPage'))
const FaqPage = React.lazy(() => import('./pages/content/FaqPage'))
const ContactPage = React.lazy(() => import('./pages/content/ContactPage'))
const RentalTermsPage = React.lazy(() => import('./pages/content/RentalTermsPage'))
const ReturnsPage = React.lazy(() => import('./pages/content/ReturnsPage'))
const PrivacyPage = React.lazy(() => import('./pages/content/PrivacyPage'))

// Admin pages
import AdminDashboardPage from './pages/admin/AdminDashboardPage'
import AdminKabasPage from './pages/admin/AdminKabasPage'
import AdminOrdersPage from './pages/admin/AdminOrdersPage'
import AdminCustomersPage from './pages/admin/AdminCustomersPage'
import AdminPaymentsPage from './pages/admin/AdminPaymentsPage'

// Reset scroll to the top when navigating to a new page (footer link, etc.).
function ScrollToTop() {
  const { pathname } = useLocation()
  const navigationType = useNavigationType()

  useEffect(() => {
    if (navigationType !== 'POP') {
      window.scrollTo(0, 0)
    }
  }, [pathname, navigationType])

  return null
}

function AppLayout() {
  const { pathname } = useLocation()
  const isAdmin = pathname.startsWith('/admin')

  return (
    <div
      dir={isAdmin ? 'ltr' : 'rtl'}
      className={`min-h-screen flex flex-col${!isAdmin ? ' customer-bg' : ''}`}
    >
      <ScrollToTop />
      <ColdStartIndicator />
      <Navbar />
      <main className="flex-1 max-w-6xl mx-auto w-full px-4 pt-0 pb-6">
        {/* עטיפת ה-Routes ב-Suspense כדי לתמוך ב-Lazy Loading */}
        <Suspense fallback={
          <div className="flex justify-center items-center h-64 text-gray-500">
            Loading page...
          </div>
        }>
          <Routes>
            {/* Customer portal */}
            <Route path="/" element={<BrowsePage />} />
            <Route path="/order/new" element={<NewOrderPage />} />
            <Route path="/order/:id" element={<OrderStatusPage />} />

            {/* Customer accounts */}
            <Route path="/login" element={<LoginPage />} />
            <Route path="/register" element={<RegisterPage />} />
            <Route path="/customer/orders" element={<RequireCustomer><MyOrdersPage /></RequireCustomer>} />
            <Route path="/customer/orders/:id" element={<RequireCustomer><MyOrderDetailPage /></RequireCustomer>} />

            {/* Content / info pages */}
            <Route path="/about" element={<AboutPage />} />
            <Route path="/how-it-works" element={<HowItWorksPage />} />
            <Route path="/faq" element={<FaqPage />} />
            <Route path="/contact" element={<ContactPage />} />
            <Route path="/rental-terms" element={<RentalTermsPage />} />
            <Route path="/returns" element={<ReturnsPage />} />
            <Route path="/privacy" element={<PrivacyPage />} />

            {/* Admin dashboard */}
            <Route path="/admin" element={<AdminGuard><AdminDashboardPage /></AdminGuard>} />
            <Route path="/admin/kabas" element={<AdminGuard><AdminKabasPage /></AdminGuard>} />
            <Route path="/admin/orders" element={<AdminGuard><AdminOrdersPage /></AdminGuard>} />
            <Route path="/admin/customers" element={<AdminGuard><AdminCustomersPage /></AdminGuard>} />
            <Route path="/admin/payments" element={<AdminGuard><AdminPaymentsPage /></AdminGuard>} />
          </Routes>
        </Suspense>
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