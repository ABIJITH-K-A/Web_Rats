import { Navigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { hasRoleAccess, normalizeRole } from '../../utils/systemRules';

const ProtectedRoute = ({ children, allowedRoles = [] }) => {
  const { user, userProfile, loading, sessionExpired } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-primary-dark">
        <div className="w-12 h-12 border-4 border-cyan-primary border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (sessionExpired && !user) {
    return <Navigate to="/join?login=1" replace />;
  }

  if (!user) {
    return <Navigate to="/" replace />;
  }

  // Strict null safety: if profile is still syncing but user exists, wait.
  if (!userProfile?.role && !userProfile?.status) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-primary-dark">
        <div className="w-12 h-12 border-4 border-cyan-primary border-t-transparent rounded-full animate-spin"></div>
        <p className="fixed mt-24 text-xs font-mono uppercase tracking-[0.2em] text-cyan-primary animate-pulse">Syncing Session...</p>
      </div>
    );
  }

  const normalizedRole = normalizeRole(userProfile?.role);
  const status = String(userProfile?.status || "active").toLowerCase();

  if (["suspended", "fired"].includes(status)) {
    return <Navigate to="/profile?error=suspended" replace />;
  }

  if (allowedRoles.length > 0 && !hasRoleAccess(normalizedRole, allowedRoles)) {
    return <Navigate to="/profile" replace />;
  }

  return children;
};

export default ProtectedRoute;
