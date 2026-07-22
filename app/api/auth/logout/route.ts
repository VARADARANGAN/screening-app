/**
 * POST /api/auth/logout
 * User logout endpoint
 */

import { NextRequest, NextResponse } from 'next/server';
import { clearAuthCookie } from '@/lib/auth';
import { successResponse, createResponse, HTTP_STATUS } from '@/lib/api-response';

export async function POST(request: NextRequest) {
  try {
    // Clear authentication cookie
    await clearAuthCookie();

    return createResponse(
      successResponse({}, 'Logged out successfully'),
      HTTP_STATUS.OK
    );
  } catch (error) {
    console.error('[Logout Error]', error);
    return createResponse(
      {
        success: false,
        error: {
          code: 'LOGOUT_ERROR',
          message: 'Logout failed',
        },
      },
      HTTP_STATUS.INTERNAL_SERVER_ERROR
    );
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
