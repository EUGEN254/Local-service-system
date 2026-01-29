// Constants for the application

export const USER_ROLES = {
  CUSTOMER: "customer",
  SERVICE_PROVIDER: "serviceprovider",
  SERVICE_PROVIDER_ALT: "service-provider",
  ADMIN: "admin",
};

export const BOOKING_STATUS = {
  PENDING: "Pending",
  CONFIRMED: "Confirmed",
  IN_PROGRESS: "In Progress",
  WAITING_FOR_WORK: "Waiting for Work",
  COMPLETED: "Completed",
  CANCELLED: "Cancelled",
};

export const PAYMENT_STATUS = {
  NOT_PAID: "Not Paid",
  PENDING: "Pending",
  PAID: "Paid",
  FAILED: "Failed",
};

export const PAYMENT_METHOD = {
  MPESA: "M-Pesa",
  CASH: "Cash",
  CARD: "Card",
};

export const NOTIFICATION_CATEGORY = {
  BOOKING: "Booking",
  TRANSACTION: "Transaction",
  SYSTEM: "System",
  USER: "User",
  SERVICE_PROVIDER: "Service Provider",
};

export const ERROR_CODES = {
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  CONFLICT: 409,
  INTERNAL_ERROR: 500,
};

export const HTTP_STATUS = {
  OK: 200,
  CREATED: 201,
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  CONFLICT: 409,
  INTERNAL_SERVER_ERROR: 500,
};

export const ERROR_MESSAGES = {
  UNAUTHORIZED: "You are not authorized to perform this action",
  NOT_FOUND: "Resource not found",
  INVALID_INPUT: "Invalid input provided",
  DATABASE_ERROR: "Database operation failed",
  AUTHENTICATION_FAILED: "Authentication failed",
  USER_NOT_FOUND: "User not found",
  EMAIL_EXISTS: "Email already exists",
  INVALID_CREDENTIALS: "Invalid email or password",
  TOKEN_EXPIRED: "Token expired",
  INVALID_TOKEN: "Invalid token",
};

export const SUCCESS_MESSAGES = {
  LOGIN_SUCCESS: "Login successful",
  REGISTRATION_SUCCESS: "User registered successfully",
  PROFILE_UPDATED: "Profile updated successfully",
  BOOKING_CREATED: "Booking created successfully",
  BOOKING_UPDATED: "Booking status updated successfully",
  NOTIFICATION_FETCHED: "Notifications fetched successfully",
};
