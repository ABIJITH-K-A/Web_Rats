import { HttpError } from '../lib/httpError.js';

export const errorHandler = (error, req, res, next) => {
  if (res.headersSent) {
    next(error);
    return;
  }

  const statusCode =
    error instanceof HttpError
      ? error.statusCode
      : Number(error?.statusCode || error?.status || 500);

  // User-friendly error messages based on status code
  let message = error.message || 'Request failed.';

  // Specific error messages for common scenarios
  if (statusCode >= 500) {
    message = 'We encountered an unexpected error. Our team has been notified and we\'re working to fix it.';
  } else if (statusCode === 404) {
    message = 'The page or resource you\'re looking for doesn\'t exist.';
  } else if (statusCode === 403) {
    message = 'You don\'t have permission to access this resource.';
  } else if (statusCode === 401) {
    message = 'Please sign in to continue.';
  } else if (statusCode === 400) {
    // Keep the original validation message for 400 errors
    message = error.message || 'There was an issue with your request. Please check your input and try again.';
  } else if (statusCode === 429) {
    message = 'You\'ve made too many requests. Please wait a moment and try again.';
  }

  const payload = {
    message,
  };

  if (error instanceof HttpError && error.details) {
    payload.details = error.details;
  }

  if (statusCode >= 500) {
    console.error('Backend error:', error);
    payload.errorId = `ERR-${Date.now()}-${Math.random().toString(36).substring(2, 8)}`;
  }

  res.status(statusCode).json(payload);
};

export default errorHandler;
