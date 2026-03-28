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

  const payload = {
    message:
      statusCode >= 500 ? 'Internal server error.' : error.message || 'Request failed.',
  };

  if (error instanceof HttpError && error.details) {
    payload.details = error.details;
  }

  if (statusCode >= 500) {
    console.error('Backend error:', error);
  }

  res.status(statusCode).json(payload);
};

export default errorHandler;
