import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { verifyToken } from '@/lib/auth';

/**
 * POST /api/questions/bulk-delete
 * Delete multiple questions by ID, or delete all questions.
 */
export async function POST(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    const token = authHeader.slice(7);
    const decoded = verifyToken(token);

    if (!decoded || (decoded.role !== 'admin' && decoded.role !== 'super_admin')) {
      return NextResponse.json({ message: 'Only admins can perform bulk actions' }, { status: 403 });
    }

    const body = await request.json();
    
    if (body.deleteAll) {
      // Delete all questions
      const result = await prisma.question.deleteMany({});
      return NextResponse.json({
        message: 'All questions deleted successfully',
        count: result.count
      });
    }

    if (body.ids && Array.isArray(body.ids)) {
      // Delete selected questions
      const result = await prisma.question.deleteMany({
        where: {
          id: {
            in: body.ids
          }
        }
      });
      return NextResponse.json({
        message: `${result.count} questions deleted successfully`,
        count: result.count
      });
    }

    return NextResponse.json({ message: 'Invalid request body' }, { status: 400 });

  } catch (error: any) {
    console.error('[Bulk Delete Error]', error);
    return NextResponse.json(
      { message: error.message || 'Failed to delete questions' },
      { status: 500 }
    );
  }
}
