/**
 * GET /api/health
 * Health check endpoint for monitoring
 */

import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function GET() {
  try {
    let isHealthy = false;
    try {
      await prisma.$queryRaw`SELECT 1`;
      isHealthy = true;
    } catch (e) {
      isHealthy = false;
    }

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
