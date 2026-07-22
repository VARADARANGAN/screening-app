import { NextRequest, NextResponse } from 'next/server';
import { verifyToken } from '@/lib/auth';
import prisma from '@/lib/prisma';
import { z } from 'zod';

const AssignTestSchema = z.object({
  questionIds: z.array(z.string()).min(1, 'Select at least one question'),
  branchIds: z.array(z.string()).optional(),
  branchId: z.string().optional(), // Fallback for backward compatibility
  totalDuration: z.number().optional(), // custom duration in minutes
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
      return NextResponse.json({ message: 'Only admins can assign tests' }, { status: 403 });
    }

    const data = await request.json();
    const validation = AssignTestSchema.safeParse(data);
    
    if (!validation.success) {
      return NextResponse.json(
        { message: 'Validation failed', errors: validation.error.flatten() },
        { status: 400 }
      );
    }

    const { questionIds, branchIds, branchId, totalDuration } = validation.data;

    // Fetch the questions to sum up the duration
    const questions = await prisma.question.findMany({
      where: { id: { in: questionIds } },
      select: { id: true, time_limit_seconds: true }
    });

    if (questions.length !== questionIds.length) {
      return NextResponse.json({ message: 'Some questions could not be found' }, { status: 400 });
    }

    const totalDurationMinutes = totalDuration ? totalDuration : Math.ceil(questions.reduce((acc, q) => acc + (q.time_limit_seconds || 60), 0) / 60);

    // Resolve target branches
    let targetBranchIds: string[] = [];
    if (branchIds && branchIds.length > 0) {
      targetBranchIds = branchIds.filter(id => id !== 'all');
    } else if (branchId && branchId !== 'all') {
      targetBranchIds = [branchId];
    }

    // Fetch target students
    const whereClause = targetBranchIds.length > 0 ? { branch_id: { in: targetBranchIds } } : {};
    const students = await prisma.student.findMany({
      where: whereClause,
      select: { id: true }
    });

    if (students.length === 0) {
      return NextResponse.json({ message: 'No students found for this branch' }, { status: 404 });
    }

    // Create a Test for each student, and then map TestQuestions
    let createdTestsCount = 0;

    await prisma.$transaction(async (tx) => {
      for (const student of students) {
        const test = await tx.test.create({
          data: {
            student_id: student.id,
            total_duration: totalDurationMinutes,
            status: 'not_started',
            is_completed: false,
          }
        });

        const testQuestionsData = questionIds.map((qId, index) => ({
          test_id: test.id,
          question_id: qId,
          sequence_number: index + 1,
        }));

        await tx.testQuestion.createMany({
          data: testQuestionsData
        });

        createdTestsCount++;
      }
    });

    // Update the questions to be published (sent)
    await prisma.question.updateMany({
      where: { id: { in: questionIds } },
      data: { is_published: true }
    });

    return NextResponse.json({ 
      message: `Successfully assigned test to ${createdTestsCount} students` 
    }, { status: 201 });

  } catch (error: any) {
    console.error('[Assign Test Error]', error);
    return NextResponse.json(
      { message: error.message || 'Failed to assign test' },
      { status: 500 }
    );
  }
}
