import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Menu, X, Home, List, Users, Ticket, Star, Wallet, 
  Bug, Box, CheckSquare, DollarSign, Briefcase, Key, 
  LogOut, ExternalLink, User, Bell, Clock, Search, TrendingUp
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useDashboard } from '../../context/DashboardContext';
import { Link, useNavigate, useLocation } from 'react-router-dom';

const DashboardLayout = ({ children }) => {
  const { user, userProfile, logout } = useAuth();
  const { 
    searchQuery, setSearchQuery, notifications, unreadCount, 
    markAsRead, markAllAsRead 
  } = useDashboard();
  
  const [isSidebarOpen, setIsSidebarOpen] = useState(window.innerWidth > 1024);
  const [currentView, setCurrentView] = useState('overview');
  const [isNotifOpen, setIsNotifOpen] = useState(false);
  const [currentTime, setCurrentTime] = useState(new Date().toLocaleTimeString());
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date().toLocaleTimeString());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const role = userProfile?.role || 'client';
  
  const navItems = [
    { id: 'overview', label: 'Overview', icon: <Home size={18} />, roles: ['owner', 'superadmin', 'admin', 'manager', 'worker'] },
    { id: 'analytics', label: 'Analytics', icon: <TrendingUp size={18} />, roles: ['owner', 'superadmin', 'admin'] },
    { id: 'orders', label: 'Orders', icon: <List size={18} />, roles: ['owner', 'superadmin', 'admin', 'manager'] },
    { id: 'users', label: 'Users', icon: <Users size={18} />, roles: ['owner', 'superadmin', 'admin'] },
    { id: 'referrals', label: 'Referrals', icon: <Ticket size={18} />, roles: ['owner', 'superadmin', 'admin'] },
    { id: 'reviews', label: 'Reviews', icon: <Star size={18} />, roles: ['owner', 'superadmin', 'admin', 'manager', 'worker'] },
    { id: 'wallet', label: 'Wallet', icon: <Wallet size={18} />, roles: ['owner', 'superadmin', 'admin', 'manager', 'worker'] },
    { id: 'reports', label: 'Reports', icon: <Bug size={18} />, roles: ['owner', 'superadmin', 'admin', 'manager', 'worker'] },
    { id: 'samples', label: 'Samples', icon: <Box size={18} />, roles: ['owner', 'superadmin', 'admin', 'manager', 'worker'] },
    { id: 'payroll', label: 'Payroll', icon: <DollarSign size={18} />, roles: ['owner', 'superadmin', 'admin'] },
    { id: 'teampay', label: 'Team Payments', icon: <DollarSign size={18} />, roles: ['manager'] },
    { id: 'approvals', label: 'Approvals', icon: <CheckSquare size={18} />, roles: ['owner', 'superadmin', 'admin'] },
    { id: 'myorders', label: 'My Orders', icon: <Briefcase size={18} />, roles: ['worker'] },
    { id: 'invitekeys', label: 'Invite Keys', icon: <Key size={18} />, roles: ['owner', 'superadmin', 'admin', 'manager'] },
  ];

  const filteredNavItems = navItems.filter(item => item.roles.includes(role));

  const handleLogout = async () => {
    await logout();
    navigate('/join?login=1');
  };

  return (
    <div className="min-h-screen bg-[#262B25] text-light-gray flex overflow-hidden font-rajdhani">
      {/* Sidebar Overlay */}
      <AnimatePresence>
        {isSidebarOpen && window.innerWidth < 1024 && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setIsSidebarOpen(false)}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 lg:hidden"
          />
        )}
      </AnimatePresence>

      {/* Sidebar */}
      <aside 
        className={`fixed inset-y-0 left-0 z-50 w-72 bg-[#121417] border-r border-white/5 transform transition-transform duration-300 ease-in-out flex flex-col ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'} lg:relative lg:translate-x-0`}
      >
        {/* Brand */}
        <div className="p-6 border-b border-white/5 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-3">
            <img src="/RATTY.png" alt="TN WR" className="w-8 h-8" />
            <div>
              <div className="text-sm font-black text-white leading-tight">TN WEB RATS</div>
              <div className="text-[9px] font-mono text-cyan-primary uppercase tracking-widest">{role} Portal</div>
            </div>
          </Link>
          <button onClick={() => setIsSidebarOpen(false)} className="lg:hidden text-white/40 hover:text-white">
            <X size={20} />
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-grow overflow-y-auto py-6 px-4 no-scrollbar">
          <div className="space-y-1">
            {filteredNavItems.map((item) => (
              <button
                key={item.id}
                onClick={() => {
                   setCurrentView(item.id);
                   if (window.innerWidth < 1024) setIsSidebarOpen(false);
                }}
                className={`w-full flex items-center gap-4 px-4 py-3 rounded-xl transition-all group ${
                  currentView === item.id 
                    ? 'bg-cyan-primary/10 text-cyan-primary' 
                    : 'text-white/40 hover:text-white/80 hover:bg-white/5'
                }`}
              >
                <span className={currentView === item.id ? 'text-cyan-primary' : 'text-white/20 group-hover:text-cyan-primary/60'}>
                  {item.icon}
                </span>
                <span className="text-sm font-semibold tracking-wide capitalize">{item.label}</span>
                {currentView === item.id && (
                   <motion.div layoutId="navIndicator" className="ml-auto w-1.5 h-1.5 rounded-full bg-cyan-primary shadow-[0_0_10px_rgba(103, 248, 29,1)]" />
                )}
              </button>
            ))}
          </div>
        </nav>

        {/* User Card */}
        <div className="p-6 border-t border-white/5 bg-black/20">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-xl bg-cyan-primary/10 flex items-center justify-center text-cyan-primary font-bold border border-cyan-primary/20">
              {userProfile?.name?.charAt(0) || 'U'}
            </div>
            <div className="overflow-hidden">
              <div className="text-xs font-bold text-white truncate">{userProfile?.name || 'Loading...'}</div>
              <div className="text-[10px] text-white/30 truncate">{user?.email}</div>
            </div>
          </div>
          <button 
            onClick={handleLogout}
            className="w-full flex items-center justify-center gap-2 py-2.5 rounded-lg border border-red-500/20 text-red-500 text-xs font-bold hover:bg-red-500/10 transition-colors"
          >
            <LogOut size={14} /> Sign Out
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex-grow flex flex-col min-w-0">
        {/* Header */}
        <header className="h-20 bg-[#121417]/80 backdrop-blur-md border-b border-white/5 flex items-center justify-between px-6 lg:px-10 sticky top-0 z-30">
          <div className="flex items-center gap-6">
            <button 
              onClick={() => setIsSidebarOpen(!isSidebarOpen)}
              className="text-white/40 hover:text-cyan-primary transition-colors lg:hidden"
            >
              <Menu size={24} />
            </button>
            <div className="hidden sm:block">
              <div className="text-[10px] font-mono uppercase tracking-widest text-white/20 mb-1">
                {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
              </div>
              <div className="text-sm font-mono text-cyan-primary">{currentTime}</div>
            </div>
          </div>

          <div className="flex items-center gap-4">
             <div className="hidden md:flex items-center gap-2 px-4 py-2 bg-black/30 border border-white/5 rounded-full">
                <Search size={14} className="text-white/20" />
                <input
                  type="text"
                  placeholder="Global search..."
                  className="bg-transparent border-none outline-none text-xs w-40"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
             </div>

             <div className="relative">
               <button
                 onClick={() => setIsNotifOpen(!isNotifOpen)}
                 className="relative w-10 h-10 rounded-full bg-white/5 flex items-center justify-center text-white/40 hover:text-cyan-primary transition-colors border border-white/5"
               >
                  <Bell size={18} />
                  {unreadCount > 0 && (
                    <span className="absolute top-2 right-2 w-2 h-2 rounded-full bg-cyan-primary animate-pulse" />
                  )}
               </button>

               <AnimatePresence>
                 {isNotifOpen && (
                   <motion.div
                     initial={{ opacity: 0, y: 10, scale: 0.95 }}
                     animate={{ opacity: 1, y: 0, scale: 1 }}
                     exit={{ opacity: 0, y: 10, scale: 0.95 }}
                     className="absolute right-0 mt-4 w-80 bg-[#121417] border border-white/5 rounded-2xl shadow-2xl z-50 overflow-hidden"
                   >
                     <div className="p-4 border-b border-white/5 flex justify-between items-center bg-black/20">
                       <span className="text-xs font-bold uppercase tracking-widest text-white/60">Notifications</span>
                       {unreadCount > 0 && (
                         <button onClick={markAllAsRead} className="text-[9px] text-cyan-primary hover:underline">Mark all as read</button>
                       )}
                     </div>
                     <div className="max-h-96 overflow-y-auto no-scrollbar">
                       {notifications.length === 0 ? (
                         <div className="p-8 text-center text-white/20 text-xs">No notifications yet</div>
                       ) : (
                         notifications.map((notif) => (
                           <div
                             key={notif.id}
                             onClick={() => markAsRead(notif.id)}
                             className={`p-4 border-b border-white/5 hover:bg-white/5 transition-colors cursor-pointer ${!notif.read ? 'bg-cyan-primary/5' : ''}`}
                           >
                             <div className="flex gap-3">
                               <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${notif.type === 'order' ? 'bg-blue-500/10 text-blue-500' : 'bg-cyan-primary/10 text-cyan-primary'}`}>
                                 {notif.type === 'order' ? <Box size={14} /> : <Star size={14} />}
                               </div>
                               <div>
                                 <div className="text-xs font-bold text-white/90 mb-1">{notif.title}</div>
                                 <div className="text-[10px] text-white/40 leading-snug">{notif.message}</div>
                                 <div className="text-[8px] font-mono text-white/20 mt-2 uppercase">
                                   {notif.createdAt?.toDate().toLocaleTimeString()}
                                 </div>
                               </div>
                               {!notif.read && <div className="ml-auto w-1.5 h-1.5 rounded-full bg-cyan-primary" />}
                             </div>
                           </div>
                         ))
                       )}
                     </div>
                   </motion.div>
                 )}
               </AnimatePresence>
             </div>

             <Link to="/" target="_blank" className="hidden sm:flex items-center gap-2 text-[10px] font-mono uppercase tracking-widest text-white/40 hover:text-cyan-primary transition-colors border border-white/5 px-4 py-2 rounded-full h-10">
                <ExternalLink size={14} /> Live Site
             </Link>
          </div>
        </header>

        {/* View Port */}
        <main className="flex-grow overflow-y-auto px-6 py-8 lg:px-10 bg-[#262B25] no-scrollbar">
          {children({ currentView })}
        </main>
      </div>
    </div>
  );
};

export default DashboardLayout;
