import { useState, useEffect } from 'react';
import { 
  CheckCircle, XCircle, Clock, User, 
  Package, Info, ShieldCheck, AlertCircle,
  ArrowRight, Search, CreditCard, ExternalLink
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
import { apiRequest } from '../../../services/apiClient';

const ApprovalsView = () => {
  const { user, userProfile } = useAuth();
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('assignments'); // 'assignments' | 'payments'
  const [requests, setRequests] = useState([]);
  const [payments, setPayments] = useState([]);

  useEffect(() => {
    if (activeTab === 'assignments') {
      fetchRequests();
    } else {
      fetchPayments();
    }
  }, [activeTab]);

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

  const fetchPayments = async () => {
    setLoading(true);
    try {
      const response = await apiRequest('/temp/qpay/pending');
      setPayments(response.orders || []);
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

  const handlePaymentVerify = async (orderId, status) => {
    try {
      await apiRequest('/temp/qpay/verify', {
        method: 'POST',
        body: { orderId, status }
      });
      setPayments(prev => prev.filter(p => p.id !== orderId));
      alert(`Payment ${status}`);
    } catch (e) {
      console.error(e);
      alert('Verification failed');
    }
  };

  return (
    <div className="space-y-10 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <h2 className="text-2xl font-black text-white italic">Protocol <span className="text-cyan-primary not-italic font-mono uppercase text-sm tracking-[0.2em] ml-2">Approvals</span></h2>
          <p className="text-[10px] font-mono text-white/20 uppercase tracking-widest mt-1">Review assignment exceptions and verify manual payments</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-4 p-1 bg-white/5 rounded-2xl w-fit">
        {[
          { id: 'assignments', label: 'Assignments', icon: ShieldCheck },
          { id: 'payments', label: 'QR Payments', icon: CreditCard },
        ].map(tab => {
          const Icon = tab.icon;
          const active = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-6 py-2.5 rounded-xl text-[10px] font-mono uppercase tracking-widest transition-all ${
                active 
                  ? 'bg-cyan-primary text-primary-dark font-black shadow-lg shadow-cyan-primary/20' 
                  : 'text-white/40 hover:text-white/60 hover:bg-white/5'
              }`}
            >
              <Icon size={14} /> {tab.label}
              {tab.id === 'payments' && payments.length > 0 && (
                <span className="ml-1 px-1.5 py-0.5 rounded bg-amber-500 text-white text-[8px] animate-pulse">{payments.length}</span>
              )}
            </button>
          );
        })}
      </div>

      <div className="bg-[#121417] border border-white/5 rounded-3xl overflow-hidden shadow-2xl">
         <div className="p-6 border-b border-white/5 bg-white/5">
            <h3 className="text-xs font-mono uppercase tracking-widest text-cyan-primary flex items-center gap-2">
               {activeTab === 'assignments' ? <ShieldCheck size={14} /> : <CreditCard size={14} />} 
               {activeTab === 'assignments' ? 'Pending Assignment Vault' : 'Payment Verification Stream'}
            </h3>
         </div>
         
         <div className="divide-y divide-white/5">
            {loading ? (
               <div className="p-20 text-center text-white/10 uppercase font-mono text-[10px] tracking-widest animate-pulse">Syncing...</div>
            ) : activeTab === 'assignments' ? (
              requests.length === 0 ? (
                <div className="p-32 text-center flex flex-col items-center opacity-20">
                    <CheckCircle size={48} className="text-cyan-primary mb-4" />
                    <div className="uppercase font-mono text-xs tracking-widest italic font-black">All Protocols Clear</div>
                    <p className="text-[10px] font-mono mt-2 uppercase tracking-widest">No pending assignment requests</p>
                </div>
              ) : (
                requests.map(r => (
                  <div key={r.id} className="p-8 hover:bg-white/5 transition-all group flex flex-col lg:flex-row lg:items-center gap-8">
                      <div className="shrink-0">
                        <div className="w-16 h-16 rounded-2xl bg-white/5 border border-white/5 flex items-center justify-center text-cyan-primary relative group-hover:scale-110 transition-transform">
                            <Package size={24} />
                            <div className="absolute -bottom-1 -right-1 w-6 h-6 rounded-lg bg-cyan-primary text-primary-dark flex items-center justify-center font-black text-[10px]">
                              {r.requestedWorkers?.length || 0}
                            </div>
                        </div>
                      </div>
                      
                      <div className="grow">
                        <div className="text-sm font-black text-white group-hover:text-cyan-primary transition-colors mb-1">Order #{r.orderId.slice(-8).toUpperCase()}</div>
                        <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-6 text-[10px] font-mono text-white/20 uppercase tracking-widest">
                            <div className="flex items-center gap-2"><User size={12} /> Requested By: <span className="text-white/60">{r.requestedByName}</span></div>
                            <div className="flex items-center gap-2"><Clock size={12} /> {r.createdAt?.toDate?.().toLocaleDateString('en-IN', { day: '2-digit', month: 'short' })}</div>
                        </div>
                      </div>

                      <div className="flex gap-3 lg:shrink-0">
                        <button onClick={() => handleAction(r.id, r.orderId, r.requestedWorkers, 'approved')} className="px-6 py-3 bg-cyan-primary text-primary-dark font-black text-[10px] uppercase tracking-widest rounded-xl hover:scale-105 transition-all">Approve</button>
                        <button onClick={() => handleAction(r.id, r.orderId, r.requestedWorkers, 'rejected')} className="px-6 py-3 bg-white/5 border border-white/5 text-red-500 font-bold text-[10px] uppercase tracking-widest rounded-xl hover:bg-red-500/10">Deny</button>
                      </div>
                  </div>
                ))
              )
            ) : (
              payments.length === 0 ? (
                <div className="p-32 text-center flex flex-col items-center opacity-20">
                    <CheckCircle size={48} className="text-cyan-primary mb-4" />
                    <div className="uppercase font-mono text-xs tracking-widest italic font-black">Treasury Clear</div>
                    <p className="text-[10px] font-mono mt-2 uppercase tracking-widest">No QR payments awaiting verification</p>
                </div>
              ) : (
                payments.map(p => (
                  <div key={p.id} className="p-8 hover:bg-white/5 transition-all group flex flex-col lg:flex-row lg:items-center gap-8">
                      <div className="shrink-0 w-16 h-16 rounded-2xl bg-cyan-primary/5 border border-cyan-primary/10 flex items-center justify-center text-cyan-primary">
                        <CreditCard size={24} />
                      </div>
                      
                      <div className="grow">
                        <div className="flex items-center gap-3 mb-1">
                          <div className="text-sm font-black text-white group-hover:text-cyan-primary transition-colors">Order #{p.id.slice(-8).toUpperCase()}</div>
                          <span className="px-2 py-0.5 rounded bg-cyan-primary/10 text-cyan-primary text-[9px] font-mono font-bold uppercase tracking-wider">₹{p.advancePayment?.toLocaleString()}</span>
                        </div>
                        <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-6 text-[10px] font-mono text-white/20 uppercase tracking-widest">
                            <div className="flex items-center gap-2 text-white/60 bg-white/5 px-2 py-1 rounded-lg border border-white/5">
                              <span className="text-white/20">UTR:</span> <span className="text-cyan-primary font-bold">{p.utrNumber || 'MISSING'}</span>
                            </div>
                            <div className="flex items-center gap-2"><User size={12} /> {p.name}</div>
                            <div className="flex items-center gap-2"><Clock size={12} /> {p.createdAt && new Date(p.createdAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' })}</div>
                        </div>
                      </div>

                      <div className="flex gap-3 lg:shrink-0">
                        <button onClick={() => handlePaymentVerify(p.id, 'approved')} className="px-6 py-3 bg-cyan-primary text-primary-dark font-black text-[10px] uppercase tracking-widest rounded-xl hover:scale-105 transition-all">Approve Payment</button>
                        <button onClick={() => handlePaymentVerify(p.id, 'rejected')} className="px-6 py-3 bg-white/5 border border-white/5 text-red-500 font-bold text-[10px] uppercase tracking-widest rounded-xl hover:bg-red-500/10">Invalid UTR</button>
                      </div>
                  </div>
                ))
              )
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
