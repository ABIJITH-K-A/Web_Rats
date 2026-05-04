import { useCallback, useEffect, useState } from "react";
import {
  createUserWithEmailAndPassword,
  onAuthStateChanged,
  sendEmailVerification,
  sendPasswordResetEmail,
  signInWithEmailAndPassword,
  signOut,
} from "firebase/auth";
import { doc, getDoc, getDocFromCache } from "firebase/firestore";
import { auth, db } from "../config/firebase";
import { apiRequest } from "../services/apiClient";
import { normalizeRole } from "../utils/systemRules";
import { AuthContext } from "./AuthContext";

const userFriendlyError = (code) => {
  const map = {
    "auth/invalid-email": "The email address is not valid. Please check for typos.",
    "auth/invalid-credential": "Incorrect email or password. Please try again or reset your password.",
    "auth/wrong-password": "The password you entered is incorrect.",
    "auth/user-not-found": "We couldn't find an account with that email address.",
    "auth/email-already-in-use": "This email is already registered. Try signing in instead.",
    "auth/weak-password": "Your password is too weak. It must be at least 6 characters.",
    "auth/too-many-requests": "Too many failed attempts. Your account is temporarily locked for security. Please wait a few minutes.",
    "auth/network-request-failed": "Network error. Please check your internet connection.",
    "auth/internal-error": "A server error occurred. Please try again in a moment.",
    "auth/user-disabled": "This account has been disabled. Please contact support.",
    "auth/popup-closed-by-user": "The sign-in popup was closed before completion.",
    "auth/operation-not-allowed": "This sign-in method is currently disabled.",
  };

  if (typeof code !== "string") return "An unexpected error occurred. Please try again.";
  return map[code] || `Error: ${code.split("/").pop()?.replace(/-/g, " ")}. Please try again.`;
};

const sanitizeString = (value) => String(value || "").trim();

const fetchUserProfile = async (uid) => {
  const ref = doc(db, "users", uid);
  try {
    const snap = await getDoc(ref);
    return snap.exists() ? snap.data() : null;
  } catch (error) {
    const isOfflineError =
      error?.message?.toLowerCase()?.includes("offline") ||
      error?.message?.toLowerCase()?.includes("unavailable") ||
      error?.code === "unavailable" ||
      !navigator.onLine;

    if (isOfflineError) {
      try {
        const cachedSnap = await getDocFromCache(ref);
        return cachedSnap.exists() ? cachedSnap.data() : null;
      } catch {
        console.warn("Profile fetch failed: offline and cache miss.");
        return null;
      }
    }
    throw error;
  }
};

const wrapAuthError = (error) => {
  if (error instanceof Error && !error.code) {
    return error;
  }
  return new Error(userFriendlyError(error?.code));
};

const SESSION_KEY = 'rynix_session_start';
const COOKIE_CONSENT_KEY = 'rynix_cookie_consent';
const SESSION_DURATION_MS = 60 * 60 * 1000; // 1 hour

const hasCookieConsent = () => {
  return localStorage.getItem(COOKIE_CONSENT_KEY) === 'accepted';
};

const isSessionExpired = () => {
  // If no cookie consent, treat as expired (force re-auth on refresh)
  if (!hasCookieConsent()) return true;
  const sessionStart = localStorage.getItem(SESSION_KEY);
  if (!sessionStart) return true;
  const elapsed = Date.now() - parseInt(sessionStart, 10);
  return elapsed > SESSION_DURATION_MS;
};

const setSessionStart = () => {
  if (hasCookieConsent()) {
    localStorage.setItem(SESSION_KEY, Date.now().toString());
  }
};

const clearSessionData = () => {
  if (hasCookieConsent()) {
    localStorage.removeItem(SESSION_KEY);
  }
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [userProfile, setUserProfile] = useState(null);
  const [role, setRole] = useState(null);
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState(null);
  const [sessionExpired, setSessionExpired] = useState(false);

  const refreshProfile = useCallback(
    async (uid) => {
      const targetUid = uid || user?.uid;
      if (!targetUid) return null;

      try {
        const data = await fetchUserProfile(targetUid);
        if (data) {
          setUserProfile(data);
          setRole(normalizeRole(data.role));
          setFetchError(null);
        }
        return data;
      } catch (error) {
        console.error("Error refreshing profile:", error);
        setFetchError(error.message);
        return null;
      }
    },
    [user?.uid]
  );

  const logout = useCallback(async () => {
    try {
      await signOut(auth);
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      // Always clear session data even if signOut fails
      localStorage.removeItem(SESSION_KEY);
      sessionStorage.clear();
      indexedDB.deleteDatabase('firebaseLocalStorageDb');
      // Clear all cookies
      document.cookie.split(';').forEach((cookie) => {
        const [name] = cookie.split('=');
        document.cookie = `${name.trim()}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;`;
        document.cookie = `${name.trim()}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/; domain=${window.location.hostname};`;
      });
      setUser(null);
      setUserProfile(null);
      setRole(null);
    }
  }, []);

  // Session expiry check interval (every minute)
  useEffect(() => {
    if (!user) return;
    
    const interval = setInterval(async () => {
      if (isSessionExpired()) {
        await logout();
        setSessionExpired(true);
      }
    }, 60000);
    
    return () => clearInterval(interval);
  }, [user, logout]);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      if (currentUser) {
        // Check session expiry on auth state change
        if (isSessionExpired()) {
          await logout();
          setSessionExpired(true);
          setLoading(false);
          return;
        }
        
        // Set session start time only if cookies are accepted
        if (!localStorage.getItem(SESSION_KEY)) {
          setSessionStart();
        }
        
        setUser(currentUser);
        try {
          const profileData = await fetchUserProfile(currentUser.uid);
          if (profileData) {
            setUserProfile(profileData);
            setRole(normalizeRole(profileData.role));
          }
        } catch (error) {
          setFetchError(error.message);
        }
      } else {
        setUser(null);
        setUserProfile(null);
        setRole(null);
        clearSessionData();
      }
      setLoading(false);
    });

    return unsubscribe;
  }, [refreshProfile]);

  const login = async (email, password) => {
    try {
      const normalizedEmail = sanitizeString(email).toLowerCase();
      const cred = await signInWithEmailAndPassword(auth, normalizedEmail, password);
      const profile = await fetchUserProfile(cred.user.uid);

      if (!profile) {
        if (!navigator.onLine) {
          throw new Error("Cannot load your profile while offline. Please check your connection.");
        }
        throw new Error("Profile not found for this account.");
      }

      const accountStatus = sanitizeString(profile.status || "active").toLowerCase();
      if (["suspended", "fired"].includes(accountStatus)) {
        await signOut(auth);
        throw new Error("This account is not currently active.");
      }

      setUserProfile(profile);
      setRole(normalizeRole(profile.role));
      return profile;
    } catch (error) {
      throw wrapAuthError(error);
    }
  };

  const signup = async (email, password, extraData = {}) => {
    const normalizedEmail = sanitizeString(email).toLowerCase();

    try {
      const cred = await createUserWithEmailAndPassword(auth, normalizedEmail, password);
      await sendEmailVerification(cred.user);

      const response = await apiRequest("/auth/complete-client-signup", {
        method: "POST",
        authMode: "required",
        body: {
          name: sanitizeString(extraData.name),
          phone: sanitizeString(extraData.phone),
          customerType: sanitizeString(extraData.customerType || "new").toLowerCase(),
          organizationType: sanitizeString(extraData.organizationType || "college").toLowerCase(),
          organizationName: sanitizeString(extraData.organizationName),
          organizationAddress: sanitizeString(extraData.organizationAddress),
          organizationEmail: sanitizeString(extraData.organizationEmail).toLowerCase(),
          usedReferralCode: sanitizeString(extraData.usedReferralCode).toUpperCase() || null,
        },
      });

      await cred.user.getIdToken(true);
      await refreshProfile(cred.user.uid);

      return {
        uid: cred.user.uid,
        role: normalizeRole(response?.role || "client"),
      };
    } catch (error) {
      throw wrapAuthError(error);
    }
  };

  const staffSignup = async (email, password, extraData = {}) => {
    const normalizedEmail = sanitizeString(email).toLowerCase();

    try {
      const cred = await createUserWithEmailAndPassword(auth, normalizedEmail, password);
      await sendEmailVerification(cred.user);

      const response = await apiRequest("/auth/complete-staff-signup", {
        method: "POST",
        authMode: "required",
        body: {
          inviteKey: sanitizeString(extraData.inviteKey).toUpperCase(),
          firstName: sanitizeString(extraData.firstName),
          lastName: sanitizeString(extraData.lastName),
          phone: sanitizeString(extraData.phone),
          organizationType: sanitizeString(extraData.organizationType || "college").toLowerCase(),
          organizationName: sanitizeString(extraData.organizationName),
          organizationAddress: sanitizeString(extraData.organizationAddress),
          organizationEmail: sanitizeString(extraData.organizationEmail).toLowerCase(),
          skills: Array.isArray(extraData.skills) ? extraData.skills : [],
          workingDays: Array.isArray(extraData.workingDays) ? extraData.workingDays : [],
          availableHours: extraData.availableHours || {
            start: "09:00",
            end: "18:00",
            timezone: "Asia/Kolkata",
          },
          contactMethods: Array.isArray(extraData.contactMethods)
            ? extraData.contactMethods
            : ["chat"],
          portfolioLinks: Array.isArray(extraData.portfolioLinks)
            ? extraData.portfolioLinks
            : [],
        },
      });

      await cred.user.getIdToken(true);
      await refreshProfile(cred.user.uid);

      return {
        uid: cred.user.uid,
        role: normalizeRole(response?.role || "client"),
        approvalPending: Boolean(response?.approvalPending),
      };
    } catch (error) {
      throw wrapAuthError(error);
    }
  };

  const resetPassword = async (email) => {
    try {
      await sendPasswordResetEmail(auth, sanitizeString(email).toLowerCase());
    } catch (error) {
      throw wrapAuthError(error);
    }
  };


  const resendVerificationEmail = async () => {
    if (auth.currentUser) {
      await sendEmailVerification(auth.currentUser);
    }
  };

  const normalizedRole = normalizeRole(role);

  const value = {
    user,
    userProfile,
    userData: userProfile,
    role: normalizedRole,
    loading,
    login,
    signup,
    staffSignup,
    logout,
    resetPassword,
    resendVerificationEmail,
    emailVerified: user?.emailVerified || false,
    isAdmin: ["admin", "owner"].includes(normalizedRole),
    isOwner: normalizedRole === "owner",
    isWorker: normalizedRole === "worker",
    isClient: normalizedRole === "client",
    isStaff: ["admin", "worker", "owner"].includes(normalizedRole),
    fetchError,
    refreshProfile,
    sessionExpired,
    setSessionExpired,
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
};
