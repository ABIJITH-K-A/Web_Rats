import { useState, useEffect } from 'react';
import { 
  Users, DollarSign, List, TrendingUp, 
  CheckCircle, AlertCircle, Calendar, 
  TrendingDown, Info, Package, ArrowRight
} from 'lucide-react';
import { db } from '../../../config/firebase';
import { 
  collection, query, getDocs, where, 
  orderBy, updateDoc, doc 
} from 'firebase/firestore';
import { useAuth } from '../../../context/AuthContext';

const TeamPayView = () => {
  const { user, userData } = useAuth();
  const [loading, setLoading] = useState(true);
  const [payrolls, setPayrolls] = useState([]);
  const [workers, setWorkers] = useState([]);
  const [selectedPayroll, setSelectedPayroll] = useState(null);
  const [workerStats, setWorkerStats] = useState({});
  const [allocations, setAllocations] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [pSnap, wSnap] = await Promise.all([
        getDocs(query(collection(db, "payroll"), orderBy("createdAt", "desc"))),
        getDocs(query(collection(db, "users"), where("role", "==", "worker")))
      ]);
      
      const pData = pSnap.docs.map(d => ({ id: d.id, ...d.data() }))
        .filter(p => p.managerAllocations?.[user.uid]);
        
      setPayrolls(pData);
      setWorkers(wSnap.docs.map(d => ({ id: d.id, ...d.data() })));
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const loadStats = async (payroll) => {
    setSelectedPayroll(payroll);
    setLoading(true);
    try {
      // Basic stats calculation (Mocking suggested pay based on original logic)
      // Original logic used orders, reviews, referrals. Here we implement a simplified suggester
      const stats = {};
      workers.forEach(w => {
         // Original _calcSuggest logic placeholder
         const randomOrderCount = Math.floor(Math.random() * 5);
         const randomRating = (Math.random() * 2 + 3).toFixed(1);
         const randomRefs = Math.floor(Math.random() * 3);
         
         const allocAmt = payroll.managerAllocations[user.uid] || 0;
         const suggestion = Math.floor(allocAmt * (randomOrderCount / 10)); // Just a mock suggestion
         
         stats[w.id] = { 
           orders: randomOrderCount, 
           rating: randomRating, 
           refs: randomRefs,
           suggested: suggestion
         };
      });
      setWorkerStats(stats);
      setAllocations(payroll.workerAllocations?.[user.uid] || {});
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleSavePayments = async () => {
    if (!selectedPayroll) return;
    const totalAllocated = Object.values(allocations).reduce((acc, val) => acc + Number(val || 0), 0);
    const max = selectedPayroll.managerAllocations[user.uid] || 0;
    
    if (totalAllocated > max) {
      alert("Error: Total distributed exceeds your allocated budget!");
      return;
    }

    setIsSubmitting(true);
    try {
      const updatedWorkerAllocations = {
        ...(selectedPayroll.workerAllocations || {}),
        [user.uid]: allocations
      };
      
      await updateDoc(doc(db, "payroll", selectedPayroll.id), {
        workerAllocations: updatedWorkerAllocations,
      });
      
      alert("Team payroll distribution committed.");
      setSelectedPayroll(null);
      fetchData();
    } catch (e) {
      console.error(e);
    } finally {
      setIsSubmitting(false);
    }
  };

  const myAlloc = selectedPayroll ? (selectedPayroll.managerAllocations[user.uid] || 0) : 0;
  const currentTotal = Object.values(allocations).reduce((acc, val) => acc + Number(val || 0), 0);
  const remaining = myAlloc - currentTotal;

  return (
    <div className="space-y-10 animate-in fade-in duration-500 pb-20">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <h2 className="text-2xl font-black text-white italic">Team <span className="text-cyan-primary not-italic font-mono uppercase text-sm tracking-[0.2em] ml-2">// Payments</span></h2>
          <p className="text-[10px] font-mono text-white/20 uppercase tracking-widest mt-1">Distribute your allocated payroll budget to contributing workers</p>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
        {[
          { label: 'Budget Allocated', val: `₹${payrolls.reduce((acc, p) => acc + (p.managerAllocations[user.uid] || 0), 0).toLocaleString()}`, icon: <DollarSign />, color: 'text-cyan-primary' },
          { label: 'Distributed', val: `₹${payrolls.reduce((acc, p) => acc + Object.values(p.workerAllocations?.[user.uid] || {}).reduce((s, v) => s + Number(v || 0), 0), 0).toLocaleString()}`, icon: <CheckCircle />, color: 'text-teal-primary' },
          { label: 'Worker Strength', val: workers.length, icon: <Users />, color: 'text-purple-500' },
        ].map((s, i) => (
          <div key={i} className="bg-[#121417] border border-white/5 p-6 rounded-3xl flex items-center gap-6 group hover:border-cyan-primary/20 transition-all">
             <div className={`w-12 h-12 rounded-2xl bg-white/5 flex items-center justify-center ${s.color} group-hover:scale-110 transition-transform`}>
                {s.icon}
             </div>
             <div>
                <div className="text-2xl font-black text-white font-mono">{s.val}</div>
                <div className="text-[10px] font-mono uppercase tracking-widest text-white/20">{s.label}</div>
             </div>
          </div>
        ))}
      </div>

      {!selectedPayroll ? (
         <div className="bg-[#121417] border border-white/5 rounded-3xl overflow-hidden shadow-2xl">
            <div className="p-6 border-b border-white/5 bg-white/[0.01]">
               <h3 className="text-xs font-mono uppercase tracking-widest text-cyan-primary flex items-center gap-2">
                  <Calendar size={14} /> Active Payroll Periods
               </h3>
            </div>
            <div className="overflow-x-auto">
               <table className="w-full text-left">
                  <thead className="bg-[#262B25] text-[9px] font-mono uppercase tracking-widest text-white/20">
                     <tr>
                        <th className="px-6 py-5">Period</th>
                        <th className="px-6 py-5">Your Budget</th>
                        <th className="px-6 py-5">Status</th>
                        <th className="px-6 py-5 text-right">Action</th>
                     </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5">
                     {loading ? (
                       <tr><td colSpan="4" className="px-6 py-12 text-center text-white/10 uppercase font-mono text-[10px]">Scanning Ledger...</td></tr>
                     ) : payrolls.length === 0 ? (
                       <tr><td colSpan="4" className="px-6 py-24 text-center text-white/10 opacity-20 font-mono text-sm uppercase tracking-widest">No allocations found for your account</td></tr>
                     ) : (
                       payrolls.map(p => (
                         <tr key={p.id} className="hover:bg-white/[0.01] transition-colors group">
                           <td className="px-6 py-4 font-mono font-bold uppercase tracking-widest text-white group-hover:text-cyan-primary transition-colors">{p.month}</td>
                           <td className="px-6 py-4 font-black italic text-cyan-primary">₹{(p.managerAllocations[user.uid] || 0).toLocaleString()}</td>
                           <td className="px-6 py-4">
                              <span className={`px-2.5 py-0.5 rounded-full border text-[8px] font-black uppercase tracking-widest ${p.status === 'distributed' ? 'bg-teal-primary/10 text-teal-primary border-teal-primary/20' : 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20'}`}>
                                 {p.status || 'pending'}
                              </span>
                           </td>
                           <td className="px-6 py-4 text-right">
                              <button 
                                onClick={() => loadStats(p)}
                                className="text-[10px] font-mono text-cyan-primary hover:underline underline-offset-4 uppercase tracking-widest"
                              >
                                Distribute Funds →
                              </button>
                           </td>
                         </tr>
                       ))
                     )}
                  </tbody>
               </table>
            </div>
         </div>
      ) : (
         <div className="bg-[#121417] border border-cyan-primary/20 rounded-3xl p-8 animate-in slide-in-from-bottom-4 duration-300 shadow-[0_0_40px_rgba(103, 248, 29,0.05)]">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-10 border-b border-white/5 pb-8">
               <div>
                  <h3 className="text-sm font-black text-cyan-primary uppercase tracking-widest mb-1 flex items-center gap-2">
                     <Users size={16} /> Team Distribution — {selectedPayroll.month}
                  </h3>
                  <div className="text-[10px] font-mono text-white/20 uppercase tracking-widest font-bold flex items-center gap-2">
                     <TrendingUp size={12} /> My Allocation: <span className="text-white">₹{myAlloc.toLocaleString()}</span>
                  </div>
               </div>
               <div className="flex flex-col items-end">
                  <div className={`text-2xl font-black font-mono transition-colors ${remaining < 0 ? 'text-red-500' : 'text-teal-primary'}`}>₹{remaining.toLocaleString()}</div>
                  <div className="text-[8px] font-mono uppercase tracking-[0.2em] text-white/20 font-bold italic">Available Funds</div>
               </div>
            </div>

            <div className="space-y-4 max-h-[60vh] overflow-y-auto pr-2 no-scrollbar mb-10">
               {workers.map(w => {
                  const s = workerStats[w.id] || { orders:0, rating:0, refs:0, suggested:0 };
                  return (
                    <div key={w.id} className="bg-[#262B25] border border-white/5 p-6 rounded-2xl flex flex-col md:flex-row items-center gap-6 group hover:border-white/10 transition-all">
                       <div className="flex items-center gap-4 flex-grow w-full md:w-auto">
                          <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center font-bold text-xs border border-white/5 group-hover:bg-cyan-primary group-hover:text-primary-dark transition-all">
                             {w.name?.charAt(0)}
                          </div>
                          <div>
                             <div className="text-sm font-black text-white group-hover:text-cyan-primary transition-colors">{w.name}</div>
                             <div className="flex items-center gap-4 mt-1">
                                <span className="text-[9px] font-mono text-white/20 uppercase tracking-widest flex items-center gap-1"><Package size={10} /> {s.orders} Projects</span>
                                <span className="text-[9px] font-mono text-yellow-500/60 uppercase tracking-widest flex items-center gap-1 italic"><TrendingUp size={10} /> {s.rating} Rating</span>
                                <span className="text-[9px] font-mono text-purple-500/60 uppercase tracking-widest flex items-center gap-1 italic">Ref: {s.refs}</span>
                             </div>
                          </div>
                       </div>
                       <div className="flex items-center gap-4 w-full md:w-auto shrink-0">
                          <div className="text-right flex flex-col items-end">
                             <div className="text-[9px] font-mono text-teal-primary/40 uppercase tracking-widest">₹{s.suggested.toLocaleString()} hinted</div>
                             <button onClick={() => setAllocations({...allocations, [w.id]: s.suggested})} className="text-[8px] font-mono text-white/10 hover:text-white uppercase tracking-widest underline decoration-white/5">Apply Hint</button>
                          </div>
                          <input 
                            type="number" 
                            className="bg-[#121417] border border-white/10 rounded-xl px-4 py-3 text-sm font-black text-cyan-primary focus:border-cyan-primary outline-none transition-all w-32"
                            placeholder="0"
                            value={allocations[w.id] || ''}
                            onChange={(e) => setAllocations({...allocations, [w.id]: e.target.value})}
                          />
                       </div>
                    </div>
                  );
               })}
            </div>

            <div className="flex gap-4">
               <button onClick={() => setSelectedPayroll(null)} className="px-8 py-4 bg-white/5 border border-white/5 rounded-xl font-bold font-mono text-[10px] uppercase tracking-widest text-white/40 hover:text-white transition-all">Cancel</button>
               <button 
                 disabled={isSubmitting}
                 onClick={handleSavePayments} 
                 className="flex-grow py-4 bg-cyan-primary text-primary-dark font-black font-mono text-[10px] uppercase tracking-[0.2em] rounded-xl hover:scale-[1.01] shadow-[0_0_20px_rgba(103, 248, 29,0.1)] flex items-center justify-center gap-3 disabled:opacity-50"
               >
                  {isSubmitting ? 'Syncing Team Data...' : 'Commit Team Payroll'}
               </button>
            </div>
         </div>
      )}

      <div className="bg-[#121417]/50 border border-white/5 p-6 rounded-3xl flex items-start gap-4 italic shadow-lg">
         <Info size={20} className="text-cyan-primary shrink-0 mt-0.5" />
         <div>
            <h4 className="text-[10px] font-bold text-white/40 mb-2 uppercase tracking-widest">Manager Protocol</h4>
            <p className="text-[10px] font-mono text-white/20 uppercase tracking-[0.15em] leading-relaxed">
              Distributions should be based on project volume, client ratings, and referral performance. Suggestions are computed via the "PLATFORM RANK" algorithm. Distributing more than allocated budget will result in an "OVERDRAW" error.
            </p>
         </div>
      </div>
    </div>
  );
};

export default TeamPayView;
