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

    if (!decoded || decoded.role !== 'student') {
      return NextResponse.json({ message: 'Only students can access this endpoint' }, { status: 403 });
    }

    const student = await prisma.student.findUnique({
      where: { user_id: decoded.userId }
    });

    if (!student || !student.profile_completed) {
      return NextResponse.json({ message: 'Profile not completed' }, { status: 400 });
    }

    // Check if a test already exists for this student
    const existingTest = await prisma.test.findFirst({
      where: { student_id: student.id },
      orderBy: { created_at: 'desc' }
    });

    if (existingTest) {
      return NextResponse.json({ testId: existingTest.id });
    }

    // Otherwise, generate the master test
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

    // 3. Shuffle and limit
    const shuffled = allQuestions.sort(() => 0.5 - Math.random());
    const selectedQuestions = shuffled.slice(0, totalQuestions);

    if (selectedQuestions.length === 0) {
      return NextResponse.json({ message: 'No questions available in the question bank' }, { status: 400 });
    }

    // 4. Create the Test
    const newTest = await prisma.$transaction(async (tx) => {
      const test = await tx.test.create({
        data: {
          student_id: student.id,
          total_duration: totalDuration,
          status: 'not_started',
        }
      });

      // Link questions
      await tx.testQuestion.createMany({
        data: selectedQuestions.map((q, index) => ({
          test_id: test.id,
          question_id: q.id,
          order_num: index + 1
        }))
      });

      return test;
    });

    return NextResponse.json({ testId: newTest.id });
  } catch (error: any) {
    console.error('[Generate Active Test Error]', error);
    return NextResponse.json({ message: 'Failed to generate test' }, { status: 500 });
  }
}
