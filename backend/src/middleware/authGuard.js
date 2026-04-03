import { adminAuth, adminDb } from '../config/firebaseAdmin.js';
import { HttpError } from '../lib/httpError.js';
import { normalizeRole } from '../lib/roles.js';
import { redis } from '../config/db.js';

const parseBearerToken = (headerValue = '') => {
  const [scheme, token] = String(headerValue || '').trim().split(/\s+/);
  if (scheme !== 'Bearer' || !token) return null;
  return token;
};

const attachCurrentUser = async (req, decodedToken) => {
  const uid = decodedToken.uid;
  const cacheKey = `user:profile:${uid}`;
  let profile = null;

  // 1. Try Cache (Redis)
  if (redis) {
    try {
      const cached = await redis.get(cacheKey);
      if (cached) {
        profile = JSON.parse(cached);
      }
    } catch (err) {
      // Silently fail cache - will fallback to Firestore
      console.debug('Redis cache miss, using Firestore');
    }
  }

  // 2. Fallback to Firestore
  if (!profile) {
    const userRef = adminDb().collection('users').doc(uid);
    const userSnapshot = await userRef.get();
    profile = userSnapshot.exists ? userSnapshot.data() : {};

    // 3. Store in Cache (TTL 10 mins)
    if (redis && userSnapshot.exists) {
      try {
        await redis.set(cacheKey, JSON.stringify(profile), 'EX', 600);
      } catch (err) {
        console.error('Redis Cache Set Error:', err);
      }
    }
  }

  // Check token age (8 hours max)
  const EIGHT_HOURS_SEC = 8 * 60 * 60;
  const currentTimeSec = Math.floor(Date.now() / 1000);
  if (decodedToken.auth_time && (currentTimeSec - decodedToken.auth_time > EIGHT_HOURS_SEC)) {
    throw new HttpError(401, 'Session expired. Please log in again.');
  }

  // Check account status
  if (profile.status === 'suspended' || profile.status === 'fired') {
    throw new HttpError(403, 'Account has been suspended.');
  }

  req.currentUser = {
    uid,
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
