import { NextRequest, NextResponse } from 'next/server';
import { verifyToken } from '@/lib/auth';
import prisma from '@/lib/prisma';
import { z } from 'zod';
const SECTION_ORDER = [
  'Eligibility',
  'Aptitude',
  'Coding',
  'Attitude & Ownership',
  'Learning Aptitude',
  'Problem Solving',
  'Execution & Reliability',
  'Communication & Teamwork',
  'Integrity',
  'AI Literacy'
];

function sortAndShuffleQuestions(questions: any[]) {
  const grouped: Record<string, any[]> = {};
  questions.forEach(q => {
    const s = q.section || 'General';
    if (!grouped[s]) grouped[s] = [];
    grouped[s].push(q);
  });

  Object.keys(grouped).forEach(s => {
    grouped[s].sort(() => 0.5 - Math.random());
  });

  const normalize = (name: string) => name.toLowerCase().replace(/[^a-z0-9]/g, '');
  
  const finalQuestions: any[] = [];
  
  SECTION_ORDER.forEach(orderedSection => {
    const matchingKey = Object.keys(grouped).find(k => normalize(k) === normalize(orderedSection));
    if (matchingKey) {
      finalQuestions.push(...grouped[matchingKey]);
      delete grouped[matchingKey];
    }
  });

  Object.keys(grouped).forEach(remainingSection => {
    finalQuestions.push(...grouped[remainingSection]);
  });

  return finalQuestions;
}

const AssignTestSchema = z.object({
  questionIds: z.array(z.string()).min(1, 'Select at least one question'),
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
      const errorStr = validation.error.issues.map((e: any) => e.message).join('\n');
      return NextResponse.json(
        { message: errorStr || 'Validation failed', errors: validation.error.flatten() },
        { status: 400 }
      );
    }

    const { questionIds, totalDuration } = validation.data;

    // Fetch the questions to sum up the duration and shuffle them
    const questions = await prisma.question.findMany({
      where: { id: { in: questionIds } },
      select: { id: true, time_limit_seconds: true, section: true }
    });

    if (questions.length !== questionIds.length) {
      return NextResponse.json({ message: 'Some questions could not be found' }, { status: 400 });
    }

    const totalDurationMinutes = totalDuration ? totalDuration : Math.ceil(questions.reduce((acc, q) => acc + (q.time_limit_seconds || 60), 0) / 60);

    // Fetch target students
    const students = await prisma.student.findMany({
      select: { id: true }
    });

    if (students.length === 0) {
      return NextResponse.json({ message: 'No students found' }, { status: 404 });
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

        const shuffled = sortAndShuffleQuestions(questions);

        const testQuestionsData = shuffled.map((q, index) => ({
          test_id: test.id,
          question_id: q.id,
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
