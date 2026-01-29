// Centralized error handling middleware
import { sendError } from '../utils/index.js';

export const errorHandler = (err, req, res, next) => {
  console.error('Error:', err);

  // Handle custom app errors
  if (err.statusCode) {
    return sendError(res, err.message, err.statusCode, err);
  }

  // Handle JWT errors
  if (err.name === 'JsonWebTokenError') {
    return sendError(res, 'Invalid token', 401, err);
  }

  if (err.name === 'TokenExpiredError') {
    return sendError(res, 'Token expired', 401, err);
  }

  // Handle Mongoose validation errors
  if (err.name === 'ValidationError') {
    const message = Object.values(err.errors)
      .map(e => e.message)
      .join(', ');
    return sendError(res, `Validation error: ${message}`, 400, err);
  }

  // Handle Mongoose duplicate key errors
  if (err.code === 11000) {
    const field = Object.keys(err.keyPattern)[0];
    return sendError(res, `${field} already exists`, 409, err);
  }

  // Default error
  return sendError(res, err.message || 'Internal server error', 500, err);
};

export const notFoundHandler = (req, res) => {
  return sendError(res, 'Route not found', 404);
};
