/**
 * POST /api/auth/login
 * User login endpoint
 */

import { NextRequest, NextResponse } from 'next/server';
import { LoginSchema } from '@/lib/validators';
import { comparePassword, generateToken, setAuthCookie } from '@/lib/auth';
import { queryOne } from '@/lib/db';
import {
  successResponse,
  errorResponse,
  validationErrorResponse,
  HTTP_STATUS,
  createResponse,
} from '@/lib/api-response';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // Validate input
    const validation = LoginSchema.safeParse(body);
    if (!validation.success) {
      const [response, status] = validationErrorResponse(
        'Validation failed',
        validation.error.flatten()
      );
      return createResponse(response, status);
    }

    const { email, password } = validation.data;

    // Find user by email
    const user = await queryOne(
      `SELECT id, email, password_hash, role, is_active
       FROM users
       WHERE email = $1`,
      [email.toLowerCase()]
    );

    if (!user || !user.is_active) {
      const [response, status] = [
        errorResponse('INVALID_CREDENTIALS', 'Invalid email or password'),
        HTTP_STATUS.UNAUTHORIZED,
      ];
      return createResponse(response, status);
    }

    // Compare password
    const isPasswordValid = await comparePassword(password, user.password_hash);

    if (!isPasswordValid) {
      const [response, status] = [
        errorResponse('INVALID_CREDENTIALS', 'Invalid email or password'),
        HTTP_STATUS.UNAUTHORIZED,
      ];
      return createResponse(response, status);
    }

    // Generate JWT token
    const token = generateToken({
      userId: user.id,
      email: user.email,
      role: user.role,
    });

    // Set auth cookie
    await setAuthCookie(token);

    return createResponse(
      successResponse(
        {
          user: {
            id: user.id,
            email: user.email,
            role: user.role,
          },
          token,
        },
        'Login successful'
      ),
      HTTP_STATUS.OK
    );
  } catch (error) {
    console.error('[Login Error]', error);
    const [response, status] = [
      errorResponse(
        'INTERNAL_ERROR',
        error instanceof Error ? error.message : 'Login failed'
      ),
      HTTP_STATUS.INTERNAL_SERVER_ERROR,
    ];
    return createResponse(response, status);
  }
}

export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    },
  });
}
