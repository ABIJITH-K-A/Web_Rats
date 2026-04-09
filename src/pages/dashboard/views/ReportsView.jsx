import { useState, useEffect } from 'react';
import { 
  Bug, Send, Inbox, History, 
  Search, Filter, ChevronRight, CheckCircle, 
  XCircle, Clock, Info
} from 'lucide-react';
import { db } from '../../../config/firebase';
import { 
  collection, query, getDocs, where, 
  addDoc, serverTimestamp, orderBy, updateDoc, doc 
} from 'firebase/firestore';
import { useAuth } from '../../../context/AuthContext';
import { useDashboard } from '../../../context/DashboardContext';

const ReportsView = () => {
  const { user, userData } = useAuth();
  const { searchQuery } = useDashboard();
  const [loading, setLoading] = useState(true);
  const [myReports, setMyReports] = useState([]);
  const [inbox, setInbox] = useState([]);
  const [reportForm, setReportForm] = useState({ toRole: 'admin', subject: '', details: '' });
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    if (!user?.uid) return;
    setLoading(true);
    try {
      const q1 = query(collection(db, "reports"), where("fromUid", "==", user.uid), orderBy("createdAt", "desc"));
      const snap1 = await getDocs(q1);
      setMyReports(snap1.docs.map(d => ({ id: d.id, ...d.data() })));
      
      const isApprover = ['owner', 'admin'].includes(userData?.role);
      if (isApprover) {
         const q2 = query(collection(db, "reports"), where("toRole", "==", userData.role), orderBy("createdAt", "desc"));
         const snap2 = await getDocs(q2);
         setInbox(snap2.docs.map(d => ({ id: d.id, ...d.data() })));
      }
    } catch (e) {
      console.error("Fetch reports error:", e);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmitReport = async (e) => {
    e.preventDefault();
    if (!reportForm.subject || !reportForm.details) return;
    setIsSubmitting(true);
    try {
      await addDoc(collection(db, "reports"), {
        fromUid: user?.uid || 'anonymous',
        fromName: userData?.name || 'Anonymous',
        fromRole: userData?.role || 'client',
        toRole: reportForm.toRole,
        subject: reportForm.subject,
        details: reportForm.details,
        status: "pending",
        createdAt: serverTimestamp()
      });
      setReportForm({ toRole: 'admin', subject: '', details: '' });
      fetchData();
      alert("Report submitted successfully.");
    } catch (e) {
      console.error(e);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleUpdateStatus = async (id, status) => {
    try {
      await updateDoc(doc(db, "reports", id), { status });
      setInbox(prev => prev.map(r => r.id === id ? { ...r, status } : r));
    } catch (e) {
      console.error(e);
    }
  };

  const getStatusColor = (s) => {
    switch(s) {
      case 'pending': return 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20';
      case 'resolved': return 'bg-green-500/10 text-green-500 border-green-500/20';
      case 'rejected': return 'bg-red-500/10 text-red-500 border-red-500/20';
      default: return 'bg-white/5 text-white/40 border-white/10';
    }
  };

  const getTargetRoles = (myRole) => {
    if (myRole === 'admin') return ['owner'];
    if (myRole === 'owner') return ['owner'];
    return ['admin'];
  };

  return (
    <div className="space-y-10 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <h2 className="text-2xl font-black text-white italic">Reports <span className="text-cyan-primary not-italic font-mono uppercase text-sm tracking-[0.2em] ml-2">Center</span></h2>
          <p className="text-[10px] font-mono text-white/20 uppercase tracking-widest mt-1">Submit issues, report bugs, or request assistance from hierarchy</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Submit Report Form */}
        <div className="lg:col-span-1 bg-[#121417] border border-white/5 rounded-3xl p-8 self-start sticky top-28">
           <h3 className="text-xs font-mono uppercase tracking-widest text-cyan-primary mb-8 flex items-center gap-2">
              <Send size={14} /> Create Report
           </h3>
           <form onSubmit={handleSubmitReport} className="space-y-6">
              <div className="space-y-1">
                 <label className="text-[10px] uppercase font-mono tracking-widest text-white/20">Send To Role *</label>
                 <select 
                    className="w-full bg-[#262B25] border border-white/10 rounded-xl px-4 py-3 text-sm focus:border-cyan-primary outline-none transition-all uppercase font-mono tracking-widest text-[10px]"
                    value={reportForm.toRole}
                    onChange={(e) => setReportForm({...reportForm, toRole: e.target.value})}
                 >
                    {getTargetRoles(userData?.role).map(r => (
                       <option key={r} value={r}>{r}</option>
                    ))}
                 </select>
              </div>
              <div className="space-y-1">
                 <label className="text-[10px] uppercase font-mono tracking-widest text-white/20">Subject *</label>
                 <input 
                   required type="text"
                   className="w-full bg-[#262B25] border border-white/10 rounded-xl px-4 py-3 text-sm focus:border-cyan-primary outline-none transition-all"
                   placeholder="Short summary..."
                   value={reportForm.subject}
                   onChange={(e) => setReportForm({...reportForm, subject: e.target.value})}
                 />
              </div>
              <div className="space-y-1">
                 <label className="text-[10px] uppercase font-mono tracking-widest text-white/20">Details *</label>
                 <textarea 
                    required
                    className="w-full bg-[#262B25] border border-white/10 rounded-xl px-4 py-3 text-sm focus:border-cyan-primary outline-none min-h-[120px] resize-none transition-all"
                    placeholder="Describe the issue, order IDs, or evidence details..."
                    value={reportForm.details}
                    onChange={(e) => setReportForm({...reportForm, details: e.target.value})}
                 ></textarea>
              </div>
              <button 
                disabled={isSubmitting}
                className="w-full py-4 bg-cyan-primary text-primary-dark font-black text-sm uppercase tracking-widest rounded-xl hover:scale-[1.02] active:scale-95 transition-all shadow-[0_0_20px_rgba(103, 248, 29,0.2)] disabled:opacity-50"
              >
                {isSubmitting ? 'Submitting encrypted data...' : 'Submit Final Report'}
              </button>
           </form>
        </div>

        {/* Inbox / History */}
        <div className="lg:col-span-2 space-y-8">
           {/* Incoming Reports Inbox (Staff) */}
           {inbox.length > 0 && (
              <div className="bg-[#121417] border border-white/5 rounded-3xl overflow-hidden shadow-2xl">
                 <div className="p-6 border-b border-white/5 bg-white/1 flex items-center justify-between">
                    <h3 className="text-xs font-mono uppercase tracking-widest text-cyan-primary flex items-center gap-2">
                       <Inbox size={14} /> Inbox
                    </h3>
                    <div className="w-6 h-6 rounded-full bg-cyan-primary/20 flex items-center justify-center text-[10px] font-black text-cyan-primary">{inbox.length}</div>
                 </div>
                  <div className="divide-y divide-white/5 max-h-[400px] overflow-y-auto no-scrollbar">
                    {inbox
                      .filter(r => !searchQuery || 
                        r.subject?.toLowerCase().includes(searchQuery.toLowerCase()) || 
                        r.fromName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                        r.details?.toLowerCase().includes(searchQuery.toLowerCase())
                      )
                      .map(r => (
                       <div key={r.id} className="p-6 hover:bg-white/1 transition-all group relative">
                          <div className="flex justify-between items-start mb-4">
                             <div>
                                <div className="text-sm font-bold text-white group-hover:text-cyan-primary transition-colors">{r.subject}</div>
                                <div className="text-[10px] font-mono text-white/20 uppercase tracking-widest mt-1">From: {r.fromName} ({r.fromRole})</div>
                             </div>
                             <div className={`px-2 py-0.5 rounded-full border text-[8px] font-black uppercase tracking-widest ${getStatusColor(r.status)}`}>
                                {r.status || 'pending'}
                             </div>
                          </div>
                          <p className="text-xs text-white/50 leading-relaxed italic border-l border-white/10 pl-4 mb-4">{r.details}</p>
                          <div className="flex gap-2">
                             <button 
                               onClick={() => handleUpdateStatus(r.id, 'resolved')}
                               className="text-[9px] font-mono px-3 py-1.5 bg-green-500/10 text-green-500 border border-green-500/20 rounded-lg hover:bg-green-500/20 transition-all uppercase tracking-widest flex items-center gap-2"
                             >
                               <CheckCircle size={10} /> Mark Resolved
                             </button>
                             <button 
                               onClick={() => handleUpdateStatus(r.id, 'rejected')}
                               className="text-[9px] font-mono px-3 py-1.5 bg-red-500/10 text-red-500 border border-red-500/20 rounded-lg hover:bg-red-500/20 transition-all uppercase tracking-widest flex items-center gap-2"
                             >
                               <XCircle size={10} /> Dismiss
                             </button>
                          </div>
                          <div className="absolute top-6 right-6 text-[8px] font-mono text-white/10 uppercase tracking-[0.2em]">{r.createdAt?.toDate?.().toLocaleDateString('en-IN')}</div>
                       </div>
                    ))}
                 </div>
              </div>
           )}

           {/* My Submissions */}
           <div className="bg-[#121417] border border-white/5 rounded-3xl overflow-hidden self-start">
              <div className="p-6 border-b border-white/5 bg-white/1">
                 <h3 className="text-xs font-mono uppercase tracking-widest text-cyan-primary flex items-center gap-2">
                    <History size={14} /> My Reports History
                 </h3>
              </div>
              <div className="overflow-x-auto">
                 <table className="w-full text-left">
                    <thead className="bg-white/1 border-b border-white/5 text-[10px] font-mono uppercase tracking-widest text-white/30">
                       <tr>
                          <th className="px-6 py-4">ID / Subject</th>
                          <th className="px-6 py-4">To Role</th>
                          <th className="px-6 py-4">Status</th>
                          <th className="px-6 py-4 text-right">Date</th>
                       </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5">
                       {loading ? (
                          <tr><td colSpan="4" className="px-6 py-12 text-center text-white/10">Scanning Database...</td></tr>
                        ) : myReports.filter(r => !searchQuery || 
                           r.subject?.toLowerCase().includes(searchQuery.toLowerCase()) || 
                           r.details?.toLowerCase().includes(searchQuery.toLowerCase())
                        ).length === 0 ? (
                           <tr><td colSpan="4" className="px-6 py-20 text-center">
                              <div className="text-white/20 text-xs font-mono uppercase tracking-widest mb-2">No matching reports</div>
                              <p className="text-[10px] text-white/10 uppercase tracking-widest italic">Encrypted archive empty</p>
                           </td></tr>
                        ) : (
                           myReports
                            .filter(r => !searchQuery || 
                              r.subject?.toLowerCase().includes(searchQuery.toLowerCase()) || 
                              r.details?.toLowerCase().includes(searchQuery.toLowerCase())
                            )
                            .map(r => (
                            <tr key={r.id} className="hover:bg-white/1 transition-colors group">
                              <td className="px-6 py-4">
                                 <div className="text-sm font-bold text-white group-hover:text-cyan-primary transition-colors">{r.subject}</div>
                                 <div className="text-[9px] font-mono text-white/20 uppercase tracking-widest">ID: {r.id.slice(-8).toUpperCase()}</div>
                              </td>
                              <td className="px-6 py-4 text-[10px] font-mono uppercase text-white/40">{r.toRole}</td>
                              <td className="px-6 py-4">
                                 <span className={`px-2.5 py-0.5 rounded-full border text-[8px] font-black uppercase tracking-widest ${getStatusColor(r.status)}`}>
                                   {r.status || 'pending'}
                                 </span>
                              </td>
                              <td className="px-6 py-4 text-right text-[10px] font-mono text-white/20">
                                 {r.createdAt?.toDate?.().toLocaleDateString('en-IN') || '—'}
                              </td>
                            </tr>
                          ))
                       )}
                    </tbody>
                 </table>
              </div>
           </div>
        </div>
      </div>

      {/* Protocol Legend */}
      <div className="bg-[#121417]/50 border border-white/5 p-6 rounded-3xl flex items-start gap-4">
         <Info size={20} className="text-cyan-primary shrink-0 mt-0.5" />
         <div>
            <h4 className="text-sm font-bold text-white mb-2 underline underline-offset-4 decoration-cyan-primary/30">Reporting Protocol</h4>
            <p className="text-[10px] font-mono text-white/30 uppercase tracking-[0.15em] leading-relaxed">
              Reports follow the live hierarchy. Clients and workers escalate to admin, and admins escalate to owner when a case needs ownership-level review.
            </p>
         </div>
      </div>
    </div>
  );
};

export default ReportsView;
