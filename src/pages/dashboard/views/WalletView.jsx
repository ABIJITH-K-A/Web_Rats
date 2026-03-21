import { useState, useEffect } from 'react';
import { 
  Wallet, Clock, Calendar, Coins, RefreshCw, 
  ArrowUpRight, HandCoins, History, CheckCircle,
  AlertCircle
} from 'lucide-react';
import { db } from '../../../config/firebase';
import { 
  collection, query, getDocs, where, addDoc, 
  serverTimestamp, orderBy 
} from 'firebase/firestore';
import { useAuth } from '../../../context/AuthContext';

const WalletView = () => {
  const { user, userData } = useAuth();
  const [loading, setLoading] = useState(true);
  const [payouts, setPayouts] = useState([]);
  const [payoutForm, setPayoutForm] = useState({ amount: '', method: 'upi', note: '' });
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    fetchPayouts();
  }, []);

  const fetchPayouts = async () => {
    setLoading(true);
    try {
      const q = query(collection(db, "payoutRequests"), where("userId", "==", user.uid), orderBy("createdAt", "desc"));
      const snap = await getDocs(q);
      setPayouts(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmitPayout = async (e) => {
    e.preventDefault();
    if (!payoutForm.amount || payoutForm.amount <= 0) return;
    setIsSubmitting(true);
    try {
      await addDoc(collection(db, "payoutRequests"), {
        userId: user.uid,
        userName: userData.name,
        amount: Number(payoutForm.amount),
        method: payoutForm.method,
        note: payoutForm.note,
        status: "pending",
        createdAt: serverTimestamp()
      });
      setPayoutForm({ amount: '', method: 'upi', note: '' });
      fetchPayouts();
      alert("Payout request submitted successfully!");
    } catch (e) {
      console.error(e);
    } finally {
      setIsSubmitting(false);
    }
  };

  const getStatusColor = (s) => {
    switch(s) {
      case 'pending': return 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20';
      case 'approved': return 'bg-green-500/10 text-green-500 border-green-500/20';
      case 'paid': return 'bg-cyan-primary/10 text-cyan-primary border-cyan-primary/20';
      case 'rejected': return 'bg-red-500/10 text-red-500 border-red-500/20';
      default: return 'bg-white/5 text-white/40 border-white/10';
    }
  };

  return (
    <div className="space-y-10 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <h2 className="text-2xl font-black text-white italic">Wallet <span className="text-cyan-primary not-italic font-mono uppercase text-sm tracking-[0.2em] ml-2">// Earnings & Payouts</span></h2>
          <p className="text-[10px] font-mono text-white/20 uppercase tracking-widest mt-1">Salary balance, requested withdrawals, and payment timeline</p>
        </div>
        <button className="flex items-center gap-2 text-[10px] font-mono uppercase tracking-widest text-cyan-primary/60 hover:text-cyan-primary transition-colors">
          <RefreshCw size={14} /> Refresh Ledger
        </button>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
        {[
          { label: 'Available Balance', val: '₹0', icon: <Wallet />, color: 'text-cyan-primary', bg: 'bg-cyan-primary/5' },
          { label: 'Pending Approval', val: '₹0', icon: <Clock />, color: 'text-yellow-500', bg: 'bg-yellow-500/5' },
          { label: 'Next Pay Cycle', val: '1st April', icon: <Calendar />, color: 'text-blue-500', bg: 'bg-blue-500/5' },
          { label: 'Lifetime Paid', val: '₹0', icon: <Coins />, color: 'text-purple-500', bg: 'bg-purple-500/5' },
        ].map((s, i) => (
          <div key={i} className={`border border-white/5 p-6 rounded-3xl group transition-all hover:border-white/20 ${s.bg}`}>
             <div className={`w-12 h-12 rounded-2xl bg-white/5 flex items-center justify-center ${s.color} mb-4 group-hover:scale-110 transition-transform`}>
                {s.icon}
             </div>
             <div className="text-2xl font-black text-white font-mono mb-1">{s.val}</div>
             <div className="text-[10px] font-mono uppercase tracking-widest text-white/30">{s.label}</div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Request Payout Form */}
        <div className="bg-[#121417] border border-white/5 rounded-3xl p-8">
           <h3 className="text-xs font-mono uppercase tracking-widest text-cyan-primary mb-8 flex items-center gap-2">
              <HandCoins size={14} /> Request Payout
           </h3>
           <form onSubmit={handleSubmitPayout} className="space-y-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                 <div className="space-y-1">
                    <label className="text-[10px] uppercase font-mono tracking-widest text-white/20">Amount (INR) *</label>
                    <input 
                      required type="number" 
                      className="w-full bg-[#0B0C10] border border-white/10 rounded-xl px-4 py-3 text-sm focus:border-cyan-primary outline-none transition-all"
                      placeholder="e.g. 5000"
                      value={payoutForm.amount}
                      onChange={(e) => setPayoutForm({...payoutForm, amount: e.target.value})}
                    />
                 </div>
                 <div className="space-y-1">
                    <label className="text-[10px] uppercase font-mono tracking-widest text-white/20">Method *</label>
                    <select 
                      className="w-full bg-[#0B0C10] border border-white/10 rounded-xl px-4 py-3 text-sm focus:border-cyan-primary outline-none transition-all uppercase font-mono tracking-widest text-[10px]"
                      value={payoutForm.method}
                      onChange={(e) => setPayoutForm({...payoutForm, method: e.target.value})}
                    >
                       <option value="upi">UPI Transfer</option>
                       <option value="bank">Bank Transfer</option>
                       <option value="cash">Cash Collection</option>
                    </select>
                 </div>
              </div>
              <div className="space-y-1">
                 <label className="text-[10px] uppercase font-mono tracking-widest text-white/20">Payment Details / Notes</label>
                 <textarea 
                   className="w-full bg-[#0B0C10] border border-white/10 rounded-xl px-4 py-3 text-sm focus:border-cyan-primary outline-none min-h-[100px] resize-none transition-all"
                   placeholder="Enter UPI ID or Bank details (A/C Name, Number, IFSC)"
                   value={payoutForm.note}
                   onChange={(e) => setPayoutForm({...payoutForm, note: e.target.value})}
                 ></textarea>
              </div>
              <button 
                disabled={isSubmitting}
                className="w-full py-4 bg-cyan-primary text-primary-dark font-black text-sm uppercase tracking-widest rounded-xl hover:scale-[1.02] active:scale-95 transition-all shadow-[0_0_20px_rgba(102,252,241,0.2)] disabled:opacity-50"
              >
                {isSubmitting ? 'Processing Transaction...' : 'Submit Withdrawal Request'}
              </button>
           </form>
        </div>

        {/* Payout History */}
        <div className="bg-[#121417] border border-white/5 rounded-3xl overflow-hidden flex flex-col self-start">
           <div className="p-6 border-b border-white/5 bg-white/[0.01] flex items-center justify-between">
              <h3 className="text-xs font-mono uppercase tracking-widest text-cyan-primary flex items-center gap-2">
                 <History size={14} /> Payout Logs
              </h3>
              <div className="text-[10px] font-mono text-white/20 uppercase tracking-widest">Recent 20 cycles</div>
           </div>
           <div className="overflow-x-auto">
              <table className="w-full text-left">
                 <thead className="bg-[#0B0C10] text-[9px] font-mono uppercase tracking-widest text-white/20">
                    <tr>
                       <th className="px-6 py-4">Request ID</th>
                       <th className="px-6 py-4">Amount</th>
                       <th className="px-6 py-4">Method</th>
                       <th className="px-6 py-4">Status</th>
                    </tr>
                 </thead>
                 <tbody className="divide-y divide-white/5">
                    {loading ? (
                       <tr><td colSpan="4" className="px-6 py-12 text-center text-white/10">Loading Records...</td></tr>
                    ) : payouts.length === 0 ? (
                       <tr><td colSpan="4" className="px-6 py-20 text-center">
                          <div className="text-white/20 text-xs font-mono uppercase tracking-widest italic mb-2">No transaction history</div>
                          <p className="text-[10px] text-white/10 uppercase tracking-widest">Withdrawals will appear here after submission</p>
                       </td></tr>
                    ) : (
                       payouts.map(p => (
                         <tr key={p.id} className="hover:bg-white/[0.01] transition-colors">
                           <td className="px-6 py-4 font-mono text-[10px] text-white/40">#{p.id.slice(-8).toUpperCase()}</td>
                           <td className="px-6 py-4 font-black italic text-cyan-primary">₹{p.amount?.toLocaleString()}</td>
                           <td className="px-6 py-4 text-[10px] font-mono uppercase text-white/40">{p.method}</td>
                           <td className="px-6 py-4">
                              <span className={`px-2.5 py-0.5 rounded-full border text-[8px] font-black uppercase tracking-widest ${getStatusColor(p.status)}`}>
                                {p.status || 'pending'}
                              </span>
                           </td>
                         </tr>
                       ))
                    )}
                 </tbody>
              </table>
           </div>
        </div>
      </div>

      {/* Info Notice */}
      <div className="bg-cyan-primary/5 border border-cyan-primary/10 p-6 rounded-3xl flex items-start gap-4">
         <AlertCircle size={20} className="text-cyan-primary shrink-0 mt-0.5" />
         <div>
            <h4 className="text-sm font-bold text-white mb-2 underline underline-offset-4 decoration-cyan-primary/30">Payment Protocol</h4>
            <p className="text-[10px] font-mono text-white/40 uppercase tracking-[0.15em] leading-relaxed">
              Standard payouts are processed on the 1st of every month. Emergency withdrawals (Min ₹1000) can be requested anytime but require 48h approval from the Finance team. Ensure your UPI details are accurate in the notes.
            </p>
         </div>
      </div>
    </div>
  );
};

export default WalletView;
