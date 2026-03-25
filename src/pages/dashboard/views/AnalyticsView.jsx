import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, 
  AreaChart, Area, PieChart, Pie, Cell, Legend
} from 'recharts';
import { 
  TrendingUp, Users, DollarSign, Package, CheckCircle, 
  ArrowUpRight, ArrowDownRight, Activity
} from 'lucide-react';
import { db } from '../../../config/firebase';
import { collection, getDocs, query, orderBy } from 'firebase/firestore';
import { normalizeOrderStatus } from '../../../utils/orderHelpers';

const AnalyticsView = () => {
  const [data, setData] = useState({
    revenue: [],
    services: [],
    performance: [],
    stats: {
      totalRevenue: 0,
      totalOrders: 0,
      activeUsers: 0,
      completionRate: 0
    }
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAnalytics = async () => {
      try {
        const ordSnap = await getDocs(query(collection(db, "orders"), orderBy("createdAt", "asc")));
        const userSnap = await getDocs(collection(db, "users"));
        
        const orders = ordSnap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        const users = userSnap.docs.map(doc => ({ id: doc.id, ...doc.data() }));

        // Process Revenue over time
        const revenueMap = {};
        orders.forEach(o => {
          if (!o.createdAt) return;
          const date = o.createdAt.toDate().toLocaleDateString('en-IN', { month: 'short', day: 'numeric' });
          revenueMap[date] = (revenueMap[date] || 0) + (o.paymentStatus === 'paid' ? Number(o.finalPrice || 0) : 0);
        });
        const revenueData = Object.keys(revenueMap).map(date => ({ date, amount: revenueMap[date] }));

        // Process Services distribution
        const serviceMap = {};
        orders.forEach(o => {
          const s = o.service || 'Unknown';
          serviceMap[s] = (serviceMap[s] || 0) + 1;
        });
        const serviceData = Object.keys(serviceMap).map(name => ({ name, value: serviceMap[name] }));

        // Stats
        const totalRevenue = orders.reduce((s, o) => s + (o.paymentStatus === 'paid' ? Number(o.finalPrice || 0) : 0), 0);
        const completed = orders.filter(
          (order) => normalizeOrderStatus(order.status) === 'completed'
        ).length;

        setData({
          revenue: revenueData,
          services: serviceData,
          stats: {
            totalRevenue,
            totalOrders: orders.length,
            activeUsers: users.length,
            completionRate: Math.round((completed / orders.length) * 100) || 0
          }
        });
      } catch (e) {
        console.error("Analytics Error:", e);
      } finally {
        setLoading(false);
      }
    };
    fetchAnalytics();
  }, []);

  const COLORS = ['#67F81D', '#62CB2C', '#000000', '#FFFFFF'];

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-2 border-cyan-primary border-t-transparent rounded-full animate-spin" />
          <p className="font-mono text-[10px] uppercase tracking-widest text-white/40">Decrypting Business Intel...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-10 pb-20">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <h1 className="text-3xl font-black text-white italic">Business <span className="text-cyan-primary not-italic font-mono uppercase text-sm tracking-[0.2em] ml-2">// Intelligence</span></h1>
          <p className="text-[10px] font-mono text-white/20 uppercase tracking-widest mt-1 italic font-bold">// Strategic oversight & growth metrics</p>
        </div>
      </div>

      {/* Grid Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {[
          { label: 'Platform Revenue', value: `₹${data.stats.totalRevenue.toLocaleString()}`, icon: <DollarSign />, trend: '+15%', color: 'text-green-500' },
          { label: 'Booking Volume', value: data.stats.totalOrders, icon: <Package />, trend: '+8%', color: 'text-cyan-primary' },
          { label: 'Network Reach', value: data.stats.activeUsers, icon: <Users />, trend: '+12%', color: 'text-purple-500' },
          { label: 'Fulfillment Rate', value: `${data.stats.completionRate}%`, icon: <CheckCircle />, trend: 'Optimum', color: 'text-blue-500' },
        ].map((s, i) => (
          <motion.div 
            key={i}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
            className="bg-[#121417] border border-white/5 p-8 rounded-[2rem] shadow-2xl"
          >
            <div className="flex justify-between items-start mb-6">
              <div className={`w-12 h-12 rounded-xl bg-white/5 flex items-center justify-center ${s.color}`}>
                {s.icon}
              </div>
              <div className="text-[9px] font-mono text-white/20 uppercase tracking-widest">{s.trend}</div>
            </div>
            <div className="text-2xl font-black text-white mb-1 font-mono">{s.value}</div>
            <div className="text-[10px] font-mono uppercase tracking-widest text-white/20">{s.label}</div>
          </motion.div>
        ))}
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Revenue Area Chart */}
        <div className="bg-[#121417] border border-white/5 p-8 rounded-[2.5rem] shadow-2xl h-[400px]">
          <h3 className="text-xs font-mono uppercase tracking-widest text-cyan-primary mb-8 flex items-center gap-3">
            <TrendingUp size={16} /> Revenue Stream
          </h3>
          <ResponsiveContainer width="100%" height="80%">
            <AreaChart data={data.revenue}>
              <defs>
                <linearGradient id="colorRev" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#67F81D" stopOpacity={0.3}/>
                  <stop offset="95%" stopColor="#67F81D" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
              <XAxis dataKey="date" stroke="rgba(255,255,255,0.2)" fontSize={10} axisLine={false} tickLine={false} />
              <YAxis stroke="rgba(255,255,255,0.2)" fontSize={10} axisLine={false} tickLine={false} />
              <Tooltip 
                contentStyle={{ backgroundColor: '#262B25', border: '1px solid rgba(103, 248, 29,0.2)', borderRadius: '12px' }}
                itemStyle={{ color: '#67F81D', fontSize: '12px' }}
              />
              <Area type="monotone" dataKey="amount" stroke="#67F81D" fillOpacity={1} fill="url(#colorRev)" strokeWidth={3} />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Service Distribution Pie Chart */}
        <div className="bg-[#121417] border border-white/5 p-8 rounded-[2.5rem] shadow-2xl h-[400px]">
          <h3 className="text-xs font-mono uppercase tracking-widest text-cyan-primary mb-8 flex items-center gap-3">
            <Activity size={16} /> Service Dominance
          </h3>
          <ResponsiveContainer width="100%" height="80%">
            <PieChart>
              <Pie
                data={data.services}
                cx="50%"
                cy="50%"
                innerRadius={60}
                outerRadius={100}
                paddingAngle={5}
                dataKey="value"
              >
                {data.services.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip 
                contentStyle={{ backgroundColor: '#262B25', border: '1px solid rgba(103, 248, 29,0.2)', borderRadius: '12px' }}
              />
              <Legend verticalAlign="bottom" height={36} iconType="circle" />
            </PieChart>
          </ResponsiveContainer>
        </div>

        {/* Top Workers Bar Chart */}
        <div className="lg:col-span-2 bg-[#121417] border border-white/5 p-8 rounded-[2.5rem] shadow-2xl h-[400px]">
           <h3 className="text-xs font-mono uppercase tracking-widest text-cyan-primary mb-8 flex items-center gap-3">
             <BarChart size={16} /> Protocol Efficiency (Samples/Mock)
           </h3>
           <ResponsiveContainer width="100%" height="80%">
             <BarChart data={data.revenue.slice(-7)}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                <XAxis dataKey="date" stroke="rgba(255,255,255,0.2)" fontSize={10} axisLine={false} tickLine={false} />
                <YAxis stroke="rgba(255,255,255,0.2)" fontSize={10} axisLine={false} tickLine={false} />
                <Tooltip 
                  cursor={{fill: 'rgba(255,255,255,0.02)'}}
                  contentStyle={{ backgroundColor: '#262B25', border: '1px solid rgba(103, 248, 29,0.2)', borderRadius: '12px' }}
                />
                <Bar dataKey="amount" fill="#67F81D" radius={[10, 10, 0, 0]} barSize={40} />
             </BarChart>
           </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
};

export default AnalyticsView;
