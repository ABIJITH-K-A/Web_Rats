import { useState, useEffect } from 'react';
import { 
  DollarSign, Plus, History, 
  HandCoins, Save, X, Calendar, 
  ArrowRight, Users, CheckCircle, Info
} from 'lucide-react';
import { db } from '../../../config/firebase';
import { 
  collection, query, getDocs, where, 
  addDoc, serverTimestamp, orderBy, updateDoc, doc 
} from 'firebase/firestore';
import { useAuth } from '../../../context/AuthContext';

const PayrollView = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [payrolls, setPayrolls] = useState([]);
  const [managers, setManagers] = useState([]);
  const [showCreate, setShowCreate] = useState(false);
  const [newPayroll, setNewPayroll] = useState({ month: '', totalIncome: '' });
  const [selectedPayroll, setSelectedPayroll] = useState(null);
  const [allocations, setAllocations] = useState({});

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [pSnap, mSnap] = await Promise.all([
        getDocs(query(collection(db, "payroll"), orderBy("createdAt", "desc"))),
        getDocs(query(collection(db, "users"), where("role", "in", ["manager", "admin", "superadmin", "owner"])))
      ]);
      setPayrolls(pSnap.docs.map(d => ({ id: d.id, ...d.data() })));
      setManagers(mSnap.docs.map(d => ({ id: d.id, ...d.data() })));
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleCreatePayroll = async (e) => {
    e.preventDefault();
    if (!newPayroll.month || !newPayroll.totalIncome) return;
    try {
      await addDoc(collection(db, "payroll"), {
        month: newPayroll.month,
        totalIncome: Number(newPayroll.totalIncome),
        managerAllocations: {},
        workerAllocations: {},
        status: "pending",
        createdBy: user.uid,
        createdAt: serverTimestamp()
      });
      setNewPayroll({ month: '', totalIncome: '' });
      setShowCreate(false);
      fetchData();
      alert("Payroll period generated.");
    } catch (e) {
      console.error(e);
    }
  };

  const openAllocations = (payroll) => {
    setSelectedPayroll(payroll);
    setAllocations(payroll.managerAllocations || {});
  };

  const handleSaveAllocations = async () => {
    if (!selectedPayroll) return;
    const totalAllocated = Object.values(allocations).reduce((acc, val) => acc + Number(val || 0), 0);
    if (totalAllocated > selectedPayroll.totalIncome) {
      alert("Error: Total allocation exceeds income!");
      return;
    }

    try {
      await updateDoc(doc(db, "payroll", selectedPayroll.id), {
        managerAllocations: allocations,
        status: "allocated"
      });
      setSelectedPayroll(null);
      fetchData();
      alert("Allocations saved successfully.");
    } catch (e) {
      console.error(e);
    }
  };

  const currentTotal = Object.values(allocations).reduce((acc, val) => acc + Number(val || 0), 0);
  const remaining = selectedPayroll ? selectedPayroll.totalIncome - currentTotal : 0;

  return (
    <div className="space-y-10 animate-in fade-in duration-500 pb-20">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <h2 className="text-2xl font-black text-white italic">Payroll <span className="text-cyan-primary not-italic font-mono uppercase text-sm tracking-[0.2em] ml-2">// Control System</span></h2>
          <p className="text-[10px] font-mono text-white/20 uppercase tracking-widest mt-1">Manage platform income distribution and manager budget allocation</p>
        </div>
        {!showCreate && !selectedPayroll && (
          <button 
            onClick={() => setShowCreate(true)}
            className="flex items-center gap-3 px-6 py-3 bg-cyan-primary text-primary-dark font-black text-sm uppercase tracking-widest rounded-xl hover:scale-[1.02] active:scale-95 transition-all shadow-[0_0_20px_rgba(103, 248, 29,0.2)]"
          >
            <Plus size={18} /> New Payroll Period
          </button>
        )}
      </div>

      {showCreate && (
         <div className="bg-[#121417] border border-white/5 rounded-3xl p-8 animate-in slide-in-from-top-4 duration-300">
            <h3 className="text-xs font-mono uppercase tracking-widest text-cyan-primary mb-8 flex items-center gap-2">
               <Calendar size={14} /> Initialize Monthly Run
            </h3>
            <form onSubmit={handleCreatePayroll} className="grid grid-cols-1 md:grid-cols-3 gap-6 items-end">
               <div className="space-y-1">
                  <label className="text-[10px] uppercase font-mono tracking-widest text-white/20">Target Month *</label>
                  <input required type="month" className="w-full bg-[#262B25] border border-white/10 rounded-xl px-4 py-3 text-sm focus:border-cyan-primary outline-none transition-all" value={newPayroll.month} onChange={(e)=>setNewPayroll({...newPayroll, month: e.target.value})} />
               </div>
               <div className="space-y-1">
                  <label className="text-[10px] uppercase font-mono tracking-widest text-white/20">Total Platform Income (₹) *</label>
                  <input required type="number" className="w-full bg-[#262B25] border border-white/10 rounded-xl px-4 py-3 text-sm focus:border-cyan-primary outline-none transition-all" placeholder="50000" value={newPayroll.totalIncome} onChange={(e)=>setNewPayroll({...newPayroll, totalIncome: e.target.value})} />
               </div>
               <div className="flex gap-3">
                  <button type="submit" className="flex-grow py-3 bg-cyan-primary text-primary-dark font-black text-[10px] uppercase tracking-widest rounded-xl shadow-[0_0_15px_rgba(103, 248, 29,0.1)]">Generate Period</button>
                  <button type="button" onClick={()=>setShowCreate(false)} className="px-4 py-3 bg-white/5 border border-white/5 rounded-xl text-white/40 hover:text-white transition-colors "><X size={18}/></button>
               </div>
            </form>
         </div>
      )}

      {selectedPayroll && (
         <div className="bg-[#121417] border border-cyan-primary/20 rounded-3xl p-8 animate-in slide-in-from-bottom-4 duration-300 shadow-[0_0_40px_rgba(103, 248, 29,0.05)]">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-10 border-b border-white/5 pb-6">
               <div>
                  <h3 className="text-sm font-black text-cyan-primary uppercase tracking-widest mb-1 flex items-center gap-2">
                     <HandCoins size={16} /> Allocation Matrix — {selectedPayroll.month}
                  </h3>
                  <div className="text-[10px] font-mono text-white/20 uppercase tracking-widest italic font-bold">Income Pool: ₹{selectedPayroll.totalIncome.toLocaleString()}</div>
               </div>
               <div className="flex flex-col items-end">
                  <div className={`text-xl font-black font-mono transition-colors ${remaining < 0 ? 'text-red-500' : 'text-teal-primary'}`}>₹{remaining.toLocaleString()}</div>
                  <div className="text-[8px] font-mono uppercase tracking-widest text-white/20 font-bold italic">Available for Allocation</div>
               </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
               {managers.map(m => (
                  <div key={m.id} className="bg-[#262B25] border border-white/5 p-5 rounded-2xl group hover:border-white/10 transition-all">
                     <div className="flex items-center gap-3 mb-4">
                        <div className="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center font-bold text-[10px] border border-white/5 group-hover:bg-cyan-primary group-hover:text-white transition-all">
                           {m.name?.charAt(0)}
                        </div>
                        <div className="overflow-hidden">
                           <div className="text-xs font-bold text-white truncate">{m.name}</div>
                           <div className="text-[9px] font-mono text-white/20 uppercase tracking-widest">{m.role}</div>
                        </div>
                     </div>
                     <div className="space-y-1">
                        <label className="text-[9px] uppercase font-mono tracking-widest text-white/20">Monthly Budget (₹)</label>
                        <input 
                          type="number" 
                          className="w-full bg-[#121417] border border-white/5 rounded-xl px-4 py-2.5 text-xs font-mono text-cyan-primary focus:border-cyan-primary outline-none transition-all"
                          placeholder="0"
                          value={allocations[m.id] || ''}
                          onChange={(e) => setAllocations({...allocations, [m.id]: e.target.value})}
                        />
                     </div>
                  </div>
               ))}
            </div>

            <div className="flex gap-4">
               <button onClick={() => setSelectedPayroll(null)} className="px-8 py-3 bg-white/5 border border-white/5 rounded-xl font-bold font-mono text-[10px] uppercase tracking-widest text-white/40 hover:text-white transition-all">Cancel</button>
               <button onClick={handleSaveAllocations} className="flex-grow py-3 bg-cyan-primary text-primary-dark font-black font-mono text-[10px] uppercase tracking-[0.2em] rounded-xl hover:scale-[1.01] shadow-[0_0_20px_rgba(103, 248, 29,0.1)] flex items-center justify-center gap-3">
                  <Save size={14} /> Commit Allocation Map
               </button>
            </div>
         </div>
      )}

      {/* History Table */}
      <div className="bg-[#121417] border border-white/5 rounded-3xl overflow-hidden shadow-2xl">
         <div className="p-6 border-b border-white/5 bg-white/[0.01]">
            <h3 className="text-xs font-mono uppercase tracking-widest text-cyan-primary flex items-center gap-2">
               <History size={14} /> Execution History
            </h3>
         </div>
         <div className="overflow-x-auto">
            <table className="w-full text-left">
               <thead className="bg-[#262B25] text-[9px] font-mono uppercase tracking-widest text-white/20">
                  <tr>
                     <th className="px-6 py-5">Period Month</th>
                     <th className="px-6 py-5">Input Revenue</th>
                     <th className="px-6 py-5">Mgr Distribution</th>
                     <th className="px-6 py-5">Protocol Status</th>
                     <th className="px-6 py-5 text-right">Commit Action</th>
                  </tr>
               </thead>
               <tbody className="divide-y divide-white/5">
                  {loading ? (
                     <tr><td colSpan="5" className="px-6 py-12 text-center text-white/10 uppercase font-mono text-[10px]">Loading Ledger History...</td></tr>
                  ) : payrolls.length === 0 ? (
                     <tr><td colSpan="5" className="px-6 py-32 text-center text-white/10 opacity-20 uppercase font-mono text-xs italic tracking-widest">No payroll records initialized</td></tr>
                  ) : (
                     payrolls.map(p => (
                       <tr key={p.id} className="hover:bg-white/[0.01] transition-colors group">
                         <td className="px-6 py-4 font-mono text-sm font-bold text-white group-hover:text-cyan-primary transition-colors uppercase tracking-[0.1em]">{p.month}</td>
                         <td className="px-6 py-4 font-black italic text-cyan-primary">₹{(p.totalIncome || 0).toLocaleString()}</td>
                         <td className="px-6 py-4">
                            <div className="flex items-center gap-2">
                               <Users size={12} className="text-white/20" />
                               <span className="text-[10px] font-mono text-white/60">{Object.keys(p.managerAllocations || {}).length} Managers Loaded</span>
                            </div>
                         </td>
                         <td className="px-6 py-4">
                            <span className={`px-2.5 py-0.5 rounded-full border text-[8px] font-black uppercase tracking-widest ${p.status === 'allocated' ? 'bg-cyan-primary/10 text-cyan-primary border-cyan-primary/20' : 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20'}`}>
                               {p.status || 'pending'}
                            </span>
                         </td>
                         <td className="px-6 py-4 text-right">
                            <button 
                              onClick={() => openAllocations(p)}
                              className="text-[10px] font-mono text-white/20 hover:text-cyan-primary uppercase tracking-widest flex items-center gap-2 ml-auto"
                            >
                               Configure <ArrowRight size={12} />
                            </button>
                         </td>
                       </tr>
                     ))
                  )}
               </tbody>
            </table>
         </div>
      </div>

      <div className="bg-[#121417]/50 border border-white/5 p-6 rounded-3xl flex items-start gap-4 italic">
         <Info size={20} className="text-cyan-primary shrink-0 mt-0.5" />
         <div>
            <h4 className="text-[10px] font-bold text-white/40 mb-2 uppercase tracking-widest">Administrator Protocol</h4>
            <p className="text-[10px] font-mono text-white/20 uppercase tracking-[0.15em] leading-relaxed">
              Platform Income is the total revenue collected from clients. Admins must allocate budgets to Managers, who then distribute to workers based on project metrics. Allocations are immutable once the period status moves to "COMMIT".
            </p>
         </div>
      </div>
    </div>
  );
};

export default PayrollView;
