import { lazy, Suspense } from 'react';
import { AuthProvider } from './context/AuthProvider';
import { DashboardProvider } from './context/DashboardProvider';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import RootLayout from './components/layout/RootLayout';
import ProtectedRoute from './components/auth/ProtectedRoute';
import ScrollToTop from './components/utils/ScrollToTop';
import ErrorBoundary from './components/ui/ErrorBoundary';
import LoadingSpinner from './components/ui/LoadingSpinner';
import PageTransition from './components/ui/PageTransition';

// Lazy load ALL routes for better code splitting
const Home = lazy(() => import('./pages/public/Home'));
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

// Lazy load non-critical components
const Analytics = lazy(() => import('@vercel/analytics/react').then(m => ({ default: m.Analytics })));
const CookieConsent = lazy(() => import('./components/ui/CookieConsent'));

function App() {
  return (
    <BrowserRouter>
      <ErrorBoundary variant="page">
        <AuthProvider>
          <DashboardProvider>
            <ScrollToTop />
            <RootLayout>
              <Suspense fallback={<LoadingSpinner />}>
                <Routes>
                    <Route path="/" element={<PageTransition><Home /></PageTransition>} />
                    <Route path="/services" element={<PageTransition><Services /></PageTransition>} />
                    <Route path="/service/:serviceId" element={<PageTransition><ServiceDetail /></PageTransition>} />
                    <Route path="/about" element={<PageTransition><About /></PageTransition>} />
                    <Route path="/projects" element={<PageTransition><Projects /></PageTransition>} />
                    <Route path="/help" element={<PageTransition><Help /></PageTransition>} />
                    <Route path="/book" element={<PageTransition><BookService /></PageTransition>} />
                    <Route path="/templates" element={<PageTransition><MarketplaceIndex /></PageTransition>} />
                    <Route path="/marketplace" element={<PageTransition><MarketplaceIndex /></PageTransition>} />
                    <Route path="/template/:id" element={<PageTransition><TemplateDetail /></PageTransition>} />
                    <Route path="/checkout/:id" element={<PageTransition><Checkout /></PageTransition>} />
                    <Route path="/payment-success/:orderId?" element={<PageTransition><PaymentSuccess /></PageTransition>} />
                    <Route path="/join" element={<PageTransition><JoinHub /></PageTransition>} />
                    <Route path="/signup" element={<PageTransition><JoinHub /></PageTransition>} />
                    <Route path="/forgot-password" element={<PageTransition><ForgotPassword /></PageTransition>} />
                    <Route path="/profile" element={<ProtectedRoute><PageTransition><Profile /></PageTransition></ProtectedRoute>} />
                    <Route
                      path="/dashboard"
                      element={
                        <ProtectedRoute allowedRoles={['admin', 'owner', 'worker']}>
                          <PageTransition><RoleBasedDashboard /></PageTransition>
                        </ProtectedRoute>
                      }
                    />
                    <Route path="/terms" element={<PageTransition><Terms /></PageTransition>} />
                    <Route path="/privacy" element={<PageTransition><Privacy /></PageTransition>} />
                    <Route path="*" element={<PageTransition><NotFound /></PageTransition>} />
                </Routes>
                <Suspense fallback={null}>
                  <Analytics />
                </Suspense>
                <Suspense fallback={null}>
                  <CookieConsent />
                </Suspense>
              </Suspense>
              </RootLayout>
            </DashboardProvider>
          </AuthProvider>
        </ErrorBoundary>
      </BrowserRouter>
  );
}

export default App;
