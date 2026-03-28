import { createContext, useContext, useEffect, useState } from "react";
import {
  createUserWithEmailAndPassword,
  onAuthStateChanged,
  sendPasswordResetEmail,
  signInWithEmailAndPassword,
  signOut,
} from "firebase/auth";
import {
  doc,
  getDoc,
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

const AuthContext = createContext();
export const useAuth = () => useContext(AuthContext);

const userFriendlyError = (code) => {
  const map = {
    "auth/invalid-email": "Enter a valid email.",
    "auth/invalid-credential": "Invalid email or password.",
    "auth/wrong-password": "Invalid email or password.",
    "auth/user-not-found": "Account not found.",
    "auth/email-already-in-use": "Email already registered.",
    "auth/weak-password": "Password must be at least 6 characters.",
    "auth/too-many-requests": "Too many attempts. Please try again later.",
  };
  return map[code] || "Something went wrong. Please try again.";
};

const sanitizeString = (value) => String(value || "").trim();

const fetchUserProfile = async (uid) => {
  const snap = await getDoc(doc(db, "users", uid));
  return snap.exists() ? snap.data() : null;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [userProfile, setUserProfile] = useState(null);
  const [role, setRole] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      if (currentUser) {
        setUser(currentUser);
        try {
          const data = await fetchUserProfile(currentUser.uid);
          setUserProfile(data);
          setRole(normalizeRole(data?.role));
        } catch (error) {
          console.error("Error fetching user profile:", error);
        }
      } else {
        setUser(null);
        setUserProfile(null);
        setRole(null);
      }
      setLoading(false);
    });

    return unsubscribe;
  }, []);

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
        throw new Error("Profile not found for this account.");
      }

      const accountStatus = sanitizeString(profile.status || "active").toLowerCase();
      if (["suspended", "fired"].includes(accountStatus)) {
        await signOut(auth);
        throw new Error("This account is not currently active.");
      }

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

      if (isMulti) {
        batch.update(keyRef, {
          usedCount: usedCount + 1,
          usedByLast: uid,
          usedAtLast: serverTimestamp(),
          updatedAt: serverTimestamp(),
        });
      } else {
        batch.update(keyRef, {
          used: true,
          status: "used",
          usedBy: uid,
          usedByName: name,
          usedAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        });
      }

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
    isAdmin: ["admin", "superadmin", "owner"].includes(role),
    isManager: role === "manager",
    isWorker: role === "worker",
    isClient: role === "client",
    isStaff: ["admin", "manager", "worker", "superadmin", "owner"].includes(role),
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
};
