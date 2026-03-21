import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import DashboardLayout from '../../components/dashboard/DashboardLayout';
import { 
  Inbox, Clock, DollarSign, Users, TrendingUp, 
  Box, Bell, Package, Calendar
} from 'lucide-react';
import { db } from '../../config/firebase';
import { collection, query, getDocs, limit, orderBy } from 'firebase/firestore';

// Import modular views
import OrdersView from './views/OrdersView';
import UsersView from './views/UsersView';
import ReferralsView from './views/ReferralsView';
import ReviewsView from './views/ReviewsView';
import WalletView from './views/WalletView';
import ReportsView from './views/ReportsView';
import SamplesView from './views/SamplesView';
import PayrollView from './views/PayrollView';
import TeamPayView from './views/TeamPayView';
import ApprovalsView from './views/ApprovalsView';
import MyOrdersView from './views/MyOrdersView';
import InviteKeysView from './views/InviteKeysView';
import EarningsView from './views/EarningsView';
import AnalyticsView from './views/AnalyticsView';

const AdminDashboard = () => {
  return (
    <DashboardLayout>
      {({ currentView }) => (
        <AnimatePresence mode="wait">
          <motion.div 
            key={currentView}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.3 }}
            className="w-full h-full"
          >
            {currentView === 'overview' && <OverviewTab />}
            {currentView === 'orders' && <OrdersView />}
            {currentView === 'users' && <UsersView />}
            {currentView === 'referrals' && <ReferralsView />}
            {currentView === 'reviews' && <ReviewsView />}
            {currentView === 'wallet' && <WalletView />}
            {currentView === 'reports' && <ReportsView />}
            {currentView === 'samples' && <SamplesView />}
            {currentView === 'payroll' && <PayrollView />}
            {currentView === 'teampay' && <TeamPayView />}
            {currentView === 'approvals' && <ApprovalsView />}
            {currentView === 'myorders' && <MyOrdersView />}
            {currentView === 'invitekeys' && <InviteKeysView />}
            {currentView === 'earnings' && <EarningsView />}
            {currentView === 'analytics' && <AnalyticsView />}
          </motion.div>
        </AnimatePresence>
      )}
    </DashboardLayout>
  );
};

const OverviewTab = () => {
  const [recentOrders, setRecentOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const q = query(collection(db, "orders"), orderBy("createdAt", "desc"), limit(6));
        const snap = await getDocs(q);
        setRecentOrders(snap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    };
    fetchStats();
  }, []);

  const stats = [
    { label: 'Total Orders', value: '142', icon: <Inbox />, color: 'text-cyan-primary' },
    { label: 'Active Missions', value: '12', icon: <Clock />, color: 'text-yellow-500' },
    { label: 'Revenue Pool', value: '₹1.2L', icon: <DollarSign />, color: 'text-green-500' },
    { label: 'Staff Count', value: '15', icon: <Users />, color: 'text-purple-500' },
  ];

  return (
    <div className="space-y-10">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <h1 className="text-3xl font-black text-white italic">Overview <span className="text-cyan-primary not-italic font-mono uppercase text-sm tracking-[0.2em] ml-2">// Protocol Alpha</span></h1>
          <p className="text-[10px] font-mono text-white/20 uppercase tracking-widest mt-1 italic font-bold">// Syncing with global rat network</p>
        </div>
        <div className="flex gap-3">
           <button className="px-6 py-3 bg-white/5 border border-white/10 rounded-xl text-[10px] font-mono uppercase tracking-widest hover:bg-white/10 transition-all flex items-center gap-2">
              <Calendar size={14} /> Analytics Range
           </button>
           <button className="px-6 py-3 bg-cyan-primary/10 border border-cyan-primary/20 rounded-xl text-[10px] font-mono uppercase tracking-widest text-cyan-primary shadow-[0_0_20px_rgba(102,252,241,0.05)] hover:bg-cyan-primary/20 transition-all">
              Export Database
           </button>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat, i) => (
          <motion.div 
            key={i}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
            className="bg-[#121417] border border-white/5 p-8 rounded-[2rem] group hover:border-cyan-primary/30 transition-all shadow-2xl relative overflow-hidden"
          >
            <div className="flex justify-between items-start mb-6">
              <div className={`w-14 h-14 rounded-2xl bg-white/5 flex items-center justify-center ${stat.color} group-hover:scale-110 transition-transform duration-500`}>
                {stat.icon}
              </div>
              <div className="flex items-center gap-1 text-[9px] font-mono text-green-500 font-black">
                <TrendingUp size={12} /> +12% SYNC
              </div>
            </div>
            <div className="text-3xl font-black text-white mb-1 font-mono">{stat.value}</div>
            <div className="text-[10px] font-mono uppercase tracking-widest text-white/20">{stat.label}</div>
            
            {/* Background Accent */}
            <div className={`absolute top-0 right-0 w-24 h-24 blur-[60px] opacity-10 pointer-events-none ${stat.color.replace('text-', 'bg-')}`} />
          </motion.div>
        ))}
      </div>

      {/* Main Content Sections */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 pb-20">
        {/* Recent Orders Table */}
        <div className="lg:col-span-2 bg-[#121417] border border-white/5 rounded-[2.5rem] overflow-hidden self-start shadow-2xl">
          <div className="p-8 border-b border-white/5 flex items-center justify-between bg-white/[0.01]">
             <h3 className="text-xs font-mono uppercase tracking-widest text-cyan-primary flex items-center gap-3">
                <Box size={16} /> Latest Missions
             </h3>
             <button className="text-[10px] font-mono uppercase tracking-widest text-white/20 hover:text-cyan-primary transition-colors">See Archive →</button>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="bg-[#0B0C10] text-[9px] font-mono uppercase tracking-widest text-white/20 border-b border-white/5">
                  <th className="px-8 py-5">Intel ID</th>
                  <th className="px-8 py-5">Project Scope</th>
                  <th className="px-8 py-5">Protocol Value</th>
                  <th className="px-8 py-5 text-center">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {loading ? (
                   Array(6).fill(0).map((_, i) => (
                    <tr key={i} className="animate-pulse">
                      <td colSpan="4" className="px-8 py-6 h-12 bg-white/5 border-b border-[#0B0C10]"></td>
                    </tr>
                  ))
                ) : recentOrders.length === 0 ? (
                  <tr>
                    <td colSpan="4" className="px-8 py-20 text-center text-white/10 font-mono text-xs uppercase tracking-widest italic">Encrypted archive empty</td>
                  </tr>
                ) : (
                  recentOrders.map(order => (
                    <tr key={order.id} className="hover:bg-white/[0.02] transition-colors group">
                      <td className="px-8 py-6 font-mono text-[11px] text-cyan-primary/40 group-hover:text-cyan-primary transition-colors">#{order.id.slice(-8).toUpperCase()}</td>
                      <td className="px-8 py-6">
                        <div className="text-sm font-bold text-white group-hover:text-cyan-primary transition-colors">{order.service}</div>
                        <div className="text-[10px] text-white/20 font-mono uppercase tracking-tighter">{order.package}</div>
                      </td>
                      <td className="px-8 py-6 font-black text-cyan-primary italic">₹{order.finalPrice?.toLocaleString()}</td>
                      <td className="px-8 py-6">
                         <div className="flex justify-center">
                            <span className="px-3 py-1 rounded-full text-[8px] font-mono font-black uppercase tracking-[0.2em] border border-cyan-primary/20 bg-cyan-primary/5 text-cyan-primary shadow-[0_0_10px_rgba(102,252,241,0.1)]">
                              {order.status || 'NEW'}
                            </span>
                         </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Sidebar Alerts */}
        <div className="space-y-8">
           <div className="bg-[#121417] border border-white/5 p-8 rounded-[2.5rem] shadow-2xl relative overflow-hidden">
              <h3 className="text-xs font-mono uppercase tracking-widest text-cyan-primary mb-8 flex items-center gap-3">
                 <Bell size={16} /> Intelligence Feed
              </h3>
              <div className="space-y-6">
                 {[
                   { t: 'Payment pending for #DE23X', time: '2h ago', color: 'bg-yellow-500' },
                   { t: 'New staff verification pending', time: '5h ago', color: 'bg-cyan-primary' },
                   { t: 'Weekly Payroll Cycle Initialized', time: '1d ago', color: 'bg-green-500' },
                   { t: 'Emergency bug report in Samples', time: '2d ago', color: 'bg-red-500' },
                 ].map((a, i) => (
                   <div key={i} className="flex gap-5 items-start relative group cursor-pointer">
                      <div className={`w-2 h-2 rounded-full mt-1.5 shrink-0 ${a.color} shadow-[0_0_10px_rgba(102,252,241,0.2)] group-hover:scale-150 transition-transform`} />
                      <div>
                         <div className="text-xs font-bold text-white/70 group-hover:text-white transition-colors leading-tight">{a.t}</div>
                         <div className="text-[9px] font-mono text-white/20 mt-1 uppercase tracking-widest font-bold">{a.time}</div>
                      </div>
                      {/* Vertical Line Connector */}
                      {i !== 3 && <div className="absolute left-[3px] top-6 w-[2px] h-8 bg-white/5" />}
                   </div>
                 ))}
              </div>
           </div>
           
           <div className="bg-gradient-to-br from-[#121417] to-[#0B0C10] border border-white/5 p-10 rounded-[2.5rem] relative overflow-hidden group shadow-2xl">
              <div className="absolute -right-8 -bottom-8 text-cyan-primary/5 group-hover:scale-110 transition-transform duration-700 -rotate-12">
                <Box size={180} />
              </div>
              <h4 className="text-lg font-black text-white mb-3 italic">System <span className="text-cyan-primary">Protocol</span></h4>
              <p className="text-[10px] font-mono text-white/30 uppercase tracking-[0.15em] leading-relaxed mb-8 font-bold italic">
                Platform stability is 99.9%. All encrypted tunnels are secure.
              </p>
              <button className="text-[10px] font-mono uppercase tracking-[0.2em] text-cyan-primary hover:text-white transition-colors flex items-center gap-2 group/btn">
                Run Diagnostic <TrendingUp size={14} className="group-hover/btn:translate-x-1 transition-transform" />
              </button>
           </div>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
