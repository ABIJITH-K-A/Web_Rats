import { lazy, Suspense } from 'react';
import { AuthProvider } from './context/AuthProvider';
import { DashboardProvider } from './context/DashboardProvider';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import RootLayout from './components/layout/RootLayout';
import Home from './pages/public/Home';
import ProtectedRoute from './components/auth/ProtectedRoute';
import ScrollToTop from './components/utils/ScrollToTop';
import ErrorBoundary from './components/ui/ErrorBoundary';
import { Analytics } from "@vercel/analytics/react"

// Lazy load non-critical routes
const Services = lazy(() => import('./pages/public/Services'));
const ServiceDetail = lazy(() => import('./pages/public/ServiceDetail'));
const About = lazy(() => import('./pages/public/About'));
const Projects = lazy(() => import('./pages/public/Projects'));
const Help = lazy(() => import('./pages/public/Help'));
const BookService = lazy(() => import('./pages/public/BookService'));
const MarketplaceIndex = lazy(() => import('./pages/marketplace/Index'));
const TemplateDetail = lazy(() => import('./pages/marketplace/TemplateDetail'));
const Checkout = lazy(() => import('./pages/marketplace/Checkout'));
const JoinHub = lazy(() => import('./pages/auth/JoinHub'));
const ForgotPassword = lazy(() => import('./pages/auth/ForgotPassword'));
const NotFound = lazy(() => import('./pages/public/NotFound'));
const Terms = lazy(() => import('./pages/public/Terms'));
const Privacy = lazy(() => import('./pages/public/Privacy'));
const Profile = lazy(() => import('./pages/auth/Profile'));
const RoleBasedDashboard = lazy(() => import('./components/dashboard/RoleBasedDashboard'));
const PaymentSuccess = lazy(() => import('./pages/payment/PaymentSuccess'));

function App() {
  return (
    <BrowserRouter>
      <ErrorBoundary variant="page">
        <AuthProvider>
          <DashboardProvider>
            <ScrollToTop />
            <RootLayout>
              <Suspense fallback={<div className="min-h-screen bg-primary-dark" />}>
                <Routes>
                    <Route path="/" element={<Home />} />
                    <Route path="/services" element={<Services />} />
                    <Route path="/service/:serviceId" element={<ServiceDetail />} />
                    <Route path="/about" element={<About />} />
                    <Route path="/projects" element={<Projects />} />
                    <Route path="/help" element={<Help />} />
                    <Route path="/book" element={<BookService />} />
                    <Route path="/templates" element={<MarketplaceIndex />} />
                    <Route path="/marketplace" element={<MarketplaceIndex />} />
                    <Route path="/template/:id" element={<TemplateDetail />} />
                    <Route path="/checkout/:id" element={<Checkout />} />
                    <Route path="/payment-success/:orderId?" element={<PaymentSuccess />} />
                    <Route path="/join" element={<JoinHub />} />
                    <Route path="/signup" element={<JoinHub />} />
                    <Route path="/forgot-password" element={<ForgotPassword />} />
                    <Route path="/profile" element={<ProtectedRoute><Profile /></ProtectedRoute>} />
                    <Route
                      path="/dashboard"
                      element={
                        <ProtectedRoute allowedRoles={['admin', 'worker']}>
                          <RoleBasedDashboard />
                        </ProtectedRoute>
                      }
                    />
                    <Route path="/terms" element={<Terms />} />
                    <Route path="/privacy" element={<Privacy />} />
                    <Route path="*" element={<NotFound />} />
                  </Routes>
                </Suspense>
                <Analytics />
              </RootLayout>
            </DashboardProvider>
          </AuthProvider>
        </ErrorBoundary>
      </BrowserRouter>
  );
}

export default App;
