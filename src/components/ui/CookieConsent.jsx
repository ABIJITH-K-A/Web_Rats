import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Cookie, X, Check } from 'lucide-react';

const COOKIE_CONSENT_KEY = 'rynix_cookie_consent';

export const CookieConsent = () => {
  const [show, setShow] = useState(false);

  useEffect(() => {
    // Check if user has already consented
    const consent = localStorage.getItem(COOKIE_CONSENT_KEY);
    if (!consent) {
      // Show after a short delay
      const timer = setTimeout(() => setShow(true), 1000);
      return () => clearTimeout(timer);
    }
  }, []);

  const handleAccept = () => {
    localStorage.setItem(COOKIE_CONSENT_KEY, 'accepted');
    setShow(false);
  };

  const handleDecline = () => {
    localStorage.setItem(COOKIE_CONSENT_KEY, 'declined');
    setShow(false);
  };

  return (
    <AnimatePresence>
      {show && (
        <motion.div
          initial={{ opacity: 0, y: 50 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 50 }}
          transition={{ duration: 0.3, ease: 'easeOut' }}
          className="fixed bottom-4 left-4 right-4 z-50 md:left-auto md:right-4 md:w-96"
        >
          <div className="rounded-2xl border border-cyan-primary/20 bg-[#08090C]/95 p-5 shadow-2xl backdrop-blur-xl">
            <div className="flex items-start gap-4">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-cyan-primary/10">
                <Cookie className="h-6 w-6 text-cyan-primary" />
              </div>
              <div className="flex-1">
                <h3 className="mb-1 text-base font-bold text-white">
                  Cookie Preferences
                </h3>
                <p className="mb-4 text-sm leading-relaxed text-gray-400">
                  We use cookies to enhance your experience, analyze site usage, and improve our services. Your session will expire after 1 hour for security.
                </p>
                <div className="flex gap-2">
                  <button
                    onClick={handleAccept}
                    className="flex flex-1 items-center justify-center gap-2 rounded-lg bg-cyan-primary px-4 py-2.5 text-sm font-semibold text-primary-dark transition-all hover:bg-cyan-primary/90 hover:scale-[1.02]"
                  >
                    <Check size={16} />
                    Accept
                  </button>
                  <button
                    onClick={handleDecline}
                    className="flex flex-1 items-center justify-center gap-2 rounded-lg border border-white/10 px-4 py-2.5 text-sm font-semibold text-gray-300 transition-all hover:bg-white/5"
                  >
                    <X size={16} />
                    Decline
                  </button>
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default CookieConsent;
