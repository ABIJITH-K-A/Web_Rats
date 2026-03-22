import { createContext, useContext, useEffect, useState } from 'react';
import {
  onAuthStateChanged,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  sendPasswordResetEmail
} from 'firebase/auth';
import {
  doc, getDoc, setDoc, updateDoc, increment, serverTimestamp
} from 'firebase/firestore';
import { auth, db } from '../config/firebase';

const AuthContext = createContext();
export const useAuth = () => useContext(AuthContext);

/* ---------- helpers ---------- */
const ROLE_TIERS = {
  worker:     { code: 'WRK', pct: 5  },
  manager:    { code: 'MGR', pct: 10 },
  admin:      { code: 'ADM', pct: 15 },
  superadmin: { code: 'SA',  pct: 20 },
  owner:      { code: 'OWR', pct: 25 },
};

function makeReferralCode(role) {
  const tier = ROLE_TIERS[role] || ROLE_TIERS.worker;
  const seg = () => Math.random().toString(36).toUpperCase().slice(2, 6).padEnd(4, 'X');
  return `TNWR-${tier.code}-${seg()}`;
}

function userFriendlyError(code) {
  const map = {
    'auth/invalid-email':        'Enter a valid email.',
    'auth/invalid-credential':   'Invalid email or password.',
    'auth/wrong-password':       'Invalid email or password.',
    'auth/user-not-found':       'Account not found.',
    'auth/email-already-in-use': 'Email already registered.',
    'auth/weak-password':        'Password must be at least 6 characters.',
    'auth/too-many-requests':    'Too many attempts. Please try again later.',
  };
  return map[code] || 'Something went wrong. Please try again.';
}

/* ---------- Provider ---------- */
export const AuthProvider = ({ children }) => {
  const [user, setUser]               = useState(null);
  const [userProfile, setUserProfile] = useState(null);
  const [role, setRole]               = useState(null);
  const [loading, setLoading]         = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      if (currentUser) {
        setUser(currentUser);
        try {
          const snap = await getDoc(doc(db, 'users', currentUser.uid));
          if (snap.exists()) {
            const data = snap.data();
            setUserProfile(data);
            setRole((data.role || '').toLowerCase());
          }
        } catch (err) {
          console.error('Error fetching user profile:', err);
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

  /* --- Login --- */
  const login = async (email, password) => {
    try {
      const cred = await signInWithEmailAndPassword(auth, email.trim().toLowerCase(), password);
      const snap = await getDoc(doc(db, 'users', cred.user.uid));
      return snap.exists() ? snap.data() : {};
    } catch (err) {
      throw new Error(userFriendlyError(err.code));
    }
  };

  /* --- Customer Signup --- */
  const signup = async (email, password, extraData = {}) => {
    try {
      const cred = await createUserWithEmailAndPassword(auth, email.trim().toLowerCase(), password);
      const uid  = cred.user.uid;
      const role = 'client';
      const refCode = makeReferralCode(role);

      // Create user doc
      await setDoc(doc(db, 'users', uid), {
        name:              extraData.name || '',
        email:             email.trim().toLowerCase(),
        phone:             extraData.phone || '',
        role,
        referralCode:      refCode,
        discountPercent:   0,
        usedReferralCode:  extraData.usedReferralCode || null,
        referredBy:        null,
        createdAt:         serverTimestamp(),
      });

      // Validate & track referral code usage
      if (extraData.usedReferralCode) {
        try {
          const refSnap = await getDoc(doc(db, 'referralCodes', extraData.usedReferralCode));
          if (refSnap.exists()) {
            await updateDoc(doc(db, 'referralCodes', extraData.usedReferralCode), {
              timesUsed: increment(1),
            });
            await updateDoc(doc(db, 'users', uid), {
              referredBy: refSnap.data().ownerUid || null,
            });
          }
        } catch (_) {}
      }

      // Create wallet doc
      const nextPay = new Date();
      nextPay.setMonth(nextPay.getMonth() + 1, 1);
      nextPay.setHours(0, 0, 0, 0);
      await setDoc(doc(db, 'wallets', uid), {
        available: 0, pendingApproval: 0, pendingPayout: 0,
        lifetimePaid: 0, nextPayDate: nextPay, lastPayDate: null,
        updatedAt: serverTimestamp(),
      }, { merge: true });

      // Create referral code doc
      await setDoc(doc(db, 'referralCodes', refCode), {
        ownerUid: uid, role, discountPercent: 0,
        timesUsed: 0, createdAt: serverTimestamp(),
      });

      return { uid, role };
    } catch (err) {
      throw new Error(userFriendlyError(err.code));
    }
  };

  /* --- Staff Signup (invite-key based) --- */
  const staffSignup = async (email, password, extraData = {}) => {
    const { inviteKey, firstName, lastName, phone } = extraData;

    // Validate invite key
    const keySnap = await getDoc(doc(db, 'inviteKeys', inviteKey));
    if (!keySnap.exists()) throw new Error('Invalid invite key.');

    const keyData   = keySnap.data() || {};
    const staffRole = (keyData.role || '').toLowerCase();
    const exp       = keyData.expiresAt?.toDate?.() || null;
    const isMulti   = !!keyData.multiUse || Number(keyData.maxUses || 0) > 1;
    const usedCount = Number(keyData.usedCount || 0);
    const maxUses   = Number(keyData.maxUses || 1);

    const STAFF_ROLES = new Set(['admin', 'manager', 'worker']);
    if (!STAFF_ROLES.has(staffRole)) throw new Error('This key is not for staff registration.');
    if (keyData.scope && keyData.scope !== 'staff') throw new Error('Invalid key scope.');
    if (exp && exp < new Date()) throw new Error('Invite key has expired.');
    if (!isMulti && keyData.usedBy) throw new Error('This key has already been used.');
    if (isMulti && usedCount >= maxUses) throw new Error('This invite key has reached max usage.');

    try {
      const cred  = await createUserWithEmailAndPassword(auth, email.trim().toLowerCase(), password);
      const uid   = cred.user.uid;
      const name  = `${firstName} ${lastName}`;
      const tier  = ROLE_TIERS[staffRole] || ROLE_TIERS.worker;
      const refCode = makeReferralCode(staffRole);

      await setDoc(doc(db, 'users', uid), {
        name, email: email.trim().toLowerCase(), phone,
        role: staffRole, inviteKeyUsed: inviteKey,
        referralCode: refCode, discountPercent: tier.pct,
        usedReferralCode: null, referredBy: null,
        createdAt: serverTimestamp(),
      });

      const nextPay = new Date();
      nextPay.setMonth(nextPay.getMonth() + 1, 1);
      nextPay.setHours(0, 0, 0, 0);
      await setDoc(doc(db, 'wallets', uid), {
        available: 0, pendingApproval: 0, pendingPayout: 0,
        lifetimePaid: 0, nextPayDate: nextPay, lastPayDate: null,
        updatedAt: serverTimestamp(),
      }, { merge: true });

      await setDoc(doc(db, 'referralCodes', refCode), {
        ownerUid: uid, role: staffRole, discountPercent: tier.pct,
        timesUsed: 0, createdAt: serverTimestamp(),
      });

      // Mark invite key as used
      if (isMulti) {
        await updateDoc(doc(db, 'inviteKeys', inviteKey), {
          usedCount: increment(1), usedByLast: uid, usedAtLast: serverTimestamp(),
        });
      } else {
        await updateDoc(doc(db, 'inviteKeys', inviteKey), {
          usedBy: uid, usedByName: name, usedAt: serverTimestamp(),
        });
      }

      return { uid, role: staffRole };
    } catch (err) {
      throw new Error(userFriendlyError(err.code));
    }
  };

  /* --- Reset Password --- */
  const resetPassword = async (email) => {
    try {
      await sendPasswordResetEmail(auth, email.trim().toLowerCase());
    } catch (err) {
      throw new Error(userFriendlyError(err.code));
    }
  };

  /* --- Logout --- */
  const logout = () => signOut(auth);

  const value = {
    user, userProfile, role, loading,
    login, signup, staffSignup, logout, resetPassword,
    isAdmin:      ['admin', 'superadmin', 'owner'].includes(role),
    isManager:    role === 'manager',
    isWorker:     role === 'worker',
    isClient:     role === 'client',
    isStaff:      ['admin', 'manager', 'worker', 'superadmin', 'owner'].includes(role),
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
};
