import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
// eslint-disable-next-line no-unused-vars
import { AnimatePresence, motion } from 'framer-motion';
import { WifiOff, RefreshCw } from 'lucide-react';
import LoginModal from '../auth/LoginModal';

/**
 * ResilienceLayer - Global Error Catch-All
 * Handles window errors, unhandled promise rejections, connectivity status,
 * and Firebase permission errors with user-friendly messages.
 */
const ResilienceLayer = ({ children }) => {
  const navigate = useNavigate();
  const [isOffline, setIsOffline] = useState(!navigator.onLine);
  const [hasCorruption, setHasCorruption] = useState(false);
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [loginMessage, setLoginMessage] = useState("Please log in to continue");

  useEffect(() => {
    const handleGlobalError = (event) => {
      // Avoid infinite loops if error logging fails
      if (event.error?.isLoggingError) return;

      console.group('🛡️ Resilience Layer: Global Error Caught');
      console.error('Message:', event.message);
      console.groupEnd();

      if (event.message?.includes('INTERNAL ASSERTION') || event.message?.includes('FIRESTORE')) {
        console.warn('CRITICAL: Firestore SDK corruption detected. Show recovery UI.');
        setIsOffline(true);
        setHasCorruption(true);
      }
    };

    const handleRejection = (event) => {
      const errorMessage = event.reason?.message || event.reason?.toString() || '';
      
      // Handle Firestore SDK corruption
      if (errorMessage.includes('FIRESTORE') && errorMessage.includes('INTERNAL ASSERTION')) {
        setHasCorruption(true);
        return;
      }

      // Handle Firebase permission errors - show login modal
      if (errorMessage.includes('permission-denied') || 
          errorMessage.includes('Missing or insufficient permissions') ||
          errorMessage.includes('FirebaseError') && errorMessage.includes('permissions')) {
        console.warn('🔒 Firebase permission denied. Showing login modal.');
        setLoginMessage("You need to log in to access this feature");
        setShowLoginModal(true);
        return;
      }

      // Handle auth errors from Firebase Auth
      if (errorMessage.includes('auth/wrong-password') || 
          errorMessage.includes('auth/user-not-found') ||
          errorMessage.includes('auth/invalid-credential') ||
          errorMessage.includes('auth/invalid-email')) {
        console.warn('🔐 Auth error detected:', errorMessage);
        // These are already handled by the auth components
        return;
      }

      // Silence noisy background fetch errors when offline
      if (!navigator.onLine && (errorMessage.includes('Failed to fetch') || event.reason?.name === 'TypeError')) {
        return;
      }

      console.group('🛡️ Resilience Layer: Async Rejection Caught');
      console.error('Reason:', event.reason);
      console.groupEnd();
    };

    const handleOnline = () => {
      if (!hasCorruption) setIsOffline(false);
    };
    const handleOffline = () => setIsOffline(true);

    window.addEventListener('error', handleGlobalError);
    window.addEventListener('unhandledrejection', handleRejection);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('error', handleGlobalError);
      window.removeEventListener('unhandledrejection', handleRejection);
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [hasCorruption]);

  const handleHardReset = () => {
    // Clear Firestore IndexedDB manually and reload
    if (window.indexedDB) {
      const dbs = ['firestore_db', 'firestore/[DEFAULT]/unofficial-webrats/main'];
      dbs.forEach(name => {
        try { window.indexedDB.deleteDatabase(name); } catch { /* ignore */ }
      });
    }
    window.location.reload();
  };

  return (
    <>
      {children}
      
      {/* Login Modal for permission errors */}
      <LoginModal 
        isOpen={showLoginModal} 
        onClose={() => setShowLoginModal(false)} 
        message={loginMessage}
        onLogin={() => navigate('/join?login=1')}
        onSignup={() => navigate('/join?tab=register')}
      />
      
      <AnimatePresence>
        {(isOffline || hasCorruption) && (
          <motion.div
            initial={{ y: 100, x: '-50%', opacity: 0 }}
            animate={{ y: 0, x: '-50%', opacity: 1 }}
            exit={{ y: 100, x: '-50%', opacity: 0 }}
            className="tnwr-toast show err flex items-center gap-3 px-6 py-4"
            style={{ pointerEvents: 'auto', borderRadius: '16px', bottom: '32px' }}
          >
            {hasCorruption ? (
              <>
                <RefreshCw size={18} className="animate-spin text-red-400" />
                <div className="flex flex-col">
                  <span className="font-bold text-white">System Sync Error</span>
                  <span className="text-[10px] opacity-70">Firestore internal crash detected.</span>
                </div>
                <button 
                  onClick={handleHardReset}
                  className="ml-4 px-3 py-1.5 bg-red-500/20 hover:bg-red-500/40 border border-red-500/30 rounded-lg text-[10px] font-bold uppercase tracking-wider transition-colors"
                >
                  Hard Reset
                </button>
              </>
            ) : (
              <>
                <WifiOff size={18} />
                <span>Connection lost. Working in offline mode.</span>
              </>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};

export default ResilienceLayer;
