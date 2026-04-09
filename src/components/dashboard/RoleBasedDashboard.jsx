import { useAuth } from '../../context/AuthContext';
import { Navigate } from 'react-router-dom';
import AdminDashboard from '../../pages/dashboard/AdminDashboard';
import OwnerDashboard from '../../pages/dashboard/OwnerDashboard';
import WorkerDashboard from '../../pages/dashboard/WorkerDashboard';
import { normalizeRole } from '../../utils/systemRules';

const RoleBasedDashboard = () => {
  const { userProfile, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen bg-[#262B25] flex items-center justify-center">
        <div className="text-cyan-primary text-sm font-mono animate-pulse">Loading dashboard...</div>
      </div>
    );
  }

  const role = normalizeRole(userProfile?.role);

  if (role === 'owner') {
    return <OwnerDashboard />;
  }

  if (role === 'admin') {
    return <AdminDashboard />;
  }

  if (role === 'worker') {
    return <WorkerDashboard />;
  }

  return <Navigate to="/profile" replace />;
};

export default RoleBasedDashboard;
