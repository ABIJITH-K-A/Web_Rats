import xss from 'xss';

/**
 * Recursively sanitize strings inside nested objects and arrays
 */
const sanitizePayload = (obj) => {
  if (typeof obj === 'string') {
    return xss(obj);
  }
  
  if (Array.isArray(obj)) {
    return obj.map(item => sanitizePayload(item));
  }
  
  if (obj !== null && typeof obj === 'object') {
    const sanitizedObj = {};
    for (const key in obj) {
      if (Object.prototype.hasOwnProperty.call(obj, key)) {
        sanitizedObj[key] = sanitizePayload(obj[key]);
      }
    }
    return sanitizedObj;
  }
  
  return obj;
};

/**
 * Express middleware to sanitize req.body, req.query, and req.params
 * Protects against XSS attacks by stripping potentially dangerous HTML tags
 */
export const sanitizeRequest = (req, res, next) => {
  if (req.body) req.body = sanitizePayload(req.body);
  if (req.query) req.query = sanitizePayload(req.query);
  if (req.params) req.params = sanitizePayload(req.params);
  
  next();
};
