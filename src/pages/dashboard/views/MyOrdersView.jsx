import { useState, useEffect } from 'react';
import { 
  Package, Clock, CheckCircle, ExternalLink, 
  Search, Filter, List, AlertCircle,
  Calendar, MapPin, Eye, FileText
} from 'lucide-react';
import { db } from '../../../config/firebase';
import { 
  collection, query, getDocs, where, 
  orderBy, updateDoc, doc 
} from 'firebase/firestore';
import { useAuth } from '../../../context/AuthContext';

const MyOrdersView = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [orders, setOrders] = useState([]);
  const [statusFilter, setStatusFilter] = useState('in_progress');

  useEffect(() => {
    fetchMyOrders();
  }, [statusFilter]);

  const fetchMyOrders = async () => {
    setLoading(true);
    try {
      // Fetch where workerAssigned is user.uid OR user.uid is in assignedWorkers array
      const q = query(
         collection(db, "orders"), 
         where("assignedWorkers", "array-contains", user.uid),
         orderBy("createdAt", "desc")
      );
      const snap = await getDocs(q);
      const data = snap.docs.map(d => ({ id: d.id, ...d.data() }));
      
      // Secondary filter by status if needed (client-side for better ux)
      setOrders(statusFilter ? data.filter(o => o.status === statusFilter) : data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateStatus = async (id, status) => {
    try {
      await updateDoc(doc(db, "orders", id), { status });
      setOrders(prev => prev.map(o => o.id === id ? { ...o, status } : o));
    } catch (e) {
      console.error(e);
    }
  };

  const getStatusStyle = (s) => {
    switch(s) {
      case 'pending': return 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20';
      case 'in_progress': return 'bg-blue-500/10 text-blue-500 border-blue-500/20 shadow-[0_0_15px_rgba(59,130,246,0.1)]';
      case 'complete': return 'bg-cyan-primary/10 text-cyan-primary border-cyan-primary/20';
      default: return 'bg-white/5 text-white/20 border-white/5';
    }
  };

  return (
    <div className="space-y-10 animate-in fade-in duration-500 pb-20">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <h2 className="text-2xl font-black text-white italic">Mission <span className="text-cyan-primary not-italic font-mono uppercase text-sm tracking-[0.2em] ml-2">// Active Tasks</span></h2>
          <p className="text-[10px] font-mono text-white/20 uppercase tracking-widest mt-1">Review your assigned projects, deadlines, and project requirements</p>
        </div>
        <div className="flex flex-wrap gap-3">
           {['pending', 'in_progress', 'complete'].map((s) => (
              <button 
                key={s}
                onClick={() => setStatusFilter(s)}
                className={`px-6 py-2.5 rounded-xl border text-[10px] font-mono uppercase tracking-[0.2em] transition-all ${statusFilter === s ? 'bg-cyan-primary text-primary-dark border-cyan-primary font-black shadow-[0_0_20px_rgba(102,252,241,0.2)]' : 'bg-white/5 border-white/5 text-white/30 hover:border-white/20'}`}
              >
                {s.replace('_', ' ')}
              </button>
           ))}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
         {loading ? (
            <div className="col-span-full py-32 text-center opacity-20 font-mono text-[10px] tracking-[0.5em] animate-pulse">Scanning Assigned Sector...</div>
         ) : orders.length === 0 ? (
            <div className="col-span-full py-40 flex flex-col items-center justify-center bg-white/[0.02] border border-dashed border-white/10 rounded-[3rem] opacity-30 group overflow-hidden relative">
               <Package size={80} className="mb-6 group-hover:scale-110 transition-transform duration-700" />
               <div className="text-sm font-black uppercase tracking-[0.3em] font-mono">No active missions found</div>
               <p className="text-[10px] font-mono mt-2 uppercase tracking-widest">Return to base or check with Manager</p>
               <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-cyan-primary/5 rounded-full blur-[100px] pointer-events-none" />
            </div>
         ) : (
            orders.map(o => (
               <div key={o.id} className="bg-[#121417] border border-white/5 rounded-[2.5rem] p-8 hover:border-cyan-primary/30 transition-all group flex flex-col relative overflow-hidden shadow-2xl">
                  {/* Status Indicator Bubble */}
                  <div className={`absolute top-8 right-8 px-4 py-1.5 rounded-full border text-[10px] font-black uppercase tracking-widest ${getStatusStyle(o.status)}`}>
                     {o.status?.replace('_', ' ')}
                  </div>

                  <div className="mb-8">
                     <div className="text-[10px] font-mono text-cyan-primary/40 uppercase tracking-[0.3em] mb-3">Order #{o.id.slice(-8).toUpperCase()}</div>
                     <h3 className="text-2xl font-black text-white leading-tight group-hover:text-cyan-primary transition-colors">{o.service}</h3>
                     <div className="text-sm font-mono text-white/20 uppercase tracking-widest mt-1 italic">{o.package}</div>
                  </div>

                  <div className="space-y-4 mb-10 mt-auto">
                     <div className="flex items-center gap-4 p-4 bg-white/5 rounded-2xl border border-white/5">
                        <div className="w-10 h-10 rounded-xl bg-[#0B0C10] flex items-center justify-center text-white/20"><Calendar size={18} /></div>
                        <div>
                           <div className="text-[9px] font-mono text-white/20 uppercase tracking-widest">Target Deadline</div>
                           <div className="text-xs font-bold text-white/80">{o.deadline || 'Flexible Protocol'}</div>
                        </div>
                     </div>
                     <div className="flex items-center gap-4 p-4 bg-white/5 rounded-2xl border border-white/5">
                        <div className="w-10 h-10 rounded-xl bg-[#0B0C10] flex items-center justify-center text-white/20"><MapPin size={18} /></div>
                        <div>
                           <div className="text-[9px] font-mono text-white/20 uppercase tracking-widest">Deployment Link</div>
                           <div className="text-xs font-bold text-cyan-primary hover:underline truncate max-w-[140px] cursor-pointer">
                              {o.driveLink ? 'Open Project Assets' : 'No Link Provided'}
                           </div>
                        </div>
                     </div>
                  </div>

                  <div className="p-5 bg-black/40 rounded-3xl border border-white/5 mb-10">
                     <div className="flex items-center gap-2 text-[9px] font-mono text-white/30 uppercase tracking-widest mb-3">
                        <FileText size={12} /> Mission Intel
                     </div>
                     <p className="text-xs text-white/50 leading-relaxed line-clamp-3 italic">
                        "{o.instructions || "No custom instructions appended to this mission log."}"
                     </p>
                  </div>

                  <div className="grid grid-cols-2 gap-4 mt-auto">
                     <button className="py-4 bg-white/5 border border-white/5 rounded-2xl text-[10px] font-black uppercase tracking-widest text-white/40 hover:bg-white/10 hover:text-white transition-all flex items-center justify-center gap-2">
                        <Eye size={14} /> Full Details
                     </button>
                     {o.status !== 'complete' && (
                        <button 
                          onClick={() => handleUpdateStatus(o.id, 'complete')}
                          className="py-4 bg-cyan-primary text-primary-dark rounded-2xl text-[10px] font-black uppercase tracking-widest hover:scale-105 transition-all shadow-[0_0_20px_rgba(102,252,241,0.1)] flex items-center justify-center gap-2"
                        >
                           <CheckCircle size={14} /> Mark Complete
                        </button>
                     )}
                     {o.status === 'complete' && (
                        <div className="col-span-2 py-4 bg-green-500/10 border border-green-500/20 text-green-500 rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] text-center flex items-center justify-center gap-3 italic">
                           <CheckCircle size={14} /> Mission Accomplished
                        </div>
                     )}
                  </div>
               </div>
            ))
         )}
      </div>

      <div className="bg-[#121417]/50 border border-white/5 p-8 rounded-3xl flex items-start gap-5 italic shadow-xl">
         <AlertCircle size={24} className="text-cyan-primary shrink-0 mt-0.5" />
         <div>
            <h4 className="text-[11px] font-black text-white uppercase tracking-widest mb-2 opacity-50">Task Efficiency Protocol</h4>
            <p className="text-xs font-mono text-white/20 uppercase tracking-[0.1em] leading-relaxed">
               Workers are required to update task status within 12h of progress changes. Marking a task as "Complete" triggers the client review phase. Failure to link project assets before completion may lead to payroll delays.
            </p>
         </div>
      </div>
    </div>
  );
};

export default MyOrdersView;
