import { NextRequest, NextResponse } from 'next/server';
import { verifyToken } from '@/lib/auth';
import prisma from '@/lib/prisma';

export async function POST(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    const token = authHeader.slice(7);
    const decoded = verifyToken(token);

    if (!decoded || decoded.role !== 'admin') {
      return NextResponse.json({ message: 'Only admins can publish tests' }, { status: 403 });
    }

    const body = await request.json();
    const { studentIds } = body;

    if (!studentIds || !Array.isArray(studentIds) || studentIds.length === 0) {
      return NextResponse.json({ message: 'No students selected' }, { status: 400 });
    }

    // 1. Get Master Config
    let config = await prisma.testTemplate.findFirst({
      where: { name: 'MASTER_TEST_CONFIG' }
    });

    const totalDuration = config?.total_duration || 60;
    const totalQuestions = config?.total_questions || 30;

    // 2. Fetch active questions
    const allQuestions = await prisma.question.findMany({
      where: { is_published: true },
    });

    if (allQuestions.length === 0) {
      return NextResponse.json({ message: 'No active questions available in the question bank' }, { status: 400 });
    }

    let publishedCount = 0;

    for (const studentId of studentIds) {
      // Create a fresh test for each student
      // Shuffle for each student to prevent cheating
      const shuffled = [...allQuestions].sort(() => 0.5 - Math.random());
      const selectedQuestions = shuffled.slice(0, totalQuestions);

      await prisma.$transaction(async (tx) => {
        const test = await tx.test.create({
          data: {
            student_id: studentId,
            total_duration: totalDuration,
            status: 'not_started',
          }
        });

        // Link questions
        await tx.testQuestion.createMany({
          data: selectedQuestions.map((q, index) => ({
            test_id: test.id,
            question_id: q.id,
            sequence_number: index + 1
          }))
        });
      });
      
      publishedCount++;
    }

    return NextResponse.json({ 
      message: `Round 2 tests successfully published for ${publishedCount} students` 
    });

  } catch (error: any) {
    console.error('[Publish Round 2 Error]', error);
    return NextResponse.json({ message: 'Failed to publish Round 2 tests' }, { status: 500 });
  }
}
