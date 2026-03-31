/**
 * Utility to sanitize user inputs on the frontend before displaying them or sending them
 * to the backend/Firestore to prevent XSS.
 */

const entityMap = {
  '&': '&amp;',
  '<': '&lt;',
  '>': '&gt;',
  '"': '&quot;',
  "'": '&#39;',
  '/': '&#x2F;',
  '`': '&#x60;',
  '=': '&#x3D;'
};

/**
 * Encodes HTML entities in a string.
 * Use this when displaying raw user input in a place that might be interpreted as HTML.
 */
export const escapeHtml = (string) => {
  return String(string).replace(/[&<>"'`=\/]/g, function (s) {
    return entityMap[s];
  });
};

/**
 * Basic payload sanitizer for objects (strips bad characters).
 * Note: React automatically escapes variables in JSX, so this is mainly useful
 * for data being stored raw in Firestore or sent in REST payloads where
 * the backend `xss` library isn't applied (e.g. direct Firestore writes).
 */
export const sanitizeData = (data) => {
  if (typeof data === 'string') {
    return escapeHtml(data);
  }
  
  if (Array.isArray(data)) {
    return data.map(item => sanitizeData(item));
  }
  
  if (data !== null && typeof data === 'object') {
    const sanitized = {};
    for (const key in data) {
      if (Object.prototype.hasOwnProperty.call(data, key)) {
        sanitized[key] = sanitizeData(data[key]);
      }
    }
    return sanitized;
  }
  
  return data;
};

export default {
  escapeHtml,
  sanitizeData
};
