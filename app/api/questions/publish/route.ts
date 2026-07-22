import { NextRequest, NextResponse } from 'next/server';
import { verifyToken } from '@/lib/auth';
import prisma from '@/lib/prisma';
import { z } from 'zod';

const PublishSchema = z.object({
  questionIds: z.array(z.string().uuid()),
  isPublished: z.boolean().default(true),
});

export async function POST(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    const token = authHeader.slice(7);
    const decoded = verifyToken(token);

    if (!decoded || (decoded.role !== 'admin' && decoded.role !== 'super_admin')) {
      return NextResponse.json({ message: 'Only admins can publish questions' }, { status: 403 });
    }

    const body = await request.json();
    const validatedData = PublishSchema.parse(body);

    const result = await prisma.question.updateMany({
      where: {
        id: { in: validatedData.questionIds }
      },
      data: {
        is_published: validatedData.isPublished
      }
    });

    return NextResponse.json({ 
      message: `Successfully updated publish status for ${result.count} questions` 
    });
  } catch (error: any) {
    console.error('[Publish Questions Error]', error);
    return NextResponse.json(
      { message: error.message || 'Failed to publish questions' },
      { status: 500 }
    );
  }
}
