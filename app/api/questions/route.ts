import { NextRequest, NextResponse } from 'next/server';
import { verifyToken } from '@/lib/auth';
import { QuestionSchema } from '@/lib/validators';
import prisma from '@/lib/prisma';

/**
 * GET /api/questions
 * Get questions (with filters)
 */
export async function GET(request: NextRequest) {
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

    const searchParams = request.nextUrl.searchParams;
    const branchId = searchParams.get('branchId');
    const isPublished = searchParams.get('isPublished');
    const limit = parseInt(searchParams.get('limit') || '10');
    const offset = parseInt(searchParams.get('offset') || '0');

    // Build Prisma where clause
    const whereClause: any = {};
    if (branchId) whereClause.branch_id = branchId;
    
    // If student, force isPublished to true
    if (decoded.role === 'student') {
      whereClause.is_published = true;
    } else if (isPublished !== null) {
      whereClause.is_published = isPublished === 'true';
    }

    const questions = await prisma.question.findMany({
      where: whereClause,
      include: {
        branch: true
      },
      take: limit,
      skip: offset,
      orderBy: { created_at: 'desc' }
    });

    return NextResponse.json({
      message: 'Questions retrieved',
      questions,
    });
  } catch (error: any) {
    console.error('[Get Questions Error]', error);
    return NextResponse.json(
      { message: error.message || 'Failed to retrieve questions' },
      { status: 400 }
    );
  }
}

/**
 * POST /api/questions
 * Create a new question (Admin only)
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
      return NextResponse.json({ message: 'Only admins can create questions' }, { status: 403 });
    }

    const data = await request.json();
    const validatedData = QuestionSchema.parse(data);

    const question = await prisma.question.create({
      data: {
        question_text: validatedData.questionText,
        type: validatedData.type,
        category: validatedData.category,
        branch_id: validatedData.branchId,
        options_json: validatedData.optionsJson || [],
        correct_answer: validatedData.correctAnswer,
        time_limit_seconds: validatedData.timeLimitSeconds,
        points: validatedData.points,
        explanation: validatedData.explanation,
        is_published: validatedData.isPublished,
        created_by: decoded.userId,
      }
    });

    return NextResponse.json(
      { message: 'Question created', question },
      { status: 201 }
    );
  } catch (error: any) {
    console.error('[Create Question Error]', error);
    return NextResponse.json(
      { message: error.message || 'Failed to create question' },
      { status: 400 }
    );
  }
}
