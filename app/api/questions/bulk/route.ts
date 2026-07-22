import { NextRequest, NextResponse } from 'next/server';
import { verifyToken } from '@/lib/auth';
import { QuestionSchema } from '@/lib/validators';
import { z } from 'zod';
import prisma from '@/lib/prisma';

const BulkQuestionSchema = z.array(QuestionSchema).min(1, 'At least one question is required');

export async function POST(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    const token = authHeader.slice(7);
    const decoded = verifyToken(token);

    if (!decoded) {
      return NextResponse.json({ message: 'Invalid or expired token' }, { status: 401 });
    }

    if (!decoded || (decoded.role !== 'admin' && decoded.role !== 'super_admin')) {
      return NextResponse.json({ message: 'Only admins can create questions' }, { status: 403 });
    }

    const data = await request.json();
    
    const validation = BulkQuestionSchema.safeParse(data);
    if (!validation.success) {
      return NextResponse.json(
        { message: 'Validation failed', errors: validation.error.flatten() },
        { status: 400 }
      );
    }
    
    const validatedQuestions = validation.data;
    
    // Use Prisma createMany for bulk insert
    const result = await prisma.question.createMany({
      data: validatedQuestions.map(q => ({
        question_text: q.questionText,
        type: q.type,
        category: q.category,
        branch_id: q.branchId,
        options_json: q.optionsJson || [],
        correct_answer: q.correctAnswer,
        time_limit_seconds: q.timeLimitSeconds,
        points: q.points,
        explanation: q.explanation,
        is_published: q.isPublished || false, // default false
        created_by: decoded.userId,
      }))
    });

    return NextResponse.json(
      { message: `Successfully imported ${result.count} questions` },
      { status: 201 }
    );
  } catch (error: any) {
    console.error('[Bulk Create Question Error]', error);
    return NextResponse.json(
      { message: error.message || 'Failed to bulk import questions' },
      { status: 400 }
    );
  }
}
