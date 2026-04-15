import { useCallback, useEffect, useRef } from "react";

const DEFAULT_TIMEOUT_MS = 60 * 60 * 1000; // 1 hour

/**
 * Tracks generic user inactivity (mouse movement, clicks, keypresses, etc.)
 * and triggers a callback when the continuous idle duration exceeds `timeoutMs`.
 */
const useIdleTimeout = (onTimeout, timeoutMs = DEFAULT_TIMEOUT_MS) => {
  const timeoutIdRef = useRef(null);

  const resetIdleTimer = useCallback(() => {
    if (timeoutIdRef.current) {
      clearTimeout(timeoutIdRef.current);
    }
    
    if (onTimeout) {
      timeoutIdRef.current = setTimeout(() => {
        onTimeout();
      }, timeoutMs);
    }
  }, [onTimeout, timeoutMs]);

  useEffect(() => {
    if (!onTimeout) return;

    // List of events that indicate active browsing
    const activityEvents = [
      "mousemove",
      "keydown",
      "wheel",
      "click",
      "touchstart",
      "scroll"
    ];

    const handleActivity = () => {
      resetIdleTimer();
    };

    // Start timer initially
    resetIdleTimer();

    // Attach passive event listeners
    activityEvents.forEach((eventName) => {
      window.addEventListener(eventName, handleActivity, { passive: true });
    });

    return () => {
      // Cleanup event listeners and active timers on unmount
      activityEvents.forEach((eventName) => {
        window.removeEventListener(eventName, handleActivity);
      });
      if (timeoutIdRef.current) {
        clearTimeout(timeoutIdRef.current);
      }
    };
  }, [onTimeout, resetIdleTimer]);

  return { resetIdleTimer };
};

export default useIdleTimeout;
