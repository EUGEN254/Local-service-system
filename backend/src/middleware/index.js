// Centralized exports for middleware
export { errorHandler, notFoundHandler } from './errorHandler.js';
export { default as adminAuth } from './adminAuth.js';
export { default as userAuth } from './userAuth.js';
export { default as getCustomerName } from './getCustomerName.js';
export { default as getServiceProviderName } from './getServiceProviderName.js';
export { generateAuthToken } from './mpesaAuth.js';
export { default as upload } from './uploadMiddleware.js';
