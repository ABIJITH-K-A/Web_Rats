import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  X, Mail, Phone, MessageCircle, ExternalLink, Copy, Check,
  User, Building2, GraduationCap
} from 'lucide-react';
import { Button } from '../ui/Primitives';

/**
 * ContactClientModal - Shows client contact info and chat options for workers
 */
const ContactClientModal = ({
  order,
  onClose,
  onOpenChat,
}) => {
  const [copiedField, setCopiedField] = useState(null);

  const clientInfo = {
    name: order?.customerName || order?.name || 'Unknown Client',
    email: order?.email || order?.customerEmail || 'Not provided',
    phone: order?.phone || order?.customerPhone || 'Not provided',
    role: order?.customerType || 'client',
  };

  const handleCopy = (text, field) => {
    navigator.clipboard.writeText(text);
    setCopiedField(field);
    setTimeout(() => setCopiedField(null), 2000);
  };

  const handleEmailClick = () => {
    if (clientInfo.email && clientInfo.email !== 'Not provided') {
      window.open(`mailto:${clientInfo.email}?subject=Re: Order ${order?.id?.slice(-8)?.toUpperCase() || ''}`, '_blank');
    }
  };

  const handleWhatsAppClick = () => {
    if (clientInfo.phone && clientInfo.phone !== 'Not provided') {
      const cleanPhone = clientInfo.phone.replace(/\D/g, '');
      const message = encodeURIComponent(`Hi ${clientInfo.name}, this is regarding your order ${order?.id?.slice(-8)?.toUpperCase() || ''}.`);
      window.open(`https://wa.me/${cleanPhone}?text=${message}`, '_blank');
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[160] flex items-center justify-center bg-black/80 p-4 backdrop-blur-md"
    >
      <motion.div
        initial={{ opacity: 0, y: 40, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 40, scale: 0.95 }}
        className="relative w-full max-w-lg bg-[#0B0F13] border border-white/10 rounded-[32px] shadow-2xl overflow-hidden"
      >
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-white/5 bg-white/[0.02]">
          <div>
            <h2 className="text-xl font-black text-white italic">Contact Client</h2>
            <p className="text-[10px] font-mono uppercase tracking-widest text-white/30 mt-1">
              Order #{order?.id?.slice(-8)?.toUpperCase()}
            </p>
          </div>
          <button 
            onClick={onClose}
            className="w-10 h-10 rounded-xl bg-white/5 border border-white/5 hover:bg-white/10 transition-all flex items-center justify-center text-white/40 hover:text-white"
          >
            <X size={18} />
          </button>
        </div>

        {/* Client Info Card */}
        <div className="p-6 space-y-6">
          <div className="flex items-center gap-4 p-4 rounded-2xl bg-white/[0.02] border border-white/5">
            <div className="w-14 h-14 rounded-2xl bg-cyan-primary/10 flex items-center justify-center text-cyan-primary">
              <User size={24} />
            </div>
            <div>
              <div className="text-[8px] font-mono uppercase text-white/20 tracking-widest">Client Name</div>
              <div className="text-lg font-bold text-white">{clientInfo.name}</div>
              <div className="flex items-center gap-2 mt-1">
                <span className="text-[10px] font-mono uppercase px-2 py-0.5 rounded-full bg-white/5 text-white/40">
                  {clientInfo.role}
                </span>
              </div>
            </div>
          </div>

          {/* Contact Methods */}
          <div className="space-y-3">
            {/* Email */}
            <div className="group flex items-center gap-4 p-4 rounded-2xl bg-black/30 border border-white/5 hover:border-cyan-primary/20 transition-all">
              <div className="w-12 h-12 rounded-xl bg-white/5 flex items-center justify-center text-cyan-primary">
                <Mail size={20} />
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-[8px] font-mono uppercase text-white/20 tracking-widest">Email Address</div>
                <div className="text-sm font-medium text-white truncate">{clientInfo.email}</div>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => handleCopy(clientInfo.email, 'email')}
                  className="p-2 rounded-lg bg-white/5 hover:bg-white/10 transition-all text-white/40 hover:text-white"
                  title="Copy email"
                >
                  {copiedField === 'email' ? <Check size={16} className="text-green-400" /> : <Copy size={16} />}
                </button>
                <button
                  onClick={handleEmailClick}
                  disabled={clientInfo.email === 'Not provided'}
                  className="p-2 rounded-lg bg-cyan-primary/10 hover:bg-cyan-primary/20 transition-all text-cyan-primary disabled:opacity-40 disabled:cursor-not-allowed"
                  title="Open email"
                >
                  <ExternalLink size={16} />
                </button>
              </div>
            </div>

            {/* Phone */}
            <div className="group flex items-center gap-4 p-4 rounded-2xl bg-black/30 border border-white/5 hover:border-cyan-primary/20 transition-all">
              <div className="w-12 h-12 rounded-xl bg-white/5 flex items-center justify-center text-cyan-primary">
                <Phone size={20} />
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-[8px] font-mono uppercase text-white/20 tracking-widest">Phone Number</div>
                <div className="text-sm font-medium text-white truncate">{clientInfo.phone}</div>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => handleCopy(clientInfo.phone, 'phone')}
                  className="p-2 rounded-lg bg-white/5 hover:bg-white/10 transition-all text-white/40 hover:text-white"
                  title="Copy phone"
                >
                  {copiedField === 'phone' ? <Check size={16} className="text-green-400" /> : <Copy size={16} />}
                </button>
                <button
                  onClick={handleWhatsAppClick}
                  disabled={clientInfo.phone === 'Not provided'}
                  className="p-2 rounded-lg bg-green-500/10 hover:bg-green-500/20 transition-all text-green-400 disabled:opacity-40 disabled:cursor-not-allowed"
                  title="Open WhatsApp"
                >
                  <MessageCircle size={16} />
                </button>
              </div>
            </div>
          </div>

          {/* Chat Button */}
          <div className="pt-4 border-t border-white/5">
            <Button 
              onClick={onOpenChat}
              className="w-full py-4 text-sm font-black uppercase tracking-widest"
            >
              <MessageCircle size={18} className="mr-2" />
              Open Order Chat
            </Button>
            <p className="text-[9px] font-mono uppercase tracking-widest text-white/20 text-center mt-3">
              All chat messages are logged and tied to this order
            </p>
          </div>

          {/* Guidelines */}
          <div className="p-4 rounded-2xl bg-amber-500/5 border border-amber-500/10">
            <div className="flex items-start gap-3">
              <GraduationCap size={16} className="text-amber-400 shrink-0 mt-0.5" />
              <div className="text-[10px] text-white/50 leading-relaxed">
                <strong className="text-white/70">Communication Guidelines:</strong>
                <ul className="mt-2 space-y-1 list-disc list-inside">
                  <li>Keep all project-related discussion in the order chat</li>
                  <li>Use WhatsApp/calls only for urgent matters</li>
                  <li>Professional tone required at all times</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
};

export default ContactClientModal;
