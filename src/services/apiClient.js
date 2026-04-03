import { auth } from '../config/firebase';
import { getErrorMessage } from '../utils/errorHandler';

const API_BASE_URL = String(import.meta.env.VITE_API_BASE_URL || 'http://127.0.0.1:8787')
  .trim()
  .replace(/\/$/, '');

const createApiError = (message, details = {}) => {
  const error = new Error(message);
  Object.assign(error, details);
  return error;
};

const readErrorPayload = async (response) => {
  try {
    const payload = await response.json();
    return payload?.message || payload?.error || null;
  } catch {
    return null;
  }
};

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

export const isBackendConfigured = () => Boolean(API_BASE_URL);

export const getApiBaseUrl = () => API_BASE_URL;

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
    throw createApiError('Backend API is not configured.', {
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
