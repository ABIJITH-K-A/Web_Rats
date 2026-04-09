import { auth } from '../config/firebase';
import { getErrorMessage } from '../utils/errorHandler';

const API_BASE_URL = String(import.meta.env.VITE_API_BASE_URL || 'http://127.0.0.1:8787')
  .trim()
  .replace(/\/$/, '');

/**
 * Creates a structured local error to surface seamlessly to the UI.
 * @param {string} message User-facing error message
 * @param {Object} details Additional metadata about the crash
 * @returns {Error} Formatted error object
 */
const createApiError = (message, details = {}) => {
  const error = new Error(message);
  Object.assign(error, details);
  return error;
};

/**
 * Attempts to extract a structured backend error payload from the response object
 * @param {Response} response API fetch response
 * @returns {Promise<string|null>} The parsed message if available
 */
const readErrorPayload = async (response) => {
  try {
    const payload = await response.json();
    return payload?.message || payload?.error || null;
  } catch {
    return null;
  }
};

/**
 * Generates the HTTP Authorization headers using Firebase Auth ID tokens.
 * @param {'optional' | 'required'} authMode Indicates if a missing user should throw a local auth error 
 * @returns {Promise<Object>} The header object `{ Authorization: "Bearer ..." }` or `{}`
 */
const getAuthorizationHeader = async (authMode = 'optional') => {
  const currentUser = auth.currentUser;

  if (!currentUser) {
    if (authMode === 'required') {
      throw createApiError('Please sign in to continue.', {
        code: 'missing_auth',
      });
    }

    return {};
  }

  const token = await currentUser.getIdToken(true); // Force refresh to avoid expired tokens
  return token ? { Authorization: `Bearer ${token}` } : {};
};

/**
 * @returns {boolean} True if the custom backend API is mapped and valid
 */
export const isBackendConfigured = () => Boolean(API_BASE_URL);

/**
 * @returns {string} The base URL for the Node/Cloudflare custom backend
 */
export const getApiBaseUrl = () => API_BASE_URL;

/**
 * Executes an HTTP fetch against the custom backend API securely
 * @param {string} path The relative backend endpoint (e.g., `/orders/create`)
 * @param {Object} options Configuration block including `method`, `body`, `authMode`
 * @returns {Promise<Object|null>} JSON payload or null response
 */
export const apiRequest = async (
  path,
  {
    method = 'GET',
    body,
    authMode = 'optional',
    headers = {},
  } = {}
) => {
  if (!API_BASE_URL) {
    throw createApiError('Backend API is not configured. Please use Firebase native fallback.', {
      code: 'missing_api_base_url',
    });
  }

  try {
    const authHeaders = await getAuthorizationHeader(authMode);
    const response = await fetch(`${API_BASE_URL}${path}`, {
      method,
      headers: {
        ...(body !== undefined ? { 'Content-Type': 'application/json' } : {}),
        ...authHeaders,
        ...headers,
      },
      ...(body !== undefined ? { body: JSON.stringify(body) } : {}),
    });

    if (!response.ok) {
      const backendMessage = await readErrorPayload(response);
      const userMessage = getErrorMessage({ status: response.status }, backendMessage);
      throw createApiError(userMessage, {
        statusCode: response.status,
        originalMessage: backendMessage,
      });
    }

    if (response.status === 204) {
      return null;
    }

    return response.json();
  } catch (error) {
    if (error.name === 'TypeError' && error.message === 'Failed to fetch') {
      throw createApiError('Could not connect to the server. Please check your internet connection and try again.', {
        code: 'connection_refused',
      });
    }
    // If it's already a user-friendly message, re-throw it
    if (error.message && error.message.length < 100 && !error.message.includes('Error:')) {
      throw error;
    }
    // Otherwise wrap it in a user-friendly message
    throw createApiError(getErrorMessage(error, 'Something went wrong. Please try again.'), {
      originalError: error,
    });
  }
};

export default {
  isBackendConfigured,
  getApiBaseUrl,
  apiRequest,
};
