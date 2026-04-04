import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const LoginModal = ({ isOpen, onClose, onLogin, onSignup, isLoggedIn = false, message = "Please log in to continue" }) => {
  const [isVisible, setIsVisible] = useState(isOpen);

  useEffect(() => {
    setIsVisible(isOpen);
  }, [isOpen]);

  const handleLogin = () => {
    onClose();
    if (onLogin) onLogin();
  };

  const handleSignup = () => {
    onClose();
    if (onSignup) onSignup();
  };

  // Close on escape key
  useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === 'Escape') onClose();
    };
    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
      document.body.style.overflow = 'hidden';
    }
    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.body.style.overflow = 'unset';
    };
  }, [isOpen, onClose]);

  return (
    <AnimatePresence>
      {isVisible && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50"
          />
          
          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-md z-50"
          >
            <div className="bg-surface border border-white/10 rounded-2xl p-6 shadow-2xl m-4">
              {/* Icon */}
              <div className="mx-auto w-16 h-16 bg-amber-500/20 rounded-full flex items-center justify-center mb-4">
                <svg className="w-8 h-8 text-amber-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
              </div>

              {/* Title */}
              <h3 className="text-xl font-semibold text-white text-center mb-2">
                {isLoggedIn ? "Access Denied" : "Authentication Required"}
              </h3>

              {/* Message */}
              <p className="text-gray-400 text-center mb-6">
                {message}
              </p>

              {/* Buttons */}
              <div className="space-y-3">
                <button
                  onClick={handleLogin}
                  className="w-full py-3 px-4 bg-cyan-600 hover:bg-cyan-500 text-white font-medium rounded-xl transition-colors"
                >
                  {isLoggedIn ? "Go to Profile" : "Log In"}
                </button>
                
                {!isLoggedIn && (
                  <button
                    onClick={handleSignup}
                    className="w-full py-3 px-4 bg-white/5 hover:bg-white/10 text-white font-medium rounded-xl border border-white/10 transition-colors"
                  >
                    Create Account
                  </button>
                )}

                <button
                  onClick={onClose}
                  className="w-full py-2 text-gray-500 hover:text-gray-300 text-sm transition-colors"
                >
                  Cancel
                </button>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

export default LoginModal;
