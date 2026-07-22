/**
 * GET /api/health
 * Health check endpoint for monitoring
 */

import { NextResponse } from 'next/server';
import { healthCheck } from '@/lib/db';

export async function GET() {
  try {
    const isHealthy = await healthCheck();

    if (isHealthy) {
      return NextResponse.json(
        {
          status: 'ok',
          timestamp: new Date().toISOString(),
          database: 'connected',
        },
        { status: 200 }
      );
    } else {
      return NextResponse.json(
        {
          status: 'error',
          timestamp: new Date().toISOString(),
          database: 'disconnected',
        },
        { status: 503 }
      );
    }
  } catch (error) {
    return NextResponse.json(
      {
        status: 'error',
        timestamp: new Date().toISOString(),
        database: 'error',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 503 }
    );
  }
}
