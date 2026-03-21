import {
  browserSessionPersistence,
  setPersistence,
  signOut
} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js";

export const AUTH_IDLE_TIMEOUT_MS = 2 * 60 * 60 * 1000;

const ACTIVITY_KEY = "tnwr:last-activity";
const REASON_KEY = "tnwr:logout-reason";

function now() {
  return Date.now();
}

export async function enforceSessionPersistence(auth) {
  try {
    await setPersistence(auth, browserSessionPersistence);
  } catch (_) {}
  touchSessionActivity();
}

export function touchSessionActivity() {
  try {
    sessionStorage.setItem(ACTIVITY_KEY, String(now()));
  } catch (_) {}
}

function readLastActivity() {
  const raw = sessionStorage.getItem(ACTIVITY_KEY);
  const value = Number(raw || 0);
  return Number.isFinite(value) && value > 0 ? value : now();
}

export function consumeSessionNotice() {
  const reason = sessionStorage.getItem(REASON_KEY);
  if (!reason) return "";
  sessionStorage.removeItem(REASON_KEY);
  if (reason === "idle") {
    return "Your session expired after 2 hours of inactivity. Please log in again.";
  }
  return "Your session ended. Please log in again.";
}

export function installIdleSessionTimeout(auth, options = {}) {
  const timeoutMs = Number(options.timeoutMs || AUTH_IDLE_TIMEOUT_MS);
  const onExpire = typeof options.onExpire === "function" ? options.onExpire : null;
  let timer = null;

  const schedule = () => {
    clearTimeout(timer);
    const remaining = Math.max(5000, timeoutMs - (now() - readLastActivity()));
    timer = window.setTimeout(checkExpiry, remaining);
  };

  const markActive = () => {
    if (document.visibilityState === "hidden") return;
    touchSessionActivity();
    schedule();
  };

  const checkExpiry = async () => {
    if (now() - readLastActivity() < timeoutMs) {
      schedule();
      return;
    }

    sessionStorage.setItem(REASON_KEY, "idle");
    await signOut(auth).catch(() => {});
    if (onExpire) onExpire();
  };

  const events = ["click", "keydown", "mousemove", "scroll", "touchstart", "pointerdown"];
  events.forEach(eventName => window.addEventListener(eventName, markActive, { passive: true }));
  document.addEventListener("visibilitychange", markActive, { passive: true });

  touchSessionActivity();
  schedule();

  return () => {
    clearTimeout(timer);
    events.forEach(eventName => window.removeEventListener(eventName, markActive));
    document.removeEventListener("visibilitychange", markActive);
  };
}
