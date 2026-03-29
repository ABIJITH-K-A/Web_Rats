import { useEffect, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { WifiOff, RefreshCw } from 'lucide-react';

/**
 * ResilienceLayer - Global Error Catch-All
 * Handles window errors, unhandled promise rejections, and connectivity status.
 */
const ResilienceLayer = ({ children }) => {
  const [isOffline, setIsOffline] = useState(!navigator.onLine);
  const [hasCorruption, setHasCorruption] = useState(false);

  useEffect(() => {
    const handleGlobalError = (event) => {
      // Avoid infinite loops if error logging fails
      if (event.error?.isLoggingError) return;

      console.group('🛡️ Resilience Layer: Global Error Caught');
      console.error('Message:', event.message);
      console.groupEnd();

      if (event.message?.includes('INTERNAL ASSERTION') || event.message?.includes('FIRESTORE')) {
        console.warn('CRITICAL: Firestore SDK corruption detected. Show recovery UI.');
        setIsOffline(true); // Force recovery UI visibility
        setHasCorruption(true);
      }
    };

    const handleRejection = (event) => {
      if (event.reason?.message?.includes('FIRESTORE') && event.reason?.message?.includes('INTERNAL ASSERTION')) {
        setHasCorruption(true);
        return;
      }
      // Silence noisy background fetch errors when offline
      if (!navigator.onLine && (event.reason?.message?.includes('Failed to fetch') || event.reason?.name === 'TypeError')) {
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
        try { window.indexedDB.deleteDatabase(name); } catch(e) {}
      });
    }
    window.location.reload();
  };

  return (
    <>
      {children}
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
