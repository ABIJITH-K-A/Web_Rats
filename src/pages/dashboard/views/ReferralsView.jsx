import { useState, useEffect } from 'react';
import { 
  Ticket, User, Clock, CheckCircle, 
  ChevronRight, TrendingUp, HelpCircle
} from 'lucide-react';
import { db } from '../../../config/firebase';
import { collection, getDocs, doc, getDoc } from 'firebase/firestore';

const ReferralsView = () => {
  const [codes, setCodes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [ownerNames, setOwnerNames] = useState({});

  useEffect(() => {
    fetchCodes();
  }, []);

  const fetchCodes = async () => {
    setLoading(true);
    try {
      const snap = await getDocs(collection(db, "referralCodes"));
      const codeData = snap.docs.map(d => ({ id: d.id, ...d.data() }));
      setCodes(codeData);
      
      // Fetch owners
      const uids = [...new Set(codeData.map(c => c.ownerUid))].filter(Boolean);
      const names = {};
      await Promise.all(uids.map(async uid => {
        const uSnap = await getDoc(doc(db, "users", uid));
        names[uid] = uSnap.exists() ? uSnap.data().name : 'Unknown';
      }));
      setOwnerNames(names);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const getRoleColor = (role) => {
    switch(role) {
      case 'owner': return 'text-red-500 bg-red-500/10 border-red-500/20';
      case 'superadmin': return 'text-purple-500 bg-purple-500/10 border-purple-500/20';
      case 'admin': return 'text-blue-500 bg-blue-500/10 border-blue-500/20';
      case 'manager': return 'text-teal-500 bg-teal-500/10 border-teal-500/20';
      case 'worker': return 'text-cyan-primary bg-cyan-primary/10 border-cyan-primary/20';
      default: return 'text-white/40 bg-white/5 border-white/10';
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <h2 className="text-2xl font-black text-white italic">Referral <span className="text-cyan-primary not-italic font-mono uppercase text-sm tracking-[0.2em] ml-2">Registry</span></h2>
          <p className="text-[10px] font-mono text-white/20 uppercase tracking-widest mt-1">Live tracking of active discount tokens and distribution analytics</p>
        </div>
        <div className="bg-[#121417] border border-white/5 px-6 py-3 rounded-2xl flex items-center gap-6 divide-x divide-white/5 shadow-xl">
           <div className="flex items-center gap-3">
              <div className="text-xl font-black text-cyan-primary font-mono">{codes.length}</div>
              <div className="text-[8px] font-mono uppercase tracking-[0.2em] text-white/20">Active<br/>Tokens</div>
           </div>
           <div className="flex items-center gap-3 pl-6">
              <div className="text-xl font-black text-teal-primary font-mono">{codes.reduce((acc, c) => acc + (c.timesUsed || 0), 0)}</div>
              <div className="text-[8px] font-mono uppercase tracking-[0.2em] text-white/20">Total<br/>Conversions</div>
           </div>
        </div>
      </div>

      <div className="bg-[#121417] border border-white/5 rounded-3xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-white/2 border-b border-white/5 text-[10px] font-mono uppercase tracking-widest text-white/30">
              <tr>
                <th className="px-6 py-5">Token Code</th>
                <th className="px-6 py-5">Owner / Origin</th>
                <th className="px-6 py-5">Assigned Role</th>
                <th className="px-6 py-5">Benefit</th>
                <th className="px-6 py-5">Usage Count</th>
                <th className="px-6 py-5">Genesis Date</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {loading ? (
                <tr><td colSpan="6" className="px-6 py-20 text-center text-white/20 font-mono text-xs animate-pulse tracking-[0.2em] uppercase">Decrypting Token Network...</td></tr>
              ) : codes.length === 0 ? (
                <tr><td colSpan="6" className="px-6 py-20 text-center text-white/20 font-mono text-xs uppercase tracking-widest">No active referrals found</td></tr>
              ) : (
                codes.map(c => (
                  <tr key={c.id} className="hover:bg-white/5 transition-colors group">
                    <td className="px-6 py-4">
                       <span className="font-mono text-xs font-black text-cyan-primary bg-cyan-primary/5 border border-cyan-primary/10 px-3 py-1.5 rounded-lg tracking-widest uppercase">
                         {c.id}
                       </span>
                    </td>
                    <td className="px-6 py-4">
                       <div className="text-sm font-bold text-white/80">{ownerNames[c.ownerUid] || '...'}</div>
                       <div className="text-[10px] text-white/20 font-mono italic">UID: {c.ownerUid?.slice(0, 8)}...</div>
                    </td>
                    <td className="px-6 py-4">
                       <span className={`px-2 py-0.5 rounded-full border text-[8px] font-black uppercase tracking-widest ${getRoleColor(c.role)}`}>
                         {c.role || 'worker'}
                       </span>
                    </td>
                    <td className="px-6 py-4">
                       <div className="flex items-center gap-2">
                          <span className="text-sm font-black italic text-teal-primary">{c.discountPercent}%</span>
                          <span className="text-[8px] font-mono text-white/20 uppercase tracking-widest">OFF</span>
                       </div>
                    </td>
                    <td className="px-6 py-4">
                       <div className="flex items-center gap-2">
                          <div className="text-lg font-black text-white py-1 transition-all group-hover:scale-110">{c.timesUsed || 0}</div>
                          <TrendingUp size={14} className="text-green-500/30 group-hover:text-green-500 transition-colors" />
                       </div>
                    </td>
                    <td className="px-6 py-4 text-white/20 font-mono text-[10px] uppercase truncate">
                       {c.createdAt?.toDate?.().toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) || '—'}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
      
      {/* Legend / Info */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
         <div className="p-6 bg-[#121417]/50 border border-white/5 rounded-2xl flex items-start gap-4">
            <div className="w-10 h-10 rounded-xl bg-cyan-primary/5 border border-cyan-primary/20 flex items-center justify-center text-cyan-primary shrink-0">
               <HelpCircle size={20} />
            </div>
            <div>
               <h4 className="text-sm font-bold text-white mb-2 underline underline-offset-4 decoration-cyan-primary/30">Referral Protocol</h4>
               <p className="text-[10px] font-mono text-white/30 uppercase tracking-widest leading-relaxed">
                 Tokens are automatically generated for staff. Worker/Manager codes give 5-10% off. Admin/Super codes give 15-20% off. Conversion data resets monthly for payroll.
               </p>
            </div>
         </div>
      </div>
    </div>
  );
};

export default ReferralsView;
