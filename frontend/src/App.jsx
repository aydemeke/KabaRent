import { useEffect } from 'react'
import { BrowserRouter, Routes, Route, useLocation, useNavigationType } from 'react-router-dom'
import Navbar from './components/Navbar'
import Footer from './components/Footer'
import AdminGuard from './components/AdminGuard'

// Customer pages
import BrowsePage from './pages/customer/BrowsePage'
import NewOrderPage from './pages/customer/NewOrderPage'
import OrderStatusPage from './pages/customer/OrderStatusPage'

// Content / info pages
import AboutPage from './pages/content/AboutPage'
import HowItWorksPage from './pages/content/HowItWorksPage'
import FaqPage from './pages/content/FaqPage'
import ContactPage from './pages/content/ContactPage'
import RentalTermsPage from './pages/content/RentalTermsPage'
import ReturnsPage from './pages/content/ReturnsPage'
import PrivacyPage from './pages/content/PrivacyPage'

// Admin pages
import AdminDashboardPage from './pages/admin/AdminDashboardPage'
import AdminKabasPage from './pages/admin/AdminKabasPage'
import AdminOrdersPage from './pages/admin/AdminOrdersPage'
import AdminCustomersPage from './pages/admin/AdminCustomersPage'
import AdminPaymentsPage from './pages/admin/AdminPaymentsPage'

// Reset scroll to the top when navigating to a new page (footer link, etc.).
// Skip POP navigations (browser/back-button, including closing a content page)
// so returning to the previous page keeps its prior scroll position.
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
    <div className={`min-h-screen flex flex-col${!isAdmin ? ' customer-bg' : ''}`}>
      <ScrollToTop />
      <Navbar />
      <main className="flex-1 max-w-6xl mx-auto w-full px-4 pt-0 pb-6">
        <Routes>
          {/* Customer portal */}
          <Route path="/" element={<BrowsePage />} />
          <Route path="/order/new" element={<NewOrderPage />} />
          <Route path="/order/:id" element={<OrderStatusPage />} />

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
