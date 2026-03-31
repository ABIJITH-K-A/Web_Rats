import crypto from 'crypto';

// In-memory store for CSRF tokens (for simple implementations)
// For production, use Redis or a proper session store
const csrfTokens = new Map();

/**
 * Middleware to generate and attach a CSRF token to the response
 * The frontend must read this from the headers/cookie and send it back
 * in the X-CSRF-Token header for state-changing requests
 */
export const generateCsrfToken = (req, res, next) => {
  // Only generate a new token if we don't already have one in the session
  const token = crypto.randomBytes(32).toString('hex');
  const sessionId = req.headers['x-session-id'] || req.ip; // Fallback to IP if no session ID
  
  // Store it (with an expiry in a real app)
  csrfTokens.set(sessionId, token);
  
  // Send token to client
  res.cookie('XSRF-TOKEN', token, {
    httpOnly: false, // Must be readable by frontend JS to attach to headers
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    maxAge: 8 * 60 * 60 * 1000 // 8 hours
  });
  
  next();
};

/**
 * Middleware to validate the CSRF token on specific endpoints
 */
export const requireCsrf = (req, res, next) => {
  // Methods that don't change state are safe
  if (['GET', 'HEAD', 'OPTIONS'].includes(req.method)) {
    return next();
  }

  const tokenFromHeader = req.headers['x-csrf-token'];
  const sessionId = req.headers['x-session-id'] || req.ip;
  const storedToken = csrfTokens.get(sessionId);

  if (!tokenFromHeader || !storedToken || tokenFromHeader !== storedToken) {
    return res.status(403).json({ error: 'Invalid or missing CSRF token' });
  }

  next();
};
