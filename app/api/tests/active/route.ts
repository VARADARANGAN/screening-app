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
  // Group by section
  const grouped: Record<string, any[]> = {};
  questions.forEach(q => {
    const s = q.section || 'General';
    if (!grouped[s]) grouped[s] = [];
    grouped[s].push(q);
  });

  // Shuffle within each section
  Object.keys(grouped).forEach(s => {
    grouped[s].sort(() => 0.5 - Math.random());
  });

  // Normalize section names for sorting
  const normalize = (name: string) => name.toLowerCase().replace(/[^a-z0-9]/g, '');
  const normalizedOrder = SECTION_ORDER.map(normalize);

  // Flatten based on exact section order
  const finalQuestions: any[] = [];
  
  // First add sections that exist in the predefined order
  SECTION_ORDER.forEach(orderedSection => {
    // Find matching key in grouped
    const matchingKey = Object.keys(grouped).find(k => normalize(k) === normalize(orderedSection));
    if (matchingKey) {
      finalQuestions.push(...grouped[matchingKey]);
      delete grouped[matchingKey];
    }
  });

  // Add any remaining sections that weren't in the predefined list
  Object.keys(grouped).forEach(remainingSection => {
    finalQuestions.push(...grouped[remainingSection]);
  });

  return finalQuestions;
}

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

    // 3. Shuffle inside sections and enforce section order, then limit
    const orderedAndShuffled = sortAndShuffleQuestions(allQuestions);
    const selectedQuestions = orderedAndShuffled.slice(0, totalQuestions);


    if (selectedQuestions.length === 0) {
      return NextResponse.json({ message: 'No questions available in the question bank. Contact admin.' }, { status: 400 });
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
          sequence_number: index + 1
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
