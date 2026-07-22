import { NextRequest, NextResponse } from 'next/server';
import { verifyToken } from '@/lib/auth';
import prisma from '@/lib/prisma';
import { QuestionSchema } from '@/lib/validators';

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const authHeader = request.headers.get('authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    const token = authHeader.slice(7);
    const decoded = verifyToken(token);

    if (!decoded || (decoded.role !== 'admin' && decoded.role !== 'super_admin')) {
      return NextResponse.json({ message: 'Only admins can delete questions' }, { status: 403 });
    }

    const resolvedParams = await params;
    const { id } = resolvedParams;

    await prisma.$transaction([
      prisma.testQuestion.deleteMany({ where: { question_id: id } }),
      prisma.testResponse.deleteMany({ where: { question_id: id } }),
      prisma.question.delete({ where: { id } })
    ]);

    return NextResponse.json({ message: 'Question deleted successfully' });
  } catch (error: any) {
    console.error('[Delete Question Error]', error);
    return NextResponse.json(
      { message: error.message || 'Failed to delete question' },
      { status: 500 }
    );
  }
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const authHeader = request.headers.get('authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    const token = authHeader.slice(7);
    const decoded = verifyToken(token);

    if (!decoded || (decoded.role !== 'admin' && decoded.role !== 'super_admin')) {
      return NextResponse.json({ message: 'Only admins can view questions' }, { status: 403 });
    }

    const resolvedParams = await params;
    const { id } = resolvedParams;

    const question = await prisma.question.findUnique({
      where: { id }
    });

    if (!question) {
      return NextResponse.json({ message: 'Question not found' }, { status: 404 });
    }

    return NextResponse.json({ question });
  } catch (error: any) {
    console.error('[Get Question Error]', error);
    return NextResponse.json(
      { message: error.message || 'Failed to retrieve question' },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const authHeader = request.headers.get('authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    const token = authHeader.slice(7);
    const decoded = verifyToken(token);

    if (!decoded || (decoded.role !== 'admin' && decoded.role !== 'super_admin')) {
      return NextResponse.json({ message: 'Only admins can edit questions' }, { status: 403 });
    }

    const resolvedParams = await params;
    const { id } = resolvedParams;

    const data = await request.json();
    const validatedData = QuestionSchema.parse(data);

    const question = await prisma.question.update({
      where: { id },
      data: {
        question_text: validatedData.questionText,
        type: validatedData.type,
        category: validatedData.category,
        branch_id: validatedData.branchId || null,
        options_json: validatedData.optionsJson || [],
        correct_answer: validatedData.correctAnswer,
        time_limit_seconds: validatedData.timeLimitSeconds,
        points: validatedData.points,
        explanation: validatedData.explanation,
        is_published: validatedData.isPublished,
      }
    });

    return NextResponse.json({ message: 'Question updated successfully', question });
  } catch (error: any) {
    console.error('[Update Question Error]', error);
    return NextResponse.json(
      { message: error.message || 'Failed to update question' },
      { status: 500 }
    );
  }
}

