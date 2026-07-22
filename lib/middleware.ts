/**
 * API Middleware Functions
 * Authentication, authorization, and request validation
 */

import { NextRequest, NextResponse } from 'next/server';
import { verifyToken, extractTokenFromHeader, UserRole } from './auth';
import { errorResponse, HTTP_STATUS } from './api-response';
import { TokenPayload } from './auth';

/**
 * Extract and verify JWT token from request
 */
export function extractAuthToken(request: NextRequest): TokenPayload | null {
  const authHeader = request.headers.get('Authorization');
  const token = extractTokenFromHeader(authHeader);

  if (!token) {
    return null;
  }

  return verifyToken(token);
}

/**
 * Middleware to verify authentication
 */
export function requireAuth(handler: Function) {
  return async (request: NextRequest) => {
    const user = extractAuthToken(request);

    if (!user) {
      return NextResponse.json(
        errorResponse('UNAUTHORIZED', 'Authentication required'),
        { status: HTTP_STATUS.UNAUTHORIZED }
      );
    }

    // Store user in request context
    (request as any).user = user;
    return handler(request);
  };
}

/**
 * Middleware to verify specific roles
 */
export function requireRole(allowedRoles: UserRole[]) {
  return (handler: Function) => {
    return async (request: NextRequest) => {
      const user = extractAuthToken(request);

      if (!user) {
        return NextResponse.json(
          errorResponse('UNAUTHORIZED', 'Authentication required'),
          { status: HTTP_STATUS.UNAUTHORIZED }
        );
      }

      if (!allowedRoles.includes(user.role)) {
        return NextResponse.json(
          errorResponse('FORBIDDEN', 'Insufficient permissions'),
          { status: HTTP_STATUS.FORBIDDEN }
        );
      }

      // Store user in request context
      (request as any).user = user;
      return handler(request);
    };
  };
}

/**
 * Extract user from request (assumes auth middleware ran)
 */
export function getAuthUser(request: NextRequest): TokenPayload {
  return (request as any).user;
}

/**
 * Validate request method
 */
export function allowMethods(...methods: string[]) {
  return (handler: Function) => {
    return async (request: NextRequest) => {
      if (!methods.includes(request.method)) {
        return NextResponse.json(
          errorResponse('METHOD_NOT_ALLOWED', `Method ${request.method} not allowed`),
          { status: 405 }
        );
      }
      return handler(request);
    };
  };
}

/**
 * Rate limiting middleware (basic implementation)
 * In production, use external service like Redis
 */
const rateLimitStore = new Map<string, number[]>();

export function rateLimit(maxRequests: number, windowMs: number) {
  return (handler: Function) => {
    return async (request: NextRequest) => {
      const ip = request.headers.get('x-forwarded-for') || 'unknown';
      const now = Date.now();
      
      if (!rateLimitStore.has(ip)) {
        rateLimitStore.set(ip, [now]);
      } else {
        const timestamps = rateLimitStore.get(ip)!;
        const recentRequests = timestamps.filter((t) => now - t < windowMs);

        if (recentRequests.length >= maxRequests) {
          return NextResponse.json(
            errorResponse('RATE_LIMITED', 'Too many requests'),
            { status: 429 }
          );
        }

        recentRequests.push(now);
        rateLimitStore.set(ip, recentRequests);
      }

      return handler(request);
    };
  };
}

/**
 * CORS middleware
 */
export function withCORS(handler: Function) {
  return async (request: NextRequest) => {
    const response = await handler(request);

    if (request.method === 'OPTIONS') {
      return new NextResponse(null, {
        headers: {
          'Access-Control-Allow-Origin': process.env.NEXT_PUBLIC_APP_URL || '*',
          'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type, Authorization',
        },
      });
    }

    response.headers.set('Access-Control-Allow-Origin', process.env.NEXT_PUBLIC_APP_URL || '*');
    response.headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    response.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');

    return response;
  };
}

/**
 * Error handling middleware
 */
export function withErrorHandling(handler: Function) {
  return async (request: NextRequest) => {
    try {
      return await handler(request);
    } catch (error) {
      console.error('[API Error]', error);

      return NextResponse.json(
        errorResponse(
          'INTERNAL_ERROR',
          error instanceof Error ? error.message : 'Internal server error'
        ),
        { status: HTTP_STATUS.INTERNAL_SERVER_ERROR }
      );
    }
  };
}

/**
 * Compose multiple middlewares
 */
export function compose(...middlewares: Function[]) {
  return (handler: Function) => {
    return middlewares.reduceRight((acc, middleware) => middleware(acc), handler);
  };
}

export default {
  extractAuthToken,
  requireAuth,
  requireRole,
  getAuthUser,
  allowMethods,
  rateLimit,
  withCORS,
  withErrorHandling,
  compose,
};
