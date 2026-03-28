import { adminAuth, adminDb } from '../config/firebaseAdmin.js';
import { HttpError } from '../lib/httpError.js';
import { normalizeRole } from '../lib/roles.js';

const parseBearerToken = (headerValue = '') => {
  const [scheme, token] = String(headerValue || '').trim().split(/\s+/);
  if (scheme !== 'Bearer' || !token) return null;
  return token;
};

const attachCurrentUser = async (req, decodedToken) => {
  const userRef = adminDb().collection('users').doc(decodedToken.uid);
  const userSnapshot = await userRef.get();
  const profile = userSnapshot.exists ? userSnapshot.data() : {};

  req.currentUser = {
    uid: decodedToken.uid,
    email: decodedToken.email || profile.email || null,
    role: normalizeRole(profile.role || decodedToken.role),
    profile,
    token: decodedToken,
  };
};

export const optionalAuthGuard = async (req, res, next) => {
  try {
    const token = parseBearerToken(req.headers.authorization);

    if (!token) {
      req.currentUser = null;
      next();
      return;
    }

    const decodedToken = await adminAuth().verifyIdToken(token);
    await attachCurrentUser(req, decodedToken);
    next();
  } catch (error) {
    next(new HttpError(401, 'Invalid or expired auth token.'));
  }
};

export const authGuard = async (req, res, next) => {
  try {
    const token = parseBearerToken(req.headers.authorization);

    if (!token) {
      throw new HttpError(401, 'Missing bearer token.');
    }

    const decodedToken = await adminAuth().verifyIdToken(token);
    await attachCurrentUser(req, decodedToken);
    next();
  } catch (error) {
    next(
      error instanceof HttpError
        ? error
        : new HttpError(401, 'Invalid or expired auth token.')
    );
  }
};

export default {
  authGuard,
  optionalAuthGuard,
};
