/**
 * Error Handler Utility
 * Centralized user-friendly error messages for the application
 */

// Common Firebase Auth error codes and user-friendly messages
const AUTH_ERROR_MESSAGES = {
  'auth/user-not-found': 'No account found with this email. Please check your email or sign up.',
  'auth/wrong-password': 'Incorrect password. Please try again or reset your password.',
  'auth/invalid-email': 'Please enter a valid email address.',
  'auth/invalid-credential': 'Incorrect email or password. Please try again.',
  'auth/user-disabled': 'This account has been disabled. Please contact support.',
  'auth/too-many-requests': 'Too many failed attempts. Please try again later.',
  'auth/requires-recent-login': 'Please log in again to continue.',
  'auth/email-already-in-use': 'This email is already registered. Please log in instead.',
  'auth/weak-password': 'Password is too weak. Please use at least 6 characters.',
  'auth/network-request-failed': 'Network error. Please check your internet connection.',
  'auth/timeout': 'Request timed out. Please try again.',
  'auth/popup-closed-by-user': 'Sign-in popup was closed. Please try again.',
  'auth/cancelled-popup-request': 'Sign-in was cancelled. Please try again.',
  'auth/operation-not-allowed': 'This sign-in method is not enabled. Please contact support.',
};

// Firebase Firestore error codes
const FIRESTORE_ERROR_MESSAGES = {
  'permission-denied': 'You don\'t have permission to access this data. Please log in.',
  'not-found': 'The requested data was not found.',
  'already-exists': 'This item already exists.',
  'resource-exhausted': 'Too many requests. Please try again later.',
  'failed-precondition': 'Operation failed. Please try again.',
  'aborted': 'Operation was aborted. Please try again.',
  'out-of-range': 'Invalid range. Please check your input.',
  'unimplemented': 'This feature is not available yet.',
  'internal': 'Something went wrong. Please try again later.',
  'unavailable': 'Service temporarily unavailable. Please try again later.',
  'data-loss': 'Data error occurred. Please contact support.',
  'unauthenticated': 'Please log in to continue.',
};

// Network and API errors
const NETWORK_ERROR_MESSAGES = {
  'ECONNREFUSED': 'Unable to connect to the server. Please check your internet connection.',
  'ETIMEDOUT': 'Request timed out. Please try again.',
  'ENOTFOUND': 'Network error. Please check your internet connection.',
  'NETWORK_ERROR': 'Network error. Please check your internet connection.',
  'Failed to fetch': 'Network error. Please check your internet connection.',
};

// HTTP status codes
const HTTP_ERROR_MESSAGES = {
  400: 'Invalid request. Please check your input.',
  401: 'Please log in to continue.',
  403: 'You don\'t have permission to perform this action.',
  404: 'The requested resource was not found.',
  409: 'This action conflicts with existing data.',
  422: 'Invalid data provided. Please check your input.',
  429: 'Too many requests. Please try again later.',
  500: 'Server error. Please try again later.',
  502: 'Service temporarily unavailable. Please try again later.',
  503: 'Service temporarily unavailable. Please try again later.',
  504: 'Request timed out. Please try again.',
};

// Validation error messages
const VALIDATION_MESSAGES = {
  'required': 'This field is required.',
  'email': 'Please enter a valid email address.',
  'min': 'Value is too small.',
  'max': 'Value is too large.',
  'minLength': 'Value is too short.',
  'maxLength': 'Value is too long.',
  'pattern': 'Invalid format.',
  'match': 'Values do not match.',
};

/**
 * Get user-friendly error message from error object/code
 * @param {Error|Object|string} error - The error object, code, or message
 * @param {string} fallbackMessage - Fallback message if no specific message found
 * @returns {string} User-friendly error message
 */
export const getErrorMessage = (error, fallbackMessage = 'Something went wrong. Please try again.') => {
  if (!error) return fallbackMessage;

  // If it's a string, check if it's a known code
  if (typeof error === 'string') {
    return (
      AUTH_ERROR_MESSAGES[error] ||
      FIRESTORE_ERROR_MESSAGES[error] ||
      NETWORK_ERROR_MESSAGES[error] ||
      error
    );
  }

  // Extract error code or message
  const errorCode = error.code || error.errorCode;
  const errorMessage = error.message || error.errorMessage || error.toString();

  // Check Firebase Auth errors
  if (errorCode && AUTH_ERROR_MESSAGES[errorCode]) {
    return AUTH_ERROR_MESSAGES[errorCode];
  }

  // Check Firestore errors
  if (errorCode && FIRESTORE_ERROR_MESSAGES[errorCode]) {
    return FIRESTORE_ERROR_MESSAGES[errorCode];
  }

  // Check HTTP status
  if (error.status && HTTP_ERROR_MESSAGES[error.status]) {
    return HTTP_ERROR_MESSAGES[error.status];
  }

  // Check for specific error messages in the error string
  const errorString = errorMessage.toLowerCase();
  
  if (errorString.includes('permission-denied') || errorString.includes('insufficient permissions')) {
    return 'You don\'t have permission to access this. Please log in.';
  }
  
  if (errorString.includes('network') || errorString.includes('fetch') || errorString.includes('offline')) {
    return 'Network error. Please check your internet connection.';
  }

  if (errorString.includes('timeout')) {
    return 'Request timed out. Please try again.';
  }

  if (errorString.includes('not found') || errorString.includes('does not exist')) {
    return 'The requested item was not found.';
  }

  if (errorString.includes('already exists') || errorString.includes('duplicate')) {
    return 'This item already exists.';
  }

  if (errorString.includes('invalid') || errorString.includes('validation')) {
    return 'Please check your input and try again.';
  }

  // Return original message if it looks user-friendly, otherwise fallback
  if (errorMessage.length < 100 && !errorMessage.includes('Error:')) {
    return errorMessage;
  }

  return fallbackMessage;
};

/**
 * Get action-specific error message
 * @param {string} action - The action being performed (e.g., 'login', 'signup', 'order')
 * @param {Error} error - The error object
 * @returns {string} Context-aware error message
 */
export const getActionErrorMessage = (action, error) => {
  const actionMessages = {
    login: {
      default: 'Unable to log in. Please check your credentials and try again.',
      'auth/user-not-found': 'No account found with this email. Would you like to sign up?',
      'auth/wrong-password': 'Incorrect password. Please try again or reset your password.',
      'auth/invalid-credential': 'Incorrect email or password. Please try again.',
    },
    signup: {
      default: 'Unable to create account. Please check your information and try again.',
      'auth/email-already-in-use': 'This email is already registered. Please log in instead.',
      'auth/weak-password': 'Password is too weak. Please use at least 6 characters.',
    },
    order: {
      default: 'Unable to process your order. Please try again.',
      'permission-denied': 'Please log in to place an order.',
    },
    payment: {
      default: 'Payment processing failed. Please try again.',
      'card-error': 'Your card was declined. Please check your card details.',
      'insufficient-funds': 'Insufficient funds. Please use a different payment method.',
    },
    profile: {
      default: 'Unable to update profile. Please try again.',
      'permission-denied': 'You don\'t have permission to update this profile.',
    },
    'password-reset': {
      default: 'Unable to send password reset email. Please check your email address.',
      'auth/user-not-found': 'No account found with this email. Please check and try again.',
    },
  };

  const actionConfig = actionMessages[action] || { default: 'Something went wrong. Please try again.' };
  const errorCode = error?.code || error?.errorCode;
  
  return actionConfig[errorCode] || actionConfig.default || getErrorMessage(error);
};

/**
 * Show toast notification with error
 * @param {Function} toastFn - Toast function (e.g., toast.error)
 * @param {Error} error - Error object
 * @param {string} fallbackMessage - Fallback message
 */
export const showErrorToast = (toastFn, error, fallbackMessage) => {
  if (!toastFn) {
    console.error('Toast function not provided:', error);
    return;
  }
  
  const message = getErrorMessage(error, fallbackMessage);
  toastFn(message);
};

/**
 * Handle async operation with user-friendly error handling
 * @param {Function} asyncFn - Async function to execute
 * @param {Object} options - Options object
 * @param {Function} options.onError - Error callback
 * @param {Function} options.toast - Toast function for showing errors
 * @param {string} options.fallbackMessage - Fallback error message
 * @returns {Promise} Result of async function or null on error
 */
export const handleAsync = async (asyncFn, options = {}) => {
  const { onError, toast, fallbackMessage, showError = true } = options;

  try {
    return await asyncFn();
  } catch (error) {
    const message = getErrorMessage(error, fallbackMessage);
    
    if (showError && toast) {
      showErrorToast(toast, error, fallbackMessage);
    }

    if (onError) {
      onError(error, message);
    }

    return null;
  }
};

export default {
  getErrorMessage,
  getActionErrorMessage,
  showErrorToast,
  handleAsync,
};
