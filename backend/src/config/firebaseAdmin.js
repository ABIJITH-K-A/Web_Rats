import { applicationDefault, cert, getApps, initializeApp } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import { getFirestore } from 'firebase-admin/firestore';
import { getStorage } from 'firebase-admin/storage';
import { env } from './env.js';

let adminApp = null;

const buildCredential = () => {
  if (env.firebaseProjectId && env.firebaseClientEmail && env.firebasePrivateKey) {
    return cert({
      projectId: env.firebaseProjectId,
      clientEmail: env.firebaseClientEmail,
      privateKey: env.firebasePrivateKey,
    });
  }

  return applicationDefault();
};

export const getAdminApp = () => {
  if (adminApp) {
    return adminApp;
  }

  if (getApps().length > 0) {
    adminApp = getApps()[0];
    return adminApp;
  }

  adminApp = initializeApp({
    credential: buildCredential(),
    ...(env.firebaseProjectId ? { projectId: env.firebaseProjectId } : {}),
  });

  return adminApp;
};

export const adminAuth = () => getAuth(getAdminApp());
export const adminDb = () => getFirestore(getAdminApp());
export const adminStorage = () => getStorage(getAdminApp());

export default {
  getAdminApp,
  adminAuth,
  adminDb,
  adminStorage,
};
