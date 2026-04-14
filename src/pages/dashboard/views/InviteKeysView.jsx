import { useState, useEffect } from 'react';
import { 
  Key, Plus, Trash2, Copy, Check, 
  Clock, Shield, User, ChevronRight,
  RefreshCw, Info, AlertTriangle
} from 'lucide-react';
import { db } from '../../../config/firebase';
import { 
  collection, getDocs, deleteDoc, 
  doc, serverTimestamp, query, orderBy, setDoc 
} from 'firebase/firestore';
import { useAuth } from '../../../context/AuthContext';
import { logAuditEvent } from '../../../services/auditService';
import { canGenerateInviteForRole, normalizeRole } from '../../../utils/systemRules';

const InviteKeysView = () => {
  const { user, userProfile } = useAuth();
  const [keys, setKeys] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedRole, setSelectedRole] = useState('worker');
  const [isGenerating, setIsGenerating] = useState(false);
  const [copyStatus, setCopyStatus] = useState({});

  useEffect(() => {
    fetchKeys();
  }, [userProfile?.role]);

  const fetchKeys = async () => {
    setLoading(true);
    try {
      const snap = await getDocs(query(collection(db, "inviteKeys"), orderBy("createdAt", "desc")));
      setKeys(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleGenerate = async () => {
    setIsGenerating(true);
    try {
      const keyStr = `RAT-INV-${Math.random().toString(36).toUpperCase().slice(-6)}`;
      const roleValue = normalizeRole(selectedRole);

      if (!canGenerateInviteForRole(userProfile?.role, roleValue)) {
        throw new Error("You cannot generate invite keys for that role.");
      }

      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + 14);

      await setDoc(doc(db, "inviteKeys", keyStr), {
        keyCode: keyStr,
        role: roleValue,
        scope: "staff",
        status: "active",
        used: false,
        multiUse: false,
        maxUses: 1,
        usedCount: 0,
        generatedBy: user.uid,
        generatedByName: userProfile?.name || user?.email,
        generatedByRole: normalizeRole(userProfile?.role),
        expiresAt,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
      await logAuditEvent({
        actorId: user.uid,
        actorRole: userProfile?.role,
        action: "invite_key_created",
        targetType: "invite_key",
        targetId: keyStr,
        severity: "medium",
        metadata: { role: roleValue },
      });
      fetchKeys();
      alert(`Key Generated: ${keyStr}`);
    } catch (e) {
      console.error(e);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Delete this invite key?")) return;
    try {
      await deleteDoc(doc(db, "inviteKeys", id));
      await logAuditEvent({
        actorId: user.uid,
        actorRole: userProfile?.role,
        action: "invite_key_deleted",
        targetType: "invite_key",
        targetId: id,
        severity: "medium",
      });
      setKeys(prev => prev.filter(k => k.id !== id));
    } catch (e) {
      console.error(e);
    }
  };

  const handleCopy = (txt, id) => {
    navigator.clipboard.writeText(txt);
    setCopyStatus({ ...copyStatus, [id]: true });
    setTimeout(() => setCopyStatus({ ...copyStatus, [id]: false }), 2000);
  };

  const roles = userProfile?.role === 'owner'
    ? ['admin', 'worker']
    : userProfile?.role === 'admin' 
      ? ['worker']
      : [];

  return (
    <div className="space-y-10 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <h2 className="text-2xl font-black text-white italic">Invite <span className="text-cyan-primary not-italic font-mono uppercase text-sm tracking-[0.2em] ml-2">Team Keys</span></h2>
          <p className="text-[10px] font-mono text-white/20 uppercase tracking-widest mt-1">Generate single-use verification tokens for staff onboarding</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Generator */}
        <div className="lg:col-span-1 bg-[#121417] border border-white/5 rounded-3xl p-8 shadow-2xl self-start">
           <h3 className="text-xs font-mono uppercase tracking-widest text-cyan-primary mb-8 flex items-center gap-2">
              <Key size={14} /> Forge Invite Key
           </h3>
           <div className="space-y-6">
              <div className="space-y-1">
                 <label className="text-[10px] uppercase font-mono tracking-widest text-white/20">Assign Entry Role *</label>
                 <select 
                   className="w-full bg-[#262B25] border border-white/10 rounded-xl px-4 py-3 text-sm focus:border-cyan-primary outline-none transition-all uppercase font-mono tracking-widest text-[10px]"
                   value={selectedRole}
                   onChange={(e) => setSelectedRole(e.target.value)}
                 >
                    {roles.map(r => (
                       <option key={r} value={r}>{r}</option>
                    ))}
                 </select>
              </div>
              
              <div className="p-4 bg-[#1a1f1a] rounded-xl border border-white/5 flex gap-3 text-white/30">
                 <Shield size={16} className="shrink-0 mt-0.5" />
                 <p className="text-[9px] font-mono leading-relaxed uppercase">
                   Keys are single-use. The recipient will be automatically assigned their role upon signup. Expire after 1 use.
                 </p>
              </div>

              <button 
                disabled={isGenerating}
                onClick={handleGenerate}
                className="w-full py-4 bg-cyan-primary text-primary-dark font-black text-[10px] uppercase tracking-[0.2em] rounded-xl hover:scale-[1.02] active:scale-95 transition-all shadow-[0_0_20px_rgba(103, 248, 29,0.2)] flex items-center justify-center gap-3"
              >
                {isGenerating ? <RefreshCw className="animate-spin" size={16} /> : <Key size={16} />} 
                {isGenerating ? 'Forging Token...' : 'Generate New Key'}
              </button>
           </div>
        </div>

        {/* Existing Keys */}
        <div className="lg:col-span-2 space-y-6">
           <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {loading ? (
                 <div className="col-span-2 p-20 text-center opacity-20 uppercase font-mono text-[10px] tracking-widest animate-pulse italic">Scanning Vault...</div>
              ) : keys.length === 0 ? (
                 <div className="col-span-2 p-20 text-center bg-[#121417] border border-dashed border-white/10 rounded-3xl opacity-20 uppercase font-mono text-xs tracking-widest italic flex flex-col items-center">
                    <Key size={40} className="mb-4" />
                    No active tokens in forge
                 </div>
              ) : (
                 keys.map(k => (
                    <div key={k.id} className={`p-6 rounded-3xl border transition-all group ${k.used ? 'bg-[#1a1f1a] border-white/5 opacity-50 grayscale' : 'bg-[#121417] border-white/5 hover:border-cyan-primary/20 hover:scale-[1.02]'}`}>
                       <div className="flex justify-between items-start mb-6">
                          <span className={`px-2 py-0.5 rounded-full border text-[8px] font-black uppercase tracking-widest ${k.used ? 'bg-white/5 text-white/20 border-white/5' : 'bg-green-500/10 text-green-500 border-green-500/20 shadow-[0_0_10px_rgba(34,197,94,0.1)]'}`}>
                             {k.used ? 'Burned' : 'Active Token'}
                          </span>
                          <span className="text-[9px] font-mono text-white/30 uppercase tracking-widest">{k.role}</span>
                       </div>
                       
                        <div className="text-lg font-black font-mono text-white tracking-[0.15em] mb-1 group-hover:text-cyan-primary transition-colors">{k.keyCode || k.id}</div>
                       <div className="text-[9px] font-mono text-white/10 uppercase tracking-widest mb-6 italic">Forged By: {k.generatedByName}</div>
                       
                       <div className="flex gap-2">
                          <button 
                            disabled={k.used}
                             onClick={() => handleCopy(k.keyCode || k.id, k.id)}
                            className="grow py-2.5 bg-[#262B25] border border-white/5 rounded-xl font-bold font-mono text-[9px] uppercase tracking-widest text-white/40 hover:text-white hover:bg-[#2f362f] transition-all flex items-center justify-center gap-2"
                          >
                             {copyStatus[k.id] ? <Check size={14} className="text-cyan-primary" /> : <Copy size={14} />} 
                             {copyStatus[k.id] ? 'Copied' : 'Copy'}
                          </button>
                          <button 
                            onClick={() => handleDelete(k.id)}
                            className="w-11 h-11 bg-red-500/5 border border-red-500/10 rounded-xl text-red-500 hover:bg-red-500/20 flex items-center justify-center transition-all"
                          >
                             <Trash2 size={16} />
                          </button>
                       </div>
                    </div>
                 ))
              )}
           </div>

           {/* Warnings */}
           <div className="p-6 bg-[#1a0f0f] border border-red-500/10 rounded-2xl flex items-start gap-4 shadow-xl">
              <AlertTriangle size={20} className="text-red-500 shrink-0 mt-0.5" />
              <div>
                 <h4 className="text-xs font-black text-red-500/80 mb-2 uppercase tracking-widest flex items-center gap-2 italic underline underline-offset-4 decoration-red-500/20">
                   Security Breach Warning
                 </h4>
                 <p className="text-[10px] font-mono text-white/30 uppercase tracking-widest leading-relaxed">
                   NEVER post invite keys <u>Publicly</u>. If a key is compromised, purge it immediately using the trash icon. Burned keys remain in history for 7 days before auto-pruning.
                 </p>
              </div>
           </div>
        </div>
      </div>
    </div>
  );
};

export default InviteKeysView;
