import { Navigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { hasRoleAccess, normalizeRole } from '../../utils/systemRules';

const ProtectedRoute = ({ children, allowedRoles = [] }) => {
  const { user, userProfile, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-primary-dark">
        <div className="w-12 h-12 border-4 border-cyan-primary border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/" replace />;
  }

  const normalizedRole = normalizeRole(userProfile?.role);
  const status = String(userProfile?.status || "active").toLowerCase();

  if (["suspended", "fired"].includes(status)) {
    return <Navigate to="/" replace />;
  }

  if (allowedRoles.length > 0 && !hasRoleAccess(normalizedRole, allowedRoles)) {
    return <Navigate to="/profile" replace />;
  }

  return children;
};

export default ProtectedRoute;
