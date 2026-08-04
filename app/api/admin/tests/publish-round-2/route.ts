import { NextRequest, NextResponse } from 'next/server';
import { verifyToken } from '@/lib/auth';
import prisma from '@/lib/prisma';

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

    // Fetch question details for sections
    const questions = await prisma.question.findMany({
      where: { id: { in: questionIds } },
      select: { id: true, section: true }
    });

    for (const studentId of studentIds) {
      // Shuffle the selected questions by section order for each student
      const shuffled = sortAndShuffleQuestions(questions);

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
          data: shuffled.map((q, index) => ({
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
