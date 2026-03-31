import { ReactLenis } from 'lenis/react';
import NeuralBackground from './NeuralBackground';
import Navbar from './Navbar';
import Footer from './Footer';
import { useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { motion, AnimatePresence } from 'framer-motion';
import { Mail, RefreshCw, X } from 'lucide-react';
import { useState } from 'react';

const VerificationBanner = () => {
  const { user, emailVerified, resendVerificationEmail } = useAuth();
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);
  const [dismissed, setDismissed] = useState(false);

  if (!user || emailVerified || dismissed) return null;

  const handleResend = async () => {
    setLoading(true);
    try {
      await resendVerificationEmail();
      setSent(true);
      setTimeout(() => setSent(false), 5000);
    } catch (error) {
      console.error('Failed to resend verification email:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <motion.div
      initial={{ height: 0, opacity: 0 }}
      animate={{ height: 'auto', opacity: 1 }}
      className="bg-amber-500/10 border-b border-amber-500/20 relative z-50"
    >
      <div className="max-w-7xl mx-auto px-4 py-2 flex items-center justify-between gap-4">
        <div className="flex items-center gap-2 text-amber-300 text-xs font-mono">
          <Mail size={14} className="shrink-0" />
          <span>Please verify your email address (<strong>{user.email}</strong>) to secure your account.</span>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={handleResend}
            disabled={loading || sent}
            className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-amber-300 hover:text-amber-200 disabled:opacity-50 transition-colors"
          >
            {loading ? <RefreshCw size={12} className="animate-spin" /> : sent ? 'Sent!' : 'Resend Email'}
          </button>
          <button 
            onClick={() => setDismissed(true)}
            className="text-amber-300/40 hover:text-amber-300 transition-colors"
          >
            <X size={14} />
          </button>
        </div>
      </div>
    </motion.div>
  );
};

const RootLayout = ({ children }) => {
  const location = useLocation();
  const isDashboardRoute =
    location.pathname === '/dashboard' || location.pathname === '/profile';

  return (
    <ReactLenis root>
      <div className="relative min-h-screen bg-primary-dark font-sans selection:bg-cyan-primary selection:text-primary-dark">
        <NeuralBackground />
        
        <div className="relative z-10 flex flex-col min-h-screen overflow-x-hidden">
          <VerificationBanner />
          {!isDashboardRoute && <Navbar />}
          
          <main 
            key={location.pathname}
            className={`flex-grow ${isDashboardRoute ? '' : 'pt-24'}`}
          >
            {children}
          </main>

          {!isDashboardRoute && <Footer />}
        </div>
      </div>
    </ReactLenis>
  );
};

export default RootLayout;
