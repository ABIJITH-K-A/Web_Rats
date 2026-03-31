import { useCallback, useEffect, useState } from "react";
import {
  createUserWithEmailAndPassword,
  onAuthStateChanged,
  sendEmailVerification,
  sendPasswordResetEmail,
  signInWithEmailAndPassword,
  signOut,
} from "firebase/auth";
import {
  doc,
  getDoc,
  getDocFromCache,
  serverTimestamp,
  setDoc,
  updateDoc,
  writeBatch,
} from "firebase/firestore";
import { auth, db } from "../config/firebase";
import { logAuditEvent } from "../services/auditService";
import { buildWalletDocument } from "../services/financialService";
import {
  STAFF_ROLES,
  getReferralTier,
  makeReferralCode,
  normalizeRole,
} from "../utils/systemRules";
import useIdleTimeout from "../hooks/useIdleTimeout";
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
  
  if (typeof code !== 'string') return "An unexpected error occurred. Please try again.";
  return map[code] || `Error: ${code.split('/').pop()?.replace(/-/g, ' ')} (Please try again).`;
};

const sanitizeString = (value) => String(value || "").trim();

const fetchUserProfile = async (uid) => {
  const ref = doc(db, "users", uid);
  try {
    // Attempt server fetch
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
        // Fallback to cache immediately if network is down/unreliable
        const cachedSnap = await getDocFromCache(ref);
        return cachedSnap.exists() ? cachedSnap.data() : null;
      } catch (cacheError) {
        // Cache miss and offline — nothing we can do but wait for reconnect
        console.warn("Profile fetch failed: Offline and cache miss.");
        return null;
      }
    }
    throw error;
  }
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [userProfile, setUserProfile] = useState(null);
  const [role, setRole] = useState(null);
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState(null);
  const [sessionExpired, setSessionExpired] = useState(false);

  const handleSessionTimeout = useCallback(async () => {
    setSessionExpired(true);
    try {
      await signOut(auth);
    } catch (error) {
      console.error("Session timeout logout error:", error);
    }
  }, []);

  const { resetIdleTimer } = useIdleTimeout(handleSessionTimeout);

  const refreshProfile = useCallback(async (uid) => {
    const targetUid = uid || user?.uid;
    if (!targetUid) return;

    try {
      const data = await fetchUserProfile(targetUid);
      if (data) {
        setUserProfile(data);
        setRole(normalizeRole(data.role));
        setFetchError(null);
      }
    } catch (error) {
      console.error("Error refreshing profile:", error);
      // Don't clear userProfile/role here to keep the UI from breaking
      // Just set the error for the UI to show a 'Retry' if needed
      setFetchError(error.message);
      
      // If it's the internal assertion error, log a specific warning
      if (error.message?.includes("INTERNAL ASSERTION")) {
        console.warn("Firestore SDK internal crash detected. A page refresh is recommended.");
      }
    }
  }, [user?.uid]);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      if (currentUser) {
        setUser(currentUser);
        // Don't block initial render — fetch profile in the background
        // so the site loads even when Firestore is unreachable (offline)
        refreshProfile(currentUser.uid).finally(() => setLoading(false));
      } else {
        setUser(null);
        setUserProfile(null);
        setRole(null);
        setFetchError(null);
        setLoading(false);
      }
    });

    return unsubscribe;
  }, [refreshProfile]);

  const login = async (email, password) => {
    try {
      const normalizedEmail = sanitizeString(email).toLowerCase();
      const cred = await signInWithEmailAndPassword(
        auth,
        normalizedEmail,
        password
      );
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

      resetIdleTimer();
      setSessionExpired(false);
      return profile;
    } catch (error) {
      if (error instanceof Error && !error.message.startsWith("auth/")) {
        throw error;
      }
      throw new Error(userFriendlyError(error.code));
    }
  };

  const signup = async (email, password, extraData = {}) => {
    const normalizedEmail = sanitizeString(email).toLowerCase();
    const roleValue = "client";
    const referralCodeUsed = sanitizeString(extraData.usedReferralCode || "").toUpperCase();

    try {
      let referralData = null;
      if (referralCodeUsed) {
        const referralSnap = await getDoc(doc(db, "referralCodes", referralCodeUsed));
        if (!referralSnap.exists()) {
          throw new Error("Referral code is invalid.");
        }
        referralData = referralSnap.data();
      }

      const cred = await createUserWithEmailAndPassword(
        auth,
        normalizedEmail,
        password
      );

      // Send verification email
      await sendEmailVerification(cred.user);

      const uid = cred.user.uid;
      const personalReferralCode = makeReferralCode(roleValue);
      const referralTier = getReferralTier(roleValue);
      const batch = writeBatch(db);

      batch.set(doc(db, "users", uid), {
        name: sanitizeString(extraData.name),
        email: normalizedEmail,
        phone: sanitizeString(extraData.phone),
        role: roleValue,
        status: "active",
        customerType: sanitizeString(extraData.customerType || "new").toLowerCase(),
        referralCode: personalReferralCode,
        discountPercent: Number(referralData?.discountPercent || 0),
        usedReferralCode: referralCodeUsed || null,
        referredBy: referralData?.ownerUid || null,
        notificationPreferences: {
          in_app: true,
          email: false,
          whatsapp: false,
        },
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });

      batch.set(doc(db, "wallets", uid), buildWalletDocument(uid));

      batch.set(doc(db, "referralCodes", personalReferralCode), {
        ownerUid: uid,
        role: roleValue,
        discountPercent: referralTier.pct,
        timesUsed: 0,
        createdAt: serverTimestamp(),
      });

      if (referralCodeUsed) {
        batch.update(doc(db, "referralCodes", referralCodeUsed), {
          timesUsed: Number(referralData?.timesUsed || 0) + 1,
          updatedAt: serverTimestamp(),
        });
      }

      await batch.commit();

      await logAuditEvent({
        actorId: uid,
        actorRole: roleValue,
        action: "user_signup",
        targetType: "user",
        targetId: uid,
        severity: "low",
        metadata: {
          email: normalizedEmail,
          referredBy: referralData?.ownerUid || null,
        },
      });

      return { uid, role: roleValue };
    } catch (error) {
      if (error instanceof Error && !error.code) {
        throw error;
      }
      throw new Error(userFriendlyError(error.code));
    }
  };

  const staffSignup = async (email, password, extraData = {}) => {
    const inviteKey = sanitizeString(extraData.inviteKey).toUpperCase();
    const normalizedEmail = sanitizeString(email).toLowerCase();
    const firstName = sanitizeString(extraData.firstName);
    const lastName = sanitizeString(extraData.lastName);
    const phone = sanitizeString(extraData.phone);

    if (!inviteKey) {
      throw new Error("Invite key is required.");
    }

    const keyRef = doc(db, "inviteKeys", inviteKey);
    const keySnap = await getDoc(keyRef);
    if (!keySnap.exists()) throw new Error("Invalid invite key.");

    const keyData = keySnap.data() || {};
    const staffRole = normalizeRole(keyData.role);
    const exp = keyData.expiresAt?.toDate?.() || null;
    const isMulti = Boolean(keyData.multiUse || Number(keyData.maxUses || 0) > 1);
    const usedCount = Number(keyData.usedCount || 0);
    const maxUses = Number(keyData.maxUses || 1);

    if (!STAFF_ROLES.includes(staffRole) || staffRole === "client") {
      throw new Error("This key is not for staff registration.");
    }
    if (keyData.scope && keyData.scope !== "staff") {
      throw new Error("Invalid key scope.");
    }
    if (sanitizeString(keyData.status || "active").toLowerCase() !== "active") {
      throw new Error("Invite key is no longer active.");
    }
    if (exp && exp < new Date()) throw new Error("Invite key has expired.");
    if (!isMulti && (keyData.usedBy || keyData.used)) {
      throw new Error("This key has already been used.");
    }
    if (isMulti && usedCount >= maxUses) {
      throw new Error("This invite key has reached max usage.");
    }

    try {
      const cred = await createUserWithEmailAndPassword(
        auth,
        normalizedEmail,
        password
      );

      // Send verification email
      await sendEmailVerification(cred.user);

      const uid = cred.user.uid;
      const name = `${firstName} ${lastName}`.trim();
      const referralTier = getReferralTier(staffRole);
      const personalReferralCode = makeReferralCode(staffRole);
      const batch = writeBatch(db);

      batch.set(doc(db, "users", uid), {
        name,
        email: normalizedEmail,
        phone,
        role: staffRole,
        status: "active",
        inviteKeyUsed: inviteKey,
        referralCode: personalReferralCode,
        discountPercent: referralTier.pct,
        usedReferralCode: null,
        referredBy: null,
        notificationPreferences: {
          in_app: true,
          email: false,
          whatsapp: false,
        },
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });

      batch.set(doc(db, "wallets", uid), buildWalletDocument(uid));

      batch.set(doc(db, "referralCodes", personalReferralCode), {
        ownerUid: uid,
        role: staffRole,
        discountPercent: referralTier.pct,
        timesUsed: 0,
        createdAt: serverTimestamp(),
      });

      // Force each invite key to be single-use
      batch.update(keyRef, {
        used: true,
        status: "used",
        usedBy: uid,
        usedByName: name,
        usedAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });

      await batch.commit();

      await logAuditEvent({
        actorId: uid,
        actorRole: staffRole,
        action: "staff_signup",
        targetType: "user",
        targetId: uid,
        severity: "medium",
        metadata: {
          email: normalizedEmail,
          inviteKey,
          role: staffRole,
        },
      });

      return { uid, role: staffRole };
    } catch (error) {
      if (error instanceof Error && !error.code) {
        throw error;
      }
      throw new Error(userFriendlyError(error.code));
    }
  };

  const resetPassword = async (email) => {
    try {
      await sendPasswordResetEmail(auth, sanitizeString(email).toLowerCase());
    } catch (error) {
      throw new Error(userFriendlyError(error.code));
    }
  };

  const logout = () => signOut(auth);

  const resendVerificationEmail = async () => {
    if (auth.currentUser) {
      await sendEmailVerification(auth.currentUser);
    }
  };

  const value = {
    user,
    userProfile,
    userData: userProfile,
    role,
    loading,
    login,
    signup,
    staffSignup,
    logout,
    resetPassword,
    resendVerificationEmail,
    emailVerified: user?.emailVerified || false,
    isAdmin: ["admin", "superadmin", "owner"].includes(role),
    isManager: role === "manager",
    isWorker: role === "worker",
    isClient: role === "client",
    isStaff: ["admin", "manager", "worker", "superadmin", "owner"].includes(role),
    fetchError,
    refreshProfile,
    sessionExpired,
    clearSessionExpired: () => setSessionExpired(false),
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
};
