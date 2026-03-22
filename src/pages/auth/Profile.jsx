import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  User, List, Ticket, Wallet, Settings, Shield, 
  LogOut, Plus, Copy, Check, Clock, Package, 
  CreditCard, Calendar, Smartphone, Mail, Edit3, 
  Trash2, Key, Info, ShieldCheck, ChevronRight, UserCircle, History
} from 'lucide-react';
import { Button, Card, SectionHeading } from '../../components/ui/Primitives';
import { useAuth } from '../../context/AuthContext';
import { db } from '../../config/firebase';
import { 
  collection, query, where, orderBy, getDocs, 
  doc, getDoc, updateDoc, 
  serverTimestamp 
} from 'firebase/firestore';
import { Link, useNavigate } from 'react-router-dom';

const Profile = () => {
  const { user, logout, userData } = useAuth();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('orders');
  const [orders, setOrders] = useState([]);
  const [loadingOrders, setLoadingOrders] = useState(true);
  const [copySuccess, setCopySuccess] = useState(false);
  const [isStaff, setIsStaff] = useState(false);

  // Stats
  const [stats, setStats] = useState({
    total: 0,
    active: 0,
    done: 0,
    spent: 0
  });

  useEffect(() => {
    if (!user) {
      navigate('/join?login=1&return=/profile');
      return;
    }
    
    if (userData) {
      setIsStaff(['worker', 'manager', 'admin', 'superadmin', 'owner'].includes(userData.role));
    }

    const fetchOrders = async () => {
      try {
        const q = query(
          collection(db, "orders"), 
          where("userId", "==", user.uid), 
          orderBy("createdAt", "desc")
        );
        const snap = await getDocs(q);
        const orderData = snap.docs.map(d => ({ id: d.id, ...d.data() }));
        setOrders(orderData);
        
        // Calculate stats
        const active = orderData.filter(o => o.status === 'in_progress').length;
        const done = orderData.filter(o => o.status === 'complete').length;
        const spent = orderData.reduce((acc, curr) => acc + (Number(curr.price) || 0), 0);
        
        setStats({
          total: orderData.length,
          active,
          done,
          spent
        });
      } catch (e) {
        console.error("Error fetching orders:", e);
      } finally {
        setLoadingOrders(false);
      }
    };

    fetchOrders();
  }, [user, userData, navigate]);

  const handleCopyCode = () => {
    if (userData?.referralCode) {
      navigator.clipboard.writeText(userData.referralCode);
      setCopySuccess(true);
      setTimeout(() => setCopySuccess(false), 2000);
    }
  };

  const tabs = [
    { id: 'orders', label: 'My Orders', icon: <List size={18} /> },
    { id: 'referral', label: 'Referral', icon: <Ticket size={18} /> },
    ...(isStaff ? [{ id: 'wallet', label: 'Wallet', icon: <Wallet size={18} /> }] : []),
    { id: 'settings', label: 'Settings', icon: <Settings size={18} /> },
    { id: 'security', label: 'Security', icon: <Shield size={18} /> },
  ];

  const getStatusColor = (status) => {
    switch (status) {
      case 'pending': return 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20';
      case 'in_progress': return 'bg-blue-500/10 text-blue-500 border-blue-500/20';
      case 'complete': return 'bg-cyan-primary/10 text-cyan-primary border-cyan-primary/20';
      case 'cancelled': return 'bg-red-500/10 text-red-500 border-red-500/20';
      default: return 'bg-white/5 text-white/40 border-white/10';
    }
  };

  return (
    <div className="container mx-auto px-6 py-20 pb-40 max-w-5xl">
       {/* Hero Section */}
       <section className="text-center mb-16">
         <motion.div 
           initial={{ scale: 0.9, opacity: 0 }}
           animate={{ scale: 1, opacity: 1 }}
           className="relative inline-block mb-6"
         >
           <div className="w-24 h-24 rounded-full border-2 border-cyan-primary bg-cyan-primary/5 flex items-center justify-center text-4xl font-black text-cyan-primary shadow-[0_0_30px_rgba(103, 248, 29,0.2)]">
             {userData?.name?.charAt(0).toUpperCase() || '?'}
             <button className="absolute bottom-0 right-0 w-8 h-8 rounded-full bg-cyan-primary text-primary-dark flex items-center justify-center border-4 border-primary-dark hover:scale-110 transition-transform">
               <Edit3 size={14} />
             </button>
           </div>
         </motion.div>
         <h1 className="text-3xl font-black mb-1">{userData?.name || 'Loading...'}</h1>
         <p className="text-sm font-mono text-light-gray opacity-40 mb-6">{user?.email}</p>
         
         <div className="flex justify-center gap-3 flex-wrap">
           <span className="px-4 py-1 rounded-full border border-cyan-primary/20 bg-cyan-primary/5 text-cyan-primary text-[10px] font-mono uppercase tracking-widest flex items-center gap-2">
             <UserCircle size={12} /> {userData?.role || 'customer'}
           </span>
           <span className="px-4 py-1 rounded-full border border-teal-primary/20 bg-teal-primary/5 text-teal-primary text-[10px] font-mono uppercase tracking-widest flex items-center gap-2">
             <Ticket size={12} /> {userData?.discountPercent || 0}% Discount Active
           </span>
         </div>
       </section>

       {/* Navigation Tabs */}
       <div className="flex border-b border-white/10 mb-12 overflow-x-auto no-scrollbar scroll-smooth">
         {tabs.map((tab) => (
           <button
             key={tab.id}
             onClick={() => setActiveTab(tab.id)}
             className={`px-8 py-4 font-mono text-[10px] uppercase tracking-[0.2em] whitespace-nowrap flex items-center gap-3 transition-colors relative ${
               activeTab === tab.id ? 'text-cyan-primary' : 'text-white/30 hover:text-white/60'
             }`}
           >
             {tab.icon} {tab.label}
             {activeTab === tab.id && (
               <motion.div 
                 layoutId="activeTabProfile"
                 className="absolute bottom-0 left-0 right-0 h-[2px] bg-cyan-primary"
               />
             )}
           </button>
         ))}
       </div>

       {/* Content Panels */}
       <AnimatePresence mode="wait">
         <motion.div
           key={activeTab}
           initial={{ opacity: 0, y: 10 }}
           animate={{ opacity: 1, y: 0 }}
           exit={{ opacity: 0, y: -10 }}
           transition={{ duration: 0.2 }}
         >
           {activeTab === 'orders' && (
             <div className="space-y-12">
               {/* Stats Grid */}
               <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                 {[
                   { label: 'Total Orders', val: stats.total },
                   { label: 'In Progress', val: stats.active },
                   { label: 'Completed', val: stats.done },
                   { label: 'Total Spent', val: `₹${stats.spent.toLocaleString('en-IN')}` },
                 ].map((s, i) => (
                   <div key={i} className="bg-secondary-dark/50 border border-white/5 p-6 rounded-2xl">
                     <div className="text-2xl font-black text-cyan-primary font-mono mb-1">{s.val}</div>
                     <div className="text-[10px] font-mono uppercase tracking-widest text-light-gray/30">{s.label}</div>
                   </div>
                 ))}
               </div>

               {/* Order Table */}
               <Card className="p-0 overflow-hidden">
                 <div className="p-6 border-b border-white/5 flex justify-between items-center">
                   <h3 className="font-mono text-[10px] uppercase tracking-widest text-cyan-primary flex items-center gap-2">
                     <History size={14} /> Order History
                   </h3>
                   <Link to="/book">
                     <Button variant="outline" className="text-[10px] px-4 py-1.5 flex items-center gap-2">
                       <Plus size={14} /> New Order
                     </Button>
                   </Link>
                 </div>
                 <div className="overflow-x-auto">
                   <table className="w-full text-left text-sm">
                     <thead className="bg-white/5 text-[10px] font-mono uppercase tracking-widest text-white/30">
                       <tr>
                         <th className="px-6 py-4">Order ID</th>
                         <th className="px-6 py-4">Service</th>
                         <th className="px-6 py-4">Amount</th>
                         <th className="px-6 py-4">Status</th>
                         <th className="px-6 py-4">Date</th>
                       </tr>
                     </thead>
                     <tbody className="divide-y divide-white/5">
                        {loadingOrders ? (
                          <tr>
                            <td colSpan="5" className="px-6 py-12 text-center text-white/20 font-mono text-xs">
                              <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1 }} className="inline-block mb-2">
                                <Clock size={16} />
                              </motion.div><br />
                              Loading your orders...
                            </td>
                          </tr>
                        ) : orders.length === 0 ? (
                          <tr>
                            <td colSpan="5" className="px-6 py-20 text-center">
                               <Package size={40} className="mx-auto mb-4 text-white/5" />
                               <p className="text-white/30 font-mono text-xs mb-6 uppercase tracking-widest">No orders found yet</p>
                               <Link to="/book">
                                 <Button>Book Your First Project</Button>
                               </Link>
                            </td>
                          </tr>
                        ) : (
                          orders.map((order) => (
                            <tr key={order.id} className="hover:bg-white/5 transition-colors cursor-pointer group">
                              <td className="px-6 py-4 font-mono text-[11px] text-cyan-primary/60 group-hover:text-cyan-primary truncate max-w-[100px]">
                                #{order.id.slice(-8).toUpperCase()}
                              </td>
                              <td className="px-6 py-4 font-bold">
                                {order.service}
                                <div className="text-[10px] font-normal text-white/30">{order.package}</div>
                              </td>
                              <td className="px-6 py-4 font-black italic text-cyan-primary">₹{order.price?.toLocaleString('en-IN')}</td>
                              <td className="px-6 py-4">
                                <span className={`px-2.5 py-1 rounded-full border text-[9px] font-mono uppercase tracking-wider ${getStatusColor(order.status)}`}>
                                  {order.status || 'pending'}
                                </span>
                              </td>
                              <td className="px-6 py-4 text-white/30 text-xs">
                                {order.createdAt?.toDate?.().toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) || '—'}
                              </td>
                            </tr>
                          ))
                        )}
                     </tbody>
                   </table>
                 </div>
               </Card>
             </div>
           )}

           {activeTab === 'referral' && (
             <div className="max-w-3xl mx-auto space-y-12">
               <Card className="p-10 border-cyan-primary/10">
                 <h3 className="font-mono text-[10px] uppercase tracking-widest text-cyan-primary mb-8 flex items-center gap-2">
                   <Ticket size={14} /> Your Referral Code
                 </h3>
                 
                 {userData?.referralCode ? (
                   <div className="space-y-8">
                     <div className="flex flex-col md:flex-row items-center gap-6 bg-primary-dark border border-cyan-primary/20 rounded-2xl p-8 justify-between relative overflow-hidden group">
                       <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
                         <Ticket size={120} />
                       </div>
                       <div className="text-center md:text-left z-10">
                         <div className="text-3xl font-black text-cyan-primary tracking-[0.2em] mb-2">{userData.referralCode}</div>
                         <p className="text-[10px] font-mono text-light-gray opacity-40 uppercase tracking-widest italic font-bold">
                           {userData.role} code • {userData.discountPercent}% Discount
                         </p>
                       </div>
                       <Button onClick={handleCopyCode} className="z-10 min-w-[160px]">
                         {copySuccess ? <Check size={18} className="mr-2" /> : <Copy size={18} className="mr-2" />}
                         {copySuccess ? 'Copied!' : 'Copy Code'}
                       </Button>
                     </div>
                     
                     <div className="grid grid-cols-3 gap-4">
                        {[
                          { label: 'Times Used', val: '0' },
                          { label: 'Discount Given', val: `${userData.discountPercent}%` },
                          { label: 'Referral Bonus', val: '₹0' },
                        ].map((s, i) => (
                          <div key={i} className="text-center p-4 bg-white/5 rounded-xl border border-white/5">
                            <div className="text-xl font-black text-cyan-primary mb-1">{s.val}</div>
                            <div className="text-[9px] font-mono uppercase tracking-widest text-white/30">{s.label}</div>
                          </div>
                        ))}
                     </div>
                     
                     <p className="text-xs text-light-gray opacity-40 leading-relaxed italic text-center">
                       Share this code with friends. When they sign up using it, they get a {userData.discountPercent}% discount — and you earn a referral bonus per cycle.
                     </p>
                   </div>
                 ) : (
                   <div className="p-12 text-center bg-white/5 rounded-2xl border border-dashed border-white/10">
                      <Ticket size={48} className="mx-auto mb-6 text-white/10" />
                      <p className="text-sm text-light-gray opacity-50 mb-8 max-w-sm mx-auto font-mono tracking-widest uppercase">
                        Referral codes are available for staff members to share with clients.
                      </p>
                      <Link to="/help" className="text-cyan-primary font-mono text-xs uppercase tracking-widest hover:underline">
                        Learn more about Rewards →
                      </Link>
                   </div>
                 )}
               </Card>
             </div>
           )}

           {activeTab === 'settings' && (
             <div className="max-w-2xl mx-auto space-y-12">
                <Card className="p-8">
                  <h3 className="font-mono text-[10px] uppercase tracking-widest text-cyan-primary mb-8 flex items-center gap-2 border-b border-white/5 pb-4">
                    <Edit3 size={14} /> Profile Settings
                  </h3>
                  <div className="grid gap-6">
                    <div className="space-y-1">
                      <label className="text-[10px] uppercase font-mono tracking-widest text-light-gray/40">Full Name</label>
                      <div className="relative">
                        <User className="absolute left-4 top-1/2 -translate-y-1/2 text-cyan-primary/30" size={18} />
                        <input className="w-full bg-primary-dark border border-white/10 rounded-xl px-12 py-3 outline-none focus:border-cyan-primary text-sm" value={userData?.name || ''} readOnly />
                      </div>
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] uppercase font-mono tracking-widest text-light-gray/40">WhatsApp / Phone</label>
                      <div className="relative">
                        <Smartphone className="absolute left-4 top-1/2 -translate-y-1/2 text-cyan-primary/30" size={18} />
                        <input className="w-full bg-primary-dark border border-white/10 rounded-xl px-12 py-3 outline-none focus:border-cyan-primary text-sm" value={userData?.phone || ''} readOnly />
                      </div>
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] uppercase font-mono tracking-widest text-light-gray/40">Email (Cannot Change)</label>
                      <div className="relative">
                        <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-white/10" size={18} />
                        <input className="w-full bg-primary-dark/30 border border-white/5 rounded-xl px-12 py-3 outline-none text-white/20 text-sm cursor-not-allowed" value={user?.email || ''} readOnly />
                      </div>
                    </div>
                    <Button className="mt-4">Save Changes</Button>
                  </div>
                </Card>

                <Card className="p-8 border-red-500/20 bg-red-500/5">
                   <h3 className="font-mono text-[10px] uppercase tracking-widest text-red-500 mb-6 flex items-center gap-2">
                     <Trash2 size={14} /> Danger Zone
                   </h3>
                   <p className="text-xs text-light-gray/50 mb-8 leading-relaxed">
                     Once you logout, you will need to re-authenticate to access your profile and track your orders. 
                     Your data is safely stored.
                   </p>
                   <Button 
                     onClick={() => logout()}
                     className="bg-red-500 border-red-500 text-white hover:bg-red-600 hover:border-red-600 w-full"
                   >
                     <LogOut size={18} className="mr-2" /> Sign Out
                   </Button>
                </Card>
             </div>
           )}

           {activeTab === 'security' && (
             <div className="max-w-2xl mx-auto space-y-12">
                <Card className="p-8">
                  <h3 className="font-mono text-[10px] uppercase tracking-widest text-cyan-primary mb-8 flex items-center gap-2 border-b border-white/5 pb-4">
                    <Key size={14} /> Password Security
                  </h3>
                  <div className="grid gap-6">
                    <div className="space-y-1">
                      <label className="text-[10px] uppercase font-mono tracking-widest text-light-gray/40">Current Password</label>
                      <input type="password" placeholder="••••••••" className="w-full bg-primary-dark border border-white/10 rounded-xl px-5 py-3 outline-none focus:border-cyan-primary text-sm" />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] uppercase font-mono tracking-widest text-light-gray/40">New Password</label>
                      <input type="password" placeholder="••••••••" className="w-full bg-primary-dark border border-white/10 rounded-xl px-5 py-3 outline-none focus:border-cyan-primary text-sm" />
                    </div>
                    <Button className="mt-4">Update Password</Button>
                  </div>
                </Card>

                <Card className="p-8">
                   <h3 className="font-mono text-[10px] uppercase tracking-widest text-cyan-primary mb-8 flex items-center gap-2 border-b border-white/5 pb-4">
                     <ShieldCheck size={14} /> Account Information
                   </h3>
                   <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {[
                        { k: 'Member Since', v: userData?.createdAt?.toDate?.().toLocaleDateString('en-IN') || '2026' },
                        { k: 'Verified Email', v: user?.emailVerified ? 'Yes' : 'No' },
                        { k: 'Last Login', v: user?.metadata?.lastSignInTime ? new Date(user?.metadata?.lastSignInTime).toLocaleDateString('en-IN') : 'Today' },
                        { k: 'User ID', v: user?.uid?.slice(0, 12) + '...' },
                      ].map((item, i) => (
                        <div key={i} className="p-4 bg-white/5 rounded-xl border border-white/5">
                          <div className="text-[9px] font-mono uppercase tracking-widest text-white/30 mb-1">{item.k}</div>
                          <div className="text-sm font-bold">{item.v}</div>
                        </div>
                      ))}
                   </div>
                </Card>
             </div>
           )}

           {activeTab === 'wallet' && isStaff && (
             <div className="space-y-8">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                   <Card className="bg-gradient-to-tr from-cyan-primary/20 to-teal-primary/5 border-cyan-primary/30 p-8 flex flex-col items-center text-center">
                      <Wallet size={32} className="text-cyan-primary mb-4" />
                      <div className="text-3xl font-black text-cyan-primary italic font-mono mb-2">₹0</div>
                      <div className="text-[10px] font-mono uppercase tracking-widest text-cyan-primary opacity-60">Available Balance</div>
                   </Card>
                   <Card className="p-8 flex flex-col items-center text-center border-white/10">
                      <Clock size={32} className="text-white/20 mb-4" />
                      <div className="text-2xl font-black text-white/40 font-mono mb-2">₹0</div>
                      <div className="text-[10px] font-mono uppercase tracking-widest text-white/20">Pending Payouts</div>
                   </Card>
                   <Card className="p-8 flex flex-col items-center text-center border-white/10">
                      <Calendar size={32} className="text-white/20 mb-4" />
                      <div className="text-2xl font-black text-white/40 font-mono mb-2">1st April</div>
                      <div className="text-[10px] font-mono uppercase tracking-widest text-white/20">Next Pay Cycle</div>
                   </Card>
                </div>
                
                <Card className="p-10 text-center">
                   <div className="opacity-10 mb-8"><Wallet size={60} className="mx-auto" /></div>
                   <h4 className="text-lg font-bold mb-4">No Earnings Yet</h4>
                   <p className="text-xs text-light-gray opacity-40 max-w-sm mx-auto mb-8 font-mono uppercase tracking-widest">
                     Earn rewards by Referring clients or completing student projects as a worker.
                   </p>
                   <Button variant="outline">Learn More about Payroll</Button>
                </Card>
             </div>
           )}
         </motion.div>
       </AnimatePresence>
    </div>
  );
};

export default Profile;
