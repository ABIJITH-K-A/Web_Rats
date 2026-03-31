import { useCallback, useEffect, useRef } from "react";

const STORAGE_KEY_HIDDEN_SINCE = "tnwr_idle_hidden_since";
const STORAGE_KEY_TOTAL_IDLE = "tnwr_idle_total_ms";
const DEFAULT_TIMEOUT_MS = 8 * 60 * 60 * 1000; // 8 hours

/**
 * Tracks accumulated hidden/minimized time and triggers a callback
 * when the total hidden duration exceeds `timeoutMs`.
 *
 * The timer only counts when `document.hidden` is true (tab is minimized
 * or switched away from). Active browsing time does NOT count.
 *
 * Accumulated idle time is persisted in sessionStorage so it survives
 * page refreshes within the same browser session.
 */
const useIdleTimeout = (onTimeout, timeoutMs = DEFAULT_TIMEOUT_MS) => {
  const firedRef = useRef(false);

  const getTotalIdle = useCallback(() => {
    return Number(sessionStorage.getItem(STORAGE_KEY_TOTAL_IDLE) || 0);
  }, []);

  const setTotalIdle = useCallback((ms) => {
    sessionStorage.setItem(STORAGE_KEY_TOTAL_IDLE, String(Math.max(0, ms)));
  }, []);

  const resetIdleTimer = useCallback(() => {
    sessionStorage.removeItem(STORAGE_KEY_HIDDEN_SINCE);
    sessionStorage.removeItem(STORAGE_KEY_TOTAL_IDLE);
    firedRef.current = false;
  }, []);

  useEffect(() => {
    if (!onTimeout) return;

    const handleVisibilityChange = () => {
      if (firedRef.current) return;

      if (document.hidden) {
        // Page just became hidden — record the timestamp
        sessionStorage.setItem(STORAGE_KEY_HIDDEN_SINCE, String(Date.now()));
      } else {
        // Page just became visible — calculate how long it was hidden
        const hiddenSince = Number(
          sessionStorage.getItem(STORAGE_KEY_HIDDEN_SINCE) || 0
        );

        if (hiddenSince > 0) {
          const elapsed = Date.now() - hiddenSince;
          const newTotal = getTotalIdle() + elapsed;
          setTotalIdle(newTotal);
          sessionStorage.removeItem(STORAGE_KEY_HIDDEN_SINCE);

          if (newTotal >= timeoutMs) {
            firedRef.current = true;
            onTimeout();
          }
        }
      }
    };

    // Check if we already exceeded the timeout (e.g., after page refresh)
    const hiddenSince = Number(
      sessionStorage.getItem(STORAGE_KEY_HIDDEN_SINCE) || 0
    );
    if (hiddenSince > 0 && !document.hidden) {
      const elapsed = Date.now() - hiddenSince;
      const newTotal = getTotalIdle() + elapsed;
      setTotalIdle(newTotal);
      sessionStorage.removeItem(STORAGE_KEY_HIDDEN_SINCE);

      if (newTotal >= timeoutMs) {
        firedRef.current = true;
        onTimeout();
        return;
      }
    }

    document.addEventListener("visibilitychange", handleVisibilityChange);

    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, [onTimeout, timeoutMs, getTotalIdle, setTotalIdle]);

  return { resetIdleTimer };
};

export default useIdleTimeout;
