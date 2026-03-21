import { useState, useEffect } from 'react';
import { 
  Box, Send, List, Search, 
  Calendar, User, Mail, Smartphone,
  Clock, CheckCircle, XCircle, Info, ExternalLink
} from 'lucide-react';
import { db } from '../../../config/firebase';
import { 
  collection, query, getDocs, where, 
  addDoc, serverTimestamp, orderBy, updateDoc, doc 
} from 'firebase/firestore';
import { useAuth } from '../../../context/AuthContext';

const SamplesView = () => {
  const { user, userData } = useAuth();
  const [loading, setLoading] = useState(true);
  const [samples, setSamples] = useState([]);
  const [sampleForm, setSampleForm] = useState({ 
    type: 'send', clientName: '', clientEmail: '', 
    clientPhone: '', orderId: '', expectedDate: '', notes: '' 
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    fetchSamples();
  }, []);

  const fetchSamples = async () => {
    setLoading(true);
    try {
      const q = query(collection(db, "samples"), orderBy("createdAt", "desc"));
      const snap = await getDocs(q);
      setSamples(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmitSample = async (e) => {
    e.preventDefault();
    if (!sampleForm.clientName || !sampleForm.clientEmail) return;
    setIsSubmitting(true);
    try {
      await addDoc(collection(db, "samples"), {
        ...sampleForm,
        requestedBy: user.uid,
        requestedByName: userData.name,
        status: "pending",
        createdAt: serverTimestamp()
      });
      setSampleForm({ 
        type: 'send', clientName: '', clientEmail: '', 
        clientPhone: '', orderId: '', expectedDate: '', notes: '' 
      });
      fetchSamples();
      alert("Sample request recorded.");
    } catch (e) {
      console.error(e);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleUpdateStatus = async (id, status) => {
    try {
      await updateDoc(doc(db, "samples", id), { status });
      setSamples(prev => prev.map(s => s.id === id ? { ...s, status } : s));
    } catch (e) {
      console.error(e);
    }
  };

  const getStatusColor = (s) => {
    switch(s) {
      case 'pending': return 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20';
      case 'shipped': return 'bg-blue-500/10 text-blue-500 border-blue-500/20';
      case 'delivered': return 'bg-green-500/10 text-green-500 border-green-500/20';
      case 'cancelled': return 'bg-red-500/10 text-red-500 border-red-500/20';
      default: return 'bg-white/5 text-white/40 border-white/10';
    }
  };

  return (
    <div className="space-y-10 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <h2 className="text-2xl font-black text-white italic">Samples <span className="text-cyan-primary not-italic font-mono uppercase text-sm tracking-[0.2em] ml-2">// Exchange</span></h2>
          <p className="text-[10px] font-mono text-white/20 uppercase tracking-widest mt-1">Manage physical/digital sample logistics for client projects</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Sample Request Form */}
        <div className="lg:col-span-1 bg-[#121417] border border-white/5 rounded-3xl p-8 self-start sticky top-28">
           <h3 className="text-xs font-mono uppercase tracking-widest text-cyan-primary mb-8 flex items-center gap-2">
              <Box size={14} /> Log Sample Movement
           </h3>
           <form onSubmit={handleSubmitSample} className="space-y-4">
              <div className="space-y-1">
                 <label className="text-[10px] uppercase font-mono tracking-widest text-white/20">Movement Type *</label>
                 <select 
                    className="w-full bg-[#0B0C10] border border-white/10 rounded-xl px-4 py-3 text-sm focus:border-cyan-primary outline-none transition-all uppercase font-mono tracking-widest text-[10px]"
                    value={sampleForm.type}
                    onChange={(e) => setSampleForm({...sampleForm, type: e.target.value})}
                 >
                    <option value="send">Send to Client</option>
                    <option value="receive">Receive from Client</option>
                 </select>
              </div>
              <div className="grid grid-cols-1 gap-4">
                 <div className="space-y-1">
                    <label className="text-[10px] uppercase font-mono tracking-widest text-white/20">Client Name *</label>
                    <input 
                      required type="text"
                      className="w-full bg-[#0B0C10] border border-white/10 rounded-xl px-4 py-3 text-sm focus:border-cyan-primary outline-none transition-all"
                      placeholder="Full Name"
                      value={sampleForm.clientName}
                      onChange={(e) => setSampleForm({...sampleForm, clientName: e.target.value})}
                    />
                 </div>
                 <div className="space-y-1">
                    <label className="text-[10px] uppercase font-mono tracking-widest text-white/20">Client Contact Info *</label>
                    <div className="grid grid-cols-2 gap-2">
                       <input 
                         required type="email"
                         className="w-full bg-[#0B0C10] border border-white/10 rounded-xl px-4 py-3 text-[10px] focus:border-cyan-primary outline-none transition-all"
                         placeholder="Email Address"
                         value={sampleForm.clientEmail}
                         onChange={(e) => setSampleForm({...sampleForm, clientEmail: e.target.value})}
                       />
                       <input 
                         type="tel"
                         className="w-full bg-[#0B0C10] border border-white/10 rounded-xl px-4 py-3 text-[10px] focus:border-cyan-primary outline-none transition-all"
                         placeholder="Phone (Optional)"
                         value={sampleForm.clientPhone}
                         onChange={(e) => setSampleForm({...sampleForm, clientPhone: e.target.value})}
                       />
                    </div>
                 </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                 <div className="space-y-1">
                    <label className="text-[10px] uppercase font-mono tracking-widest text-white/20">Order ID</label>
                    <input 
                      type="text"
                      className="w-full bg-[#0B0C10] border border-white/10 rounded-xl px-4 py-3 text-sm focus:border-cyan-primary outline-none transition-all"
                      placeholder="#DE23..."
                      value={sampleForm.orderId}
                      onChange={(e) => setSampleForm({...sampleForm, orderId: e.target.value})}
                    />
                 </div>
                 <div className="space-y-1">
                    <label className="text-[10px] uppercase font-mono tracking-widest text-white/20">Expected Date</label>
                    <input 
                      type="date"
                      className="w-full bg-[#0B0C10] border border-white/10 rounded-xl px-4 py-3 text-xs focus:border-cyan-primary outline-none transition-all text-white/40"
                      value={sampleForm.expectedDate}
                      onChange={(e) => setSampleForm({...sampleForm, expectedDate: e.target.value})}
                    />
                 </div>
              </div>
              <div className="space-y-1">
                 <label className="text-[10px] uppercase font-mono tracking-widest text-white/20">Logistics Notes</label>
                 <textarea 
                    className="w-full bg-[#0B0C10] border border-white/10 rounded-xl px-4 py-3 text-sm focus:border-cyan-primary outline-none min-h-[80px] resize-none transition-all"
                    placeholder="Address, Tracking ID, or descriptions..."
                    value={sampleForm.notes}
                    onChange={(e) => setSampleForm({...sampleForm, notes: e.target.value})}
                 ></textarea>
              </div>
              <button 
                disabled={isSubmitting}
                className="w-full py-4 bg-cyan-primary text-primary-dark font-black text-sm uppercase tracking-widest rounded-xl hover:scale-[1.02] active:scale-95 transition-all shadow-[0_0_20px_rgba(102,252,241,0.2)] disabled:opacity-50"
              >
                {isSubmitting ? 'Recording Log...' : 'Confirm Shipment Log'}
              </button>
           </form>
        </div>

        {/* Samples Table */}
        <div className="lg:col-span-2 bg-[#121417] border border-white/5 rounded-3xl overflow-hidden self-start flex flex-col shadow-2xl">
           <div className="p-6 border-b border-white/5 bg-white/[0.01] flex items-center justify-between">
              <h3 className="text-xs font-mono uppercase tracking-widest text-cyan-primary flex items-center gap-2">
                 <List size={14} /> Logistics Registry
              </h3>
              <div className="text-[10px] font-mono text-white/20 uppercase tracking-widest flex items-center gap-2">
                 <Clock size={12} /> Real-time tracking
              </div>
           </div>
           <div className="overflow-x-auto">
              <table className="w-full text-left">
                 <thead className="bg-[#0B0C10] text-[9px] font-mono uppercase tracking-widest text-white/20">
                    <tr>
                       <th className="px-6 py-4">Status / Type</th>
                       <th className="px-6 py-4">Client Detail</th>
                       <th className="px-6 py-4">Project Map</th>
                       <th className="px-6 py-4 text-center">Protocol Action</th>
                    </tr>
                 </thead>
                 <tbody className="divide-y divide-white/5">
                    {loading ? (
                       <tr><td colSpan="4" className="px-6 py-12 text-center text-white/10 uppercase font-mono text-[10px] tracking-widest animate-pulse">Scanning Registry...</td></tr>
                    ) : samples.length === 0 ? (
                       <tr><td colSpan="4" className="px-6 py-32 text-center opacity-20 italic font-mono text-sm tracking-widest uppercase flex flex-col items-center">
                          <Box size={40} className="mb-4" />
                          No sample logs found
                       </td></tr>
                    ) : (
                       samples.map(s => (
                         <tr key={s.id} className="hover:bg-white/[0.01] transition-colors group">
                           <td className="px-6 py-8">
                              <div className={`px-2.5 py-0.5 rounded-full border text-[8px] font-black uppercase tracking-widest mb-2 inline-block ${getStatusColor(s.status)}`}>
                                {s.status || 'pending'}
                              </div>
                              <div className="text-[10px] font-mono text-white/20 uppercase tracking-widest flex items-center gap-2">
                                 {s.type === 'send' ? <Send size={10} className="text-cyan-primary" /> : <Box size={10} className="text-teal-primary" />}
                                 {s.type === 'send' ? 'Outgoing' : 'Incoming'}
                              </div>
                           </td>
                           <td className="px-6 py-8">
                              <div className="text-sm font-bold text-white group-hover:text-cyan-primary transition-colors">{s.clientName}</div>
                              <div className="text-[10px] font-mono text-white/20 flex flex-col mt-1">
                                 <span>{s.clientEmail}</span>
                                 <span>{s.clientPhone || 'No Phone'}</span>
                              </div>
                           </td>
                           <td className="px-6 py-8">
                              <div className="text-xs font-bold text-white/60 mb-1 flex items-center gap-2 italic truncate max-w-[140px]">
                                 {s.orderId ? `Order: ${s.orderId}` : 'Ad-hoc Sample'}
                              </div>
                              <div className="text-[10px] font-mono text-white/20 uppercase tracking-widest flex items-center gap-1.5">
                                 <Calendar size={10} /> {s.expectedDate || 'TBA'}
                              </div>
                           </td>
                           <td className="px-6 py-8">
                              <div className="flex justify-center gap-2 opacity-40 group-hover:opacity-100 transition-opacity">
                                 <button onClick={() => handleUpdateStatus(s.id, 'delivered')} className="p-2 rounded-lg bg-green-500/10 text-green-500 border border-green-500/20 hover:bg-green-500/20 transition-all" title="Delivered"><CheckCircle size={14} /></button>
                                 <button onClick={() => handleUpdateStatus(s.id, 'shipped')} className="p-2 rounded-lg bg-blue-500/10 text-blue-500 border border-blue-500/20 hover:bg-blue-500/20 transition-all" title="Shipped"><ExternalLink size={14} /></button>
                                 <button onClick={() => handleUpdateStatus(s.id, 'cancelled')} className="p-2 rounded-lg bg-red-500/10 text-red-500 border border-red-500/20 hover:bg-red-500/20 transition-all" title="Cancel"><XCircle size={14} /></button>
                              </div>
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
  );
};

export default SamplesView;
