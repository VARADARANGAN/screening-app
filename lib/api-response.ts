/**
 * API Response Utilities
 * Standardized response format for all API endpoints
 */

export interface ApiSuccessResponse<T = any> {
  success: true;
  data: T;
  message?: string;
}

export interface ApiErrorResponse {
  success: false;
  error: {
    code: string;
    message: string;
    details?: any;
  };
}

export type ApiResponse<T = any> = ApiSuccessResponse<T> | ApiErrorResponse;

/**
 * Success response factory
 */
export function successResponse<T = any>(
  data: T,
  message?: string
): ApiSuccessResponse<T> {
  return {
    success: true,
    data,
    message,
  };
}

/**
 * Error response factory
 */
export function errorResponse(
  code: string,
  message: string,
  details?: any
): ApiErrorResponse {
  return {
    success: false,
    error: {
      code,
      message,
      details,
    },
  };
}

/**
 * HTTP status codes
 */
export const HTTP_STATUS = {
  OK: 200,
  CREATED: 201,
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  CONFLICT: 409,
  UNPROCESSABLE_ENTITY: 422,
  INTERNAL_SERVER_ERROR: 500,
  SERVICE_UNAVAILABLE: 503,
} as const;

/**
 * Error codes
 */
export const ERROR_CODES = {
  VALIDATION_ERROR: 'VALIDATION_ERROR',
  UNAUTHORIZED: 'UNAUTHORIZED',
  FORBIDDEN: 'FORBIDDEN',
  NOT_FOUND: 'NOT_FOUND',
  CONFLICT: 'CONFLICT',
  INTERNAL_ERROR: 'INTERNAL_ERROR',
  INVALID_TOKEN: 'INVALID_TOKEN',
  EXPIRED_TOKEN: 'EXPIRED_TOKEN',
  DATABASE_ERROR: 'DATABASE_ERROR',
  FILE_UPLOAD_ERROR: 'FILE_UPLOAD_ERROR',
  INVALID_CREDENTIALS: 'INVALID_CREDENTIALS',
  USER_EXISTS: 'USER_EXISTS',
  USER_NOT_FOUND: 'USER_NOT_FOUND',
} as const;

/**
 * Create JSON response for API routes
 */
export function createResponse<T = any>(
  response: ApiResponse<T>,
  status: number = HTTP_STATUS.OK
): Response {
  return Response.json(response, { status });
}

/**
 * Validation error response
 */
export function validationErrorResponse(
  message: string,
  details?: any
): [ApiErrorResponse, number] {
  return [
    errorResponse(ERROR_CODES.VALIDATION_ERROR, message, details),
    HTTP_STATUS.BAD_REQUEST,
  ];
}

/**
 * Unauthorized error response
 */
export function unauthorizedResponse(message: string = 'Unauthorized access'): [ApiErrorResponse, number] {
  return [
    errorResponse(ERROR_CODES.UNAUTHORIZED, message),
    HTTP_STATUS.UNAUTHORIZED,
  ];
}

/**
 * Forbidden error response
 */
export function forbiddenResponse(message: string = 'Access forbidden'): [ApiErrorResponse, number] {
  return [
    errorResponse(ERROR_CODES.FORBIDDEN, message),
    HTTP_STATUS.FORBIDDEN,
  ];
}

/**
 * Not found error response
 */
export function notFoundResponse(message: string = 'Resource not found'): [ApiErrorResponse, number] {
  return [
    errorResponse(ERROR_CODES.NOT_FOUND, message),
    HTTP_STATUS.NOT_FOUND,
  ];
}

/**
 * Conflict error response
 */
export function conflictResponse(message: string = 'Resource already exists'): [ApiErrorResponse, number] {
  return [
    errorResponse(ERROR_CODES.CONFLICT, message),
    HTTP_STATUS.CONFLICT,
  ];
}

/**
 * Internal server error response
 */
export function internalErrorResponse(
  message: string = 'Internal server error',
  details?: any
): [ApiErrorResponse, number] {
  return [
    errorResponse(ERROR_CODES.INTERNAL_ERROR, message, details),
    HTTP_STATUS.INTERNAL_SERVER_ERROR,
  ];
}

/**
 * Database error response
 */
export function databaseErrorResponse(message: string = 'Database error'): [ApiErrorResponse, number] {
  return [
    errorResponse(ERROR_CODES.DATABASE_ERROR, message),
    HTTP_STATUS.INTERNAL_SERVER_ERROR,
  ];
}

/**
 * File upload error response
 */
export function fileUploadErrorResponse(message: string = 'File upload failed'): [ApiErrorResponse, number] {
  return [
    errorResponse(ERROR_CODES.FILE_UPLOAD_ERROR, message),
    HTTP_STATUS.BAD_REQUEST,
  ];
}

export default {
  successResponse,
  errorResponse,
  createResponse,
  validationErrorResponse,
  unauthorizedResponse,
  forbiddenResponse,
  notFoundResponse,
  conflictResponse,
  internalErrorResponse,
  databaseErrorResponse,
  fileUploadErrorResponse,
  HTTP_STATUS,
  ERROR_CODES,
};
