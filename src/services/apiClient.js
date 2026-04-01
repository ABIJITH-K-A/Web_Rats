import { auth } from '../config/firebase';

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
  } catch (error) {
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

  const token = await currentUser.getIdToken(authMode === 'required');
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
      const message =
        (await readErrorPayload(response)) || 'The request could not be completed.';
      throw createApiError(message, {
        statusCode: response.status,
      });
    }

    if (response.status === 204) {
      return null;
    }

    return response.json();
  } catch (error) {
    if (error.name === 'TypeError' && error.message === 'Failed to fetch') {
      throw createApiError('Could not connect to the backend server. Please ensure it is running.', {
        code: 'connection_refused',
      });
    }
    throw error;
  }
};

export default {
  isBackendConfigured,
  getApiBaseUrl,
  apiRequest,
};
