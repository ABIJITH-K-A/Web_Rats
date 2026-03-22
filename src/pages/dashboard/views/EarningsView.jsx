import { useState, useEffect } from 'react';
import { 
  TrendingUp, Star, Award, BarChart3, 
  Target, Zap, CircleDashed, Info, 
  Package, Calendar, ChevronRight, Activity
} from 'lucide-react';
import { db } from '../../../config/firebase';
import { 
  collection, query, getDocs, where, 
  orderBy, limit 
} from 'firebase/firestore';
import { useAuth } from '../../../context/AuthContext';

const EarningsView = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({ 
    totalOrders: 0, 
    avgRating: 0, 
    referralConversions: 0, 
    rank: 'Initiate' 
  });
  const [recentReviews, setRecentReviews] = useState([]);

  useEffect(() => {
    fetchPerformance();
  }, []);

  const fetchPerformance = async () => {
    setLoading(true);
    try {
      const [ordSnap, revSnap] = await Promise.all([
        getDocs(query(collection(db, "orders"), where("assignedWorkers", "array-contains", user.uid), where("status", "==", "complete"))),
        getDocs(query(collection(db, "reviews"), where("workerAssigned", "==", user.uid), orderBy("createdAt", "desc"), limit(5)))
      ]);

      const total = ordSnap.size;
      const reviews = revSnap.docs.map(d => ({ id: d.id, ...d.data() }));
      const sum = reviews.reduce((acc, r) => acc + (r.rating || 0), 0);
      const avg = reviews.length > 0 ? (sum / reviews.length).toFixed(1) : 0;

      setRecentReviews(reviews);
      setStats({
         totalOrders: total,
         avgRating: avg,
         referralConversions: 0, // Mocked for now
         rank: total > 20 ? 'Elite' : total > 10 ? 'Veteran' : total > 5 ? 'Specialist' : 'Initiate'
      });
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-10 animate-in fade-in duration-500 pb-20">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <h2 className="text-2xl font-black text-white italic">Performance <span className="text-cyan-primary not-italic font-mono uppercase text-sm tracking-[0.2em] ml-2">// Metrics</span></h2>
          <p className="text-[10px] font-mono text-white/20 uppercase tracking-widest mt-1">Live tracking of your contribution throughput and quality score</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
         {[
           { label: 'Completed Jobs', val: stats.totalOrders, icon: <Package />, color: 'text-cyan-primary' },
           { label: 'Quality Score', val: stats.avgRating, icon: <Star />, color: 'text-yellow-500' },
           { label: 'Ref Conversions', val: stats.referralConversions, icon: <Target />, color: 'text-purple-500' },
           { label: 'System Rank', val: stats.rank, icon: <Award />, color: 'text-teal-primary' },
         ].map((s, i) => (
           <div key={i} className="bg-[#121417] border border-white/5 p-8 rounded-[2rem] group hover:border-cyan-primary/20 transition-all flex flex-col items-center text-center shadow-xl">
              <div className={`w-14 h-14 rounded-2xl bg-white/5 flex items-center justify-center ${s.color} mb-6 group-hover:scale-110 transition-transform`}>
                 {s.icon}
              </div>
              <div className="text-3xl font-black text-white mb-2 font-mono italic">{s.val}</div>
              <div className="text-[10px] font-mono uppercase tracking-[0.3em] text-white/20 leading-tight">{s.label}</div>
           </div>
         ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
         {/* Live Activity Chart (Mocked UI) */}
         <div className="lg:col-span-2 bg-[#121417] border border-white/5 rounded-[3rem] p-10 relative overflow-hidden flex flex-col shadow-2xl">
            <div className="flex items-center justify-between mb-12">
               <h3 className="text-xs font-mono uppercase tracking-widest text-cyan-primary flex items-center gap-3">
                  <BarChart3 size={16} /> Throughput Analytics
               </h3>
               <div className="flex gap-4">
                  <div className="flex items-center gap-2 text-[9px] font-mono text-cyan-primary uppercase tracking-widest"><CircleDashed size={10} className="animate-spin" /> Live</div>
                  <div className="text-[9px] font-mono text-white/20 uppercase tracking-widest">Wk 12 - FY2026</div>
               </div>
            </div>

            <div className="h-64 mt-auto flex items-end justify-between gap-4">
               {[40, 65, 30, 85, 45, 90, 60].map((h, i) => (
                  <div key={i} className="flex-grow flex flex-col items-center gap-4 group">
                     {/* Suggestion bubble on hover maybe? */}
                     <div className="w-full bg-white/5 rounded-t-xl relative overflow-hidden group-hover:bg-white/10 transition-all" style={{ height: `${h}%` }}>
                        <div className="absolute inset-0 bg-gradient-to-t from-cyan-primary/20 to-transparent translate-y-full group-hover:translate-y-0 transition-transform duration-700" />
                     </div>
                     <div className="text-[9px] font-mono text-white/20 opacity-40 group-hover:opacity-100 transition-opacity">0{i+1} Mar</div>
                  </div>
               ))}
            </div>

            {/* Background elements */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-px bg-white/5" />
            <div className="absolute bottom-0 left-0 right-0 h-1/3 bg-gradient-to-t from-cyan-primary/[0.02] to-transparent pointer-events-none" />
         </div>

         {/* Quality Feed */}
         <div className="lg:col-span-1 bg-[#121417] border border-white/5 rounded-[3rem] p-10 flex flex-col shadow-2xl relative">
            <h3 className="text-xs font-mono uppercase tracking-widest text-cyan-primary mb-10 flex items-center gap-3">
               <Activity size={16} /> Quality Feed
            </h3>

            <div className="space-y-8 flex-grow">
               {loading ? (
                  <div className="space-y-6">
                     {[1,2,3].map(i => <div key={i} className="h-16 bg-white/5 rounded-2xl animate-pulse" />)}
                  </div>
               ) : recentReviews.length === 0 ? (
                  <div className="h-full flex flex-col items-center justify-center opacity-20 italic font-mono text-[10px] tracking-widest uppercase py-20">
                     No feedback data
                  </div>
               ) : (
                  recentReviews.map(r => (
                     <div key={r.id} className="flex gap-4 group cursor-help">
                        <div className="w-1.5 h-1.5 rounded-full bg-cyan-primary mt-1.5 group-hover:scale-150 transition-transform shadow-[0_0_10px_rgba(103, 248, 29,0.5)]" />
                        <div>
                           <div className="flex items-center gap-2 mb-1">
                              <span className="text-[10px] font-black italic text-white/50">{r.rating}.0</span>
                              <div className="flex gap-0.5">
                                 {Array(5).fill(0).map((_, idx) => <Star key={idx} size={8} className={idx < r.rating ? 'text-cyan-primary fill-cyan-primary' : 'text-white/5'} />)}
                              </div>
                           </div>
                           <p className="text-[10px] text-white/30 truncate max-w-[180px] font-mono italic">"{r.comment || 'Performance Verified'}"</p>
                        </div>
                     </div>
                  ))
               )}
            </div>

            <button className="mt-10 pt-6 border-t border-white/5 text-[9px] font-mono text-white/20 uppercase tracking-[0.2em] hover:text-white transition-colors flex items-center justify-between group">
               Full Quality Report <ChevronRight size={14} className="group-hover:translate-x-1 transition-transform" />
            </button>
         </div>
      </div>

      <div className="bg-cyan-primary/5 border border-cyan-primary/10 p-8 rounded-[2.5rem] flex items-start gap-6 shadow-xl">
         <Zap size={24} className="text-cyan-primary shrink-0 mt-0.5" />
         <div>
            <h4 className="text-[11px] font-black text-white uppercase tracking-widest mb-2 opacity-60">Reward Algorithm Alpha</h4>
            <p className="text-xs font-mono text-white/30 uppercase tracking-[0.1em] leading-relaxed">
               Rank is computed weekly. "Elite" and "Veteran" ranks receive priority for high-budget projects and a 5-10% bonus on base payroll allocations. Quality Score is heavily weighted by the last 15 completed missions.
            </p>
         </div>
      </div>
    </div>
  );
};

export default EarningsView;
