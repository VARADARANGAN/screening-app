import { NextRequest, NextResponse } from 'next/server';
import { verifyToken } from '@/lib/auth';
import prisma from '@/lib/prisma';

export async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    const token = authHeader.slice(7);
    const decoded = verifyToken(token);

    if (!decoded || (decoded.role !== 'admin' && decoded.role !== 'super_admin')) {
      return NextResponse.json({ message: 'Forbidden' }, { status: 403 });
    }

    // Fetch distinct sections from questions
    const questions = await prisma.question.findMany({
      select: {
        section: true,
      },
      distinct: ['section'],
    });

    const sections = questions
      .map(q => q.section)
      .filter(Boolean)
      .sort();

    return NextResponse.json({ sections });
  } catch (error: any) {
    console.error('[Get Sections Error]', error);
    return NextResponse.json(
      { message: error.message || 'Failed to get sections' },
      { status: 500 }
    );
  }
}
