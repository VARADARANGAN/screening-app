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

    if (!decoded || (decoded.role !== 'admin' && decoded.role !== 'super_admin')) {
      return NextResponse.json({ message: 'Only admins can publish tests' }, { status: 403 });
    }

    const body = await request.json();
    const { studentIds, questionIds, totalDuration } = body;

    if (!studentIds || !Array.isArray(studentIds) || studentIds.length === 0) {
      return NextResponse.json({ message: 'No students selected' }, { status: 400 });
    }

    if (!questionIds || !Array.isArray(questionIds) || questionIds.length === 0) {
      return NextResponse.json({ message: 'No questions selected for Round 2' }, { status: 400 });
    }

    if (!totalDuration || typeof totalDuration !== 'number' || totalDuration <= 0) {
      return NextResponse.json({ message: 'Invalid test duration' }, { status: 400 });
    }

    let publishedCount = 0;

    for (const studentId of studentIds) {
      // Shuffle the selected questions for each student to prevent cheating
      const shuffled = [...questionIds].sort(() => 0.5 - Math.random());

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
          data: shuffled.map((qId, index) => ({
            test_id: test.id,
            question_id: qId,
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
