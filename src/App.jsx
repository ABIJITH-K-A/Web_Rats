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
import JoinHub from './pages/auth/JoinHub';
import ForgotPassword from './pages/auth/ForgotPassword';
import Profile from './pages/auth/Profile';
import RoleBasedDashboard from './components/dashboard/RoleBasedDashboard';
import ProtectedRoute from './components/auth/ProtectedRoute';
import ScrollToTop from './components/utils/ScrollToTop';

function App() {
  return (
    <AuthProvider>
      <DashboardProvider>
        <BrowserRouter>
          <ScrollToTop />
          <RootLayout>
            <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/services" element={<Services />} />
              <Route path="/service/:serviceId" element={<ServiceDetail />} />
              <Route path="/about" element={<About />} />
              <Route path="/projects" element={<Projects />} />
              <Route path="/help" element={<Help />} />
              <Route path="/book" element={<BookService />} />
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
              <Route path="*" element={
                <div className="min-h-screen flex items-center justify-center text-light-gray">
                  404 | Page Under Construction
                </div>
              } />
            </Routes>
          </RootLayout>
        </BrowserRouter>
      </DashboardProvider>
    </AuthProvider>
  );
}

export default App;
