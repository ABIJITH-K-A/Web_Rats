import { useState, useEffect } from 'react';
import { 
  Search, Filter, List, CheckCircle, Clock, 
  UserPlus, Eye, Info, RefreshCw, X
} from 'lucide-react';
import { db } from '../../../config/firebase';
import { 
  collection, query, getDocs, updateDoc, 
  doc, orderBy, where, addDoc, serverTimestamp 
} from 'firebase/firestore';
import { useAuth } from '../../../context/AuthContext';
import { useDashboard } from '../../../context/DashboardContext';
import { AnimatePresence, motion } from 'framer-motion';

const OrdersView = () => {
  const { user, userData } = useAuth();
  const { searchQuery } = useDashboard();
  const [orders, setOrders] = useState([]);
  const [workers, setWorkers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('');
  const [serviceFilter, setServiceFilter] = useState('');
  
  // Modal states
  const [assignModal, setAssignModal] = useState({ open: false, orderId: null });
  const [selectedWorkers, setSelectedWorkers] = useState([]);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [ordSnap, wSnap] = await Promise.all([
        getDocs(query(collection(db, "orders"), orderBy("createdAt", "desc"))),
        getDocs(query(collection(db, "users"), where("role", "==", "worker")))
      ]);
      setOrders(ordSnap.docs.map(d => ({ id: d.id, ...d.data() })));
      setWorkers(wSnap.docs.map(d => ({ id: d.id, ...d.data() })));
    } catch (e) {
      console.error("Error fetching orders:", e);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateStatus = async (id, newStatus) => {
    try {
      const order = orders.find(o => o.id === id);
      const update = { status: newStatus };
      if (newStatus === 'complete') update.completedAt = serverTimestamp();
      await updateDoc(doc(db, "orders", id), update);
      
      // Notify customer (if we have their ID)
      if (order?.userId && order.userId !== 'guest') {
        await addDoc(collection(db, 'notifications'), {
          recipientId: order.userId,
          title: 'Order Status Updated',
          message: `Your project "${order.projectName}" is now ${newStatus.replace('_', ' ')}.`,
          type: 'order',
          orderId: id,
          read: false,
          createdAt: serverTimestamp(),
        });
      }

      setOrders(prev => prev.map(o => o.id === id ? { ...o, status: newStatus } : o));
    } catch (e) {
      console.error(e);
      alert('Error updating status');
    }
  };

  const handleTogglePayment = async (id, current) => {
    const next = current === 'paid' ? 'unpaid' : 'paid';
    try {
      await updateDoc(doc(db, "orders", id), { paymentStatus: next });
      setOrders(prev => prev.map(o => o.id === id ? { ...o, paymentStatus: next } : o));
    } catch (e) {
      console.error(e);
    }
  };

  const openAssignModal = (order) => {
    setAssignModal({ open: true, orderId: order.id });
    const current = Array.isArray(order.assignedWorkers) ? order.assignedWorkers : (order.workerAssigned ? [order.workerAssigned] : []);
    setSelectedWorkers(current);
  };

  const handleSaveAssignment = async () => {
    if (!assignModal.orderId) return;
    try {
      const orderToUpdate = orders.find(o => o.id === assignModal.orderId);
      const isManager = userData.role === 'manager';
      if (isManager && selectedWorkers.length > 2) {
        // Create assignment request
        await addDoc(collection(db, "assignmentRequests"), {
          orderId: assignModal.orderId,
          requestedWorkers: selectedWorkers,
          requestedBy: user.uid,
          requestedByName: userData.name,
          status: "pending",
          createdAt: serverTimestamp()
        });
        await updateDoc(doc(db, "orders", assignModal.orderId), {
          assignmentStatus: "pending_approval",
          pendingAssignedWorkers: selectedWorkers
        });
        alert("Request sent for approval (Manager limit > 2)");
      } else {
        await updateDoc(doc(db, "orders", assignModal.orderId), {
          assignedWorkers: selectedWorkers,
          workerAssigned: selectedWorkers[0] || null,
          assignmentStatus: "approved"
        });

        // Notify assigned workers
        for (const workerId of selectedWorkers) {
          await addDoc(collection(db, 'notifications'), {
            recipientId: workerId,
            title: 'New Mission Assigned',
            message: `You have been assigned to order: ${orderToUpdate?.projectName || assignModal.orderId}.`,
            type: 'order',
            orderId: assignModal.orderId,
            read: false,
            createdAt: serverTimestamp(),
          });
        }
      }
      setAssignModal({ open: false, orderId: null });
      fetchData();
    } catch (e) {
      console.error(e);
      alert('Error assigning worker(s)');
    }
  };

  const filteredOrders = orders.filter(o => {
    const matchSearch = !searchQuery || 
      (o.customerName || '').toLowerCase().includes(searchQuery.toLowerCase()) || 
      (o.projectName || '').toLowerCase().includes(searchQuery.toLowerCase()) || 
      (o.id || '').toLowerCase().includes(searchQuery.toLowerCase()) || 
      (o.service || '').toLowerCase().includes(searchQuery.toLowerCase());
    const matchStatus = !statusFilter || o.status === statusFilter;
    const matchService = !serviceFilter || o.service === serviceFilter;
    return matchSearch && matchStatus && matchService;
  });

  const getStatusColor = (s) => {
    switch(s) {
      case 'pending': return 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20';
      case 'in_progress': return 'bg-blue-500/10 text-blue-500 border-blue-500/20';
      case 'complete': return 'bg-cyan-primary/10 text-cyan-primary border-cyan-primary/20';
      case 'cancelled': return 'bg-red-500/10 text-red-500 border-red-500/20';
      default: return 'bg-white/5 text-white/40 border-white/10';
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <h2 className="text-2xl font-black text-white italic">Orders <span className="text-cyan-primary not-italic font-mono uppercase text-sm tracking-[0.2em] ml-2">// Management</span></h2>
          <p className="text-[10px] font-mono text-white/20 uppercase tracking-widest mt-1">Assign workers, update status, track payments</p>
        </div>
        <div className="flex flex-wrap gap-3">
           <div className="md:hidden relative group">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-white/20 group-focus-within:text-cyan-primary transition-colors" size={16} />
              <input 
                type="text" 
                placeholder="Search orders..." 
                className="bg-[#121417] border border-white/5 hover:border-white/10 focus:border-cyan-primary outline-none px-10 py-2.5 rounded-xl text-xs w-full sm:w-64 transition-all"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
           </div>
           <select 
             className="bg-[#121417] border border-white/5 px-4 py-2.5 rounded-xl text-[10px] font-mono uppercase tracking-widest outline-none focus:border-cyan-primary"
             value={statusFilter}
             onChange={(e) => setStatusFilter(e.target.value)}
           >
              <option value="">All Status</option>
              <option value="pending">Pending</option>
              <option value="in_progress">In Progress</option>
              <option value="complete">Complete</option>
              <option value="cancelled">Cancelled</option>
           </select>
        </div>
      </div>

      <div className="bg-[#121417] border border-white/5 rounded-3xl overflow-hidden shadow-2xl">
        <div className="overflow-x-auto">
           <table className="w-full text-left">
             <thead className="bg-white/[0.02] border-b border-white/5 text-[10px] font-mono uppercase tracking-widest text-white/30">
                <tr>
                  <th className="px-6 py-5">Order ID</th>
                  <th className="px-6 py-5">Service · Package</th>
                  <th className="px-6 py-5">Customer</th>
                  <th className="px-6 py-5">Amount</th>
                  <th className="px-6 py-5">Payment</th>
                  <th className="px-6 py-5">Status</th>
                  <th className="px-6 py-5">Workers</th>
                  <th className="px-6 py-5 text-center">Actions</th>
                </tr>
             </thead>
             <tbody className="divide-y divide-white/5">
                {loading ? (
                  <tr><td colSpan="8" className="px-6 py-20 text-center text-white/20 font-mono text-xs animate-pulse tracking-[0.2em] uppercase">Loading Encrypted Data...</td></tr>
                ) : filteredOrders.length === 0 ? (
                  <tr><td colSpan="8" className="px-6 py-20 text-center text-white/20 font-mono text-xs uppercase tracking-widest italic">No orders match these parameters</td></tr>
                ) : (
                  filteredOrders.map(o => (
                    <tr key={o.id} className="hover:bg-white/[0.01] transition-colors group">
                      <td className="px-6 py-4 font-mono text-[11px] text-cyan-primary/50 group-hover:text-cyan-primary transition-colors">#{o.id.slice(-8).toUpperCase()}</td>
                      <td className="px-6 py-4">
                        <div className="text-sm font-bold text-white group-hover:text-cyan-primary transition-colors">{o.service}</div>
                        <div className="text-[10px] text-white/20 font-mono uppercase">{o.package}</div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm font-semibold">{o.customerName}</div>
                        <div className="text-[10px] text-white/20 font-mono">{o.customerEmail}</div>
                      </td>
                      <td className="px-6 py-4 font-black italic text-cyan-primary tracking-tight">₹{o.finalPrice?.toLocaleString()}</td>
                      <td className="px-6 py-4">
                         <button 
                           onClick={() => handleTogglePayment(o.id, o.paymentStatus)}
                           className={`px-3 py-1 rounded-full border text-[9px] font-mono uppercase tracking-widest transition-all flex items-center gap-2 ${o.paymentStatus === 'paid' ? 'bg-green-500/10 text-green-500 border-green-500/20' : 'bg-red-500/10 text-red-500 border-red-500/20'}`}
                         >
                           {o.paymentStatus || 'unpaid'} <RefreshCw size={10} className="group-hover:rotate-180 transition-transform duration-500" />
                         </button>
                      </td>
                      <td className="px-6 py-4">
                        <select 
                          className={`bg-transparent outline-none text-[10px] font-black uppercase tracking-widest cursor-pointer ${getStatusColor(o.status).split(' ')[1]}`}
                          value={o.status || 'pending'}
                          onChange={(e) => handleUpdateStatus(o.id, e.target.value)}
                        >
                          <option value="pending">PENDING</option>
                          <option value="in_progress">IN PROGRESS</option>
                          <option value="complete">COMPLETE</option>
                          <option value="cancelled">CANCELLED</option>
                        </select>
                      </td>
                      <td className="px-6 py-4">
                         <div className="flex flex-col gap-1">
                            <div className="text-[10px] font-bold text-white/40 truncate max-w-[120px]">
                               {Array.isArray(o.assignedWorkers) && o.assignedWorkers.length > 0 
                                 ? o.assignedWorkers.map(id => workers.find(w => w.id === id)?.name || id.slice(0,4)).join(", ")
                                 : "Unassigned"}
                            </div>
                            {o.assignmentStatus === 'pending_approval' && <span className="text-[8px] text-yellow-500 font-mono uppercase tracking-widest">Approval Pending</span>}
                            <button 
                              onClick={() => openAssignModal(o)}
                              className="text-[10px] text-cyan-primary hover:underline underline-offset-4 font-mono tracking-widest flex items-center gap-1.5 mt-1"
                            >
                              <UserPlus size={12} /> Assign
                            </button>
                         </div>
                      </td>
                      <td className="px-6 py-4 text-center">
                         <button className="text-white/20 hover:text-white transition-colors p-2 rounded-lg bg-white/5 border border-white/5">
                            <Eye size={16} />
                         </button>
                      </td>
                    </tr>
                  ))
                )}
             </tbody>
           </table>
        </div>
      </div>

      {/* Assign Modal */}
      <AnimatePresence>
        {assignModal.open && (
           <div className="fixed inset-0 z-[100] flex items-center justify-center p-6">
              <motion.div 
                initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                onMouseDown={() => setAssignModal({ open: false, orderId: null })}
                className="absolute inset-0 bg-black/80 backdrop-blur-md"
              />
              <motion.div 
                initial={{ scale: 0.9, opacity: 0, y: 20 }}
                animate={{ scale: 1, opacity: 1, y: 0 }}
                exit={{ scale: 0.9, opacity: 0, y: 20 }}
                className="w-full max-w-md bg-[#121417] border border-white/10 rounded-3xl p-8 relative shadow-[0_0_50px_rgba(0,0,0,0.5)]"
              >
                 <button 
                   onClick={() => setAssignModal({ open: false, orderId: null })}
                   className="absolute top-6 right-6 text-white/20 hover:text-white transition-colors"
                 >
                   <X size={20} />
                 </button>
                 <h3 className="text-xl font-black text-white mb-2">Assign Workers</h3>
                 <p className="text-xs text-white/30 font-mono uppercase tracking-widest mb-8">// Select team members for this order</p>
                 
                 <div className="space-y-3 max-h-[40vh] overflow-y-auto pr-2 no-scrollbar">
                    {workers.map(w => (
                      <label 
                        key={w.id} 
                        className={`flex items-center gap-4 p-4 rounded-2xl border transition-all cursor-pointer ${selectedWorkers.includes(w.id) ? 'bg-cyan-primary/5 border-cyan-primary text-white' : 'bg-white/5 border-white/5 text-white/40 hover:border-white/20'}`}
                      >
                         <input 
                           type="checkbox" 
                           className="hidden" 
                           checked={selectedWorkers.includes(w.id)}
                           onChange={() => {
                             setSelectedWorkers(prev => 
                               prev.includes(w.id) ? prev.filter(id => id !== w.id) : [...prev, w.id]
                             );
                           }}
                         />
                         <div className={`w-5 h-5 rounded border flex items-center justify-center transition-colors ${selectedWorkers.includes(w.id) ? 'bg-cyan-primary border-cyan-primary' : 'border-white/20'}`}>
                            {selectedWorkers.includes(w.id) && <CheckCircle size={12} className="text-primary-dark" />}
                         </div>
                         <div className="flex-grow">
                            <div className="font-bold text-sm">{w.name}</div>
                            <div className="text-[10px] font-mono opacity-50">{w.email}</div>
                         </div>
                      </label>
                    ))}
                 </div>

                 {userData.role === 'manager' && selectedWorkers.length > 2 && (
                    <div className="mt-6 p-4 bg-yellow-500/10 border border-yellow-500/20 rounded-xl flex gap-3 text-yellow-500">
                       <Info size={16} className="shrink-0 mt-0.5" />
                       <p className="text-[10px] font-mono leading-relaxed uppercase">Assigning &gt; 2 workers requires Admin approval for Budget control.</p>
                    </div>
                 )}

                 <div className="flex gap-4 mt-10">
                    <button 
                      onClick={() => setAssignModal({ open: false, orderId: null })}
                      className="flex-1 py-3 bg-white/5 border border-white/5 rounded-xl font-bold text-sm hover:bg-white/10 transition-all text-white/60"
                    >
                      Cancel
                    </button>
                    <button 
                      onClick={handleSaveAssignment}
                      className="flex-1 py-3 bg-cyan-primary text-primary-dark rounded-xl font-black text-sm hover:scale-[1.02] active:scale-95 transition-all shadow-[0_0_20px_rgba(103, 248, 29,0.2)]"
                    >
                      Save Assignment
                    </button>
                 </div>
              </motion.div>
           </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default OrdersView;
