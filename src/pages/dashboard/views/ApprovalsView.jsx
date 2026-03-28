import { useState, useEffect } from 'react';
import { 
  CheckCircle, XCircle, Clock, User, 
  Package, Info, ShieldCheck, AlertCircle,
  ArrowRight, Search
} from 'lucide-react';
import { db } from '../../../config/firebase';
import { 
  collection, query, getDocs, where, 
  orderBy, updateDoc, doc, serverTimestamp 
} from 'firebase/firestore';
import { useAuth } from '../../../context/AuthContext';
import { logAuditEvent } from '../../../services/auditService';
import { notifyWorkersAssigned } from '../../../services/notificationService';
import { buildOrderStatusPatch } from '../../../utils/orderHelpers';

const ApprovalsView = () => {
  const { user, userProfile } = useAuth();
  const [loading, setLoading] = useState(true);
  const [requests, setRequests] = useState([]);

  useEffect(() => {
    fetchRequests();
  }, []);

  const fetchRequests = async () => {
    setLoading(true);
    try {
      const q = query(collection(db, "assignmentRequests"), where("status", "==", "pending"), orderBy("createdAt", "desc"));
      const snap = await getDocs(q);
      setRequests(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleAction = async (requestId, orderId, workers, status) => {
    try {
      const primaryWorkerId = workers?.[0] || null;

      if (status === 'approved') {
        await updateDoc(doc(db, "orders", orderId), {
          ...buildOrderStatusPatch('assigned'),
          assignedWorkers: workers,
          workerAssigned: primaryWorkerId,
          assignedTo: primaryWorkerId,
          assignmentStatus: "approved",
          pendingAssignedWorkers: [],
          assignedAt: serverTimestamp(),
        });
        await notifyWorkersAssigned({
          workerIds: workers,
          order: { id: orderId, service: "a new order" },
        });
      } else {
        await updateDoc(doc(db, "orders", orderId), {
          assignmentStatus: "rejected",
          pendingAssignedWorkers: []
        });
      }

      await updateDoc(doc(db, "assignmentRequests", requestId), {
        status,
        processedBy: user.uid,
        processedByName: userProfile?.name || user?.email || "Admin",
        processedAt: serverTimestamp()
      });

      await logAuditEvent({
        actorId: user?.uid || null,
        actorRole: userProfile?.role || 'admin',
        action: `assignment_request_${status}`,
        targetType: 'assignment_request',
        targetId: requestId,
        severity: 'medium',
        metadata: { orderId, workers },
      });

      setRequests(prev => prev.filter(r => r.id !== requestId));
      alert(`Request ${status}`);
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <div className="space-y-10 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <h2 className="text-2xl font-black text-white italic">Protocol <span className="text-cyan-primary not-italic font-mono uppercase text-sm tracking-[0.2em] ml-2">// Approvals</span></h2>
          <p className="text-[10px] font-mono text-white/20 uppercase tracking-widest mt-1">Review manager requests for multi-worker assignments (&gt;2 workers)</p>
        </div>
      </div>

      <div className="bg-[#121417] border border-white/5 rounded-3xl overflow-hidden shadow-2xl">
         <div className="p-6 border-b border-white/5 bg-white/[0.01]">
            <h3 className="text-xs font-mono uppercase tracking-widest text-cyan-primary flex items-center gap-2">
               <ShieldCheck size={14} /> Pending Verification Vault
            </h3>
         </div>
         <div className="divide-y divide-white/5">
            {loading ? (
               <div className="p-20 text-center text-white/10 uppercase font-mono text-[10px] tracking-widest animate-pulse">Syncing Approval Stream...</div>
            ) : requests.length === 0 ? (
               <div className="p-32 text-center flex flex-col items-center opacity-20">
                  <CheckCircle size={48} className="text-cyan-primary mb-4" />
                  <div className="uppercase font-mono text-xs tracking-widest italic font-black">All Protocols Clear</div>
                  <p className="text-[10px] font-mono mt-2 uppercase tracking-widest">No pending assignment requests</p>
               </div>
            ) : (
               requests.map(r => (
                  <div key={r.id} className="p-8 hover:bg-white/[0.01] transition-all group flex flex-col lg:flex-row lg:items-center gap-8">
                     <div className="shrink-0">
                        <div className="w-16 h-16 rounded-2xl bg-white/5 border border-white/5 flex items-center justify-center text-cyan-primary relative group-hover:scale-110 transition-transform">
                           <Package size={24} />
                           <div className="absolute -bottom-1 -right-1 w-6 h-6 rounded-lg bg-cyan-primary text-primary-dark flex items-center justify-center font-black text-[10px]">
                              {r.requestedWorkers?.length || 0}
                           </div>
                        </div>
                     </div>
                     
                     <div className="flex-grow">
                        <div className="text-sm font-black text-white group-hover:text-cyan-primary transition-colors mb-1">Order #{r.orderId.slice(-8).toUpperCase()}</div>
                        <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-6">
                           <div className="text-[10px] font-mono text-white/20 uppercase tracking-widest flex items-center gap-2">
                              <User size={12} /> Requested By: <span className="text-white/60">{r.requestedByName}</span>
                           </div>
                           <div className="text-[10px] font-mono text-white/20 uppercase tracking-widest flex items-center gap-2">
                              <Clock size={12} /> {r.createdAt?.toDate?.().toLocaleDateString('en-IN', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}
                           </div>
                        </div>
                        <div className="mt-4 p-4 bg-white/5 rounded-2xl border border-white/5">
                           <div className="text-[9px] font-mono text-white/20 uppercase tracking-widest mb-2 italic">Target Workers:</div>
                           <div className="flex flex-wrap gap-2">
                              {r.requestedWorkers?.map((wId, i) => (
                                 <span key={i} className="px-2 py-1 bg-[#262B25] border border-white/5 rounded-lg text-[9px] font-mono text-cyan-primary/60">ID: {wId.slice(0, 10)}...</span>
                              ))}
                           </div>
                        </div>
                     </div>

                     <div className="flex gap-3 lg:shrink-0">
                        <button 
                           onClick={() => handleAction(r.id, r.orderId, r.requestedWorkers, 'approved')}
                           className="flex-grow lg:flex-none px-6 py-3 bg-cyan-primary text-primary-dark font-black text-[10px] uppercase tracking-[0.2em] rounded-xl hover:scale-105 transition-all shadow-[0_0_20px_rgba(103, 248, 29,0.2)] flex items-center gap-2"
                        >
                           <CheckCircle size={14} /> Approve
                        </button>
                        <button 
                           onClick={() => handleAction(r.id, r.orderId, r.requestedWorkers, 'rejected')}
                           className="flex-grow lg:flex-none px-6 py-3 bg-white/5 border border-white/5 text-red-500 font-bold text-[10px] uppercase tracking-widest rounded-xl hover:bg-red-500/10 transition-all flex items-center gap-2"
                        >
                           <XCircle size={14} /> Deny
                        </button>
                     </div>
                  </div>
               ))
            )}
         </div>
      </div>

      <div className="bg-[#121417]/50 border border-white/5 p-6 rounded-3xl flex items-start gap-4">
         <Info size={20} className="text-cyan-primary shrink-0 mt-0.5" />
         <div>
            <h4 className="text-[10px] font-bold text-white/40 mb-2 uppercase tracking-widest">Approval Protocol v1.4</h4>
            <p className="text-[10px] font-mono text-white/20 uppercase tracking-[0.15em] leading-relaxed">
              Standard operating procedure requires Admin verification for any order involving more than 2 staff members. This prevents budget overruns on low-tier service packages. Processing an approval automatically updates the live order ledger and notifies assigned workers.
            </p>
         </div>
      </div>
    </div>
  );
};

export default ApprovalsView;
