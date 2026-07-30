import { NextRequest, NextResponse } from 'next/server';
import { verifyToken } from '@/lib/auth';
import prisma from '@/lib/prisma';

export async function PATCH(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    const token = authHeader.slice(7);
    const decoded = verifyToken(token);

    if (!decoded || (decoded.role !== 'admin' && decoded.role !== 'super_admin')) {
      return NextResponse.json({ message: 'Only admins can modify questions' }, { status: 403 });
    }

    const data = await request.json();
    const { ids, newType } = data;

    if (!Array.isArray(ids) || ids.length === 0) {
      return NextResponse.json({ message: 'No question IDs provided' }, { status: 400 });
    }

    if (!newType || typeof newType !== 'string') {
      return NextResponse.json({ message: 'Invalid question type provided' }, { status: 400 });
    }

    const updateResult = await prisma.question.updateMany({
      where: {
        id: {
          in: ids
        }
      },
      data: {
        type: newType
      }
    });

    return NextResponse.json(
      { message: `Successfully updated ${updateResult.count} questions`, count: updateResult.count },
      { status: 200 }
    );
  } catch (error: any) {
    console.error('[Bulk Update Question Type Error]', error);
    return NextResponse.json(
      { message: error.message || 'Failed to update question types' },
      { status: 400 }
    );
  }
}
