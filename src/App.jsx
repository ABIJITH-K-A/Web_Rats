import { AuthProvider } from './context/AuthContext';
import { DashboardProvider } from './context/DashboardContext';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import RootLayout from './components/layout/RootLayout';
import Home from './pages/public/Home';
import Services from './pages/public/Services';
import ServiceDetail from './pages/public/ServiceDetail';
import About from './pages/public/About';
import Projects from './pages/public/Projects';
import Help from './pages/public/Help';
import BookService from './pages/public/BookService';
import Templates from './pages/public/Templates';
import JoinHub from './pages/auth/JoinHub';
import ForgotPassword from './pages/auth/ForgotPassword';
import NotFound from './pages/public/NotFound';
import Terms from './pages/public/Terms';
import Privacy from './pages/public/Privacy';
import Profile from './pages/auth/Profile';
import RoleBasedDashboard from './components/dashboard/RoleBasedDashboard';
import ProtectedRoute from './components/auth/ProtectedRoute';
import ScrollToTop from './components/utils/ScrollToTop';
import ErrorBoundary from './components/ui/ErrorBoundary';

function App() {
  return (
    <ErrorBoundary>
      <AuthProvider>
        <DashboardProvider>
        <BrowserRouter>
          <ScrollToTop />
          <RootLayout>
            <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/services" element={<Services />} />
              <Route path="/about" element={<About />} />
              <Route path="/projects" element={<Projects />} />
              <Route path="/help" element={<Help />} />
              <Route path="/book" element={<BookService />} />
              <Route path="/templates" element={<Templates />} />
              <Route path="/join" element={<JoinHub />} />
              <Route path="/signup" element={<JoinHub />} />
              <Route path="/forgot-password" element={<ForgotPassword />} />
              <Route path="/profile" element={<Profile />} />
              <Route 
                path="/dashboard" 
                element={
                  <ProtectedRoute allowedRoles={['owner', 'superadmin', 'admin', 'manager', 'worker']}>
                    <RoleBasedDashboard />
                  </ProtectedRoute>
                } 
              />
              <Route path="/terms" element={<Terms />} />
              <Route path="/privacy" element={<Privacy />} />
              <Route path="*" element={<NotFound />} />
            </Routes>
          </RootLayout>
        </BrowserRouter>
      </DashboardProvider>
    </AuthProvider>
    </ErrorBoundary>
  );
}

export default App;
