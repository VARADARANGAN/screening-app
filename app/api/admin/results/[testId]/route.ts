import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { verifyToken } from '@/lib/auth';

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ testId: string }> }
) {
  try {
    const authHeader = req.headers.get('authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }
    const token = authHeader.slice(7);
    const decoded = verifyToken(token);

    if (!decoded || (decoded.role !== 'admin' && decoded.role !== 'recruiter' && decoded.role !== 'super_admin')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { testId } = await params;

    const test = await prisma.test.findUnique({
      where: { id: testId },
      include: {
        student: true,
        analytics: true,
        test_responses: {
          include: {
            question: true
          }
        }
      }
    });

    if (!test) {
      return NextResponse.json({ error: 'Test not found' }, { status: 404 });
    }

    const codingScore = test.test_responses
      .filter(r => r.question.type === 'coding' && r.points_earned !== null)
      .reduce((sum, r) => sum + Number(r.points_earned), 0);

    const aptitudeScore = test.test_responses
      .filter(r => r.question.type === 'mcq' && r.points_earned !== null)
      .reduce((sum, r) => sum + Number(r.points_earned), 0);

    const scores = {
      aptitudeScore: aptitudeScore,
      codingScore: codingScore,
      overallScore: test.score ? Number(test.score) : (aptitudeScore + codingScore),
    };

    // Extract submitted coding answers for the report
    const codingAnswers = test.test_responses
      .filter(r => r.question.type === 'coding')
      .map(r => ({
        question: r.question.question_text,
        studentAnswer: r.student_answer,
        pointsEarned: r.points_earned,
        maxPoints: r.question.points,
        aiEvaluation: r.ai_evaluation_json
      }));

    // Extract structured answers
    const structuredAnswers = test.test_responses
      .filter(r => r.question.type === 'structured_response')
      .map(r => ({
        question: r.question.question_text,
        studentAnswer: r.student_answer,
        fields: (r.question.options_json as any)?.fields || [],
        pointsEarned: r.points_earned,
        maxPoints: r.question.points,
      }));

    // Extract structured plan answers
    const structuredPlanAnswers = test.test_responses
      .filter(r => r.question.type === 'structured_plan')
      .map(r => ({
        question: r.question.question_text,
        studentAnswer: r.student_answer,
        labels: (r.question.options_json as any)?.labels || [],
        mode: (r.question.options_json as any)?.mode || 'day',
        pointsEarned: r.points_earned,
        maxPoints: r.question.points,
      }));

    return NextResponse.json({
      success: true,
      data: {
        id: test.id,
        studentName: test.student?.full_name || 'Unknown Student',
        status: test.status,
        startTime: test.start_time,
        endTime: test.end_time,
        submissionTime: test.end_time,
        totalDuration: test.total_duration,
        timeTaken: test.start_time && test.end_time ? Math.round((new Date(test.end_time).getTime() - new Date(test.start_time).getTime()) / 60000) : (test.analytics?.time_taken || null),
        scores,
        codingAnswers,
        structuredAnswers,
        structuredPlanAnswers
      }
    });

  } catch (error: any) {
    console.error('Fetch Admin Result Details Error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch result details', details: error.message },
      { status: 500 }
    );
  }
}
