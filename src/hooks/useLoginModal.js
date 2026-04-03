import { useState, useCallback, useEffect, useRef } from 'react';

// Module-level registry for the login modal
const modalRegistry = {
  showModal: null,
  setMessage: null,
};

/**
 * Hook to control the global login modal
 * Used by ResilienceLayer (provider) and accessible globally via showGlobalLoginModal
 */
export const useLoginModal = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [message, setMessage] = useState("Please log in to continue");
  const isRegistered = useRef(false);

  // Register in an effect to avoid render-phase side effects
  useEffect(() => {
    if (!isRegistered.current) {
      modalRegistry.showModal = () => setIsOpen(true);
      modalRegistry.setMessage = (msg) => setMessage(msg || "Please log in to continue");
      isRegistered.current = true;
    }

    return () => {
      // Only unregister if this instance is the current one
      if (isRegistered.current) {
        modalRegistry.showModal = null;
        modalRegistry.setMessage = null;
      }
    };
  }, []);

  const showLoginModal = useCallback((msg) => {
    if (msg) setMessage(msg);
    setIsOpen(true);
  }, []);

  const hideLoginModal = useCallback(() => {
    setIsOpen(false);
  }, []);

  return {
    isOpen,
    message,
    showLoginModal,
    hideLoginModal,
  };
};

/**
 * Call this from anywhere to show the login modal
 * Only works if a component is currently using useLoginModal hook
 */
export const showGlobalLoginModal = (message = "Please log in to continue") => {
  if (modalRegistry.setMessage) {
    modalRegistry.setMessage(message);
  }
  if (modalRegistry.showModal) {
    modalRegistry.showModal();
  } else {
    console.warn('LoginModal not initialized yet - no component is using useLoginModal hook');
    // Fallback: redirect to login page
    window.location.href = '/join?login=1';
  }
};
