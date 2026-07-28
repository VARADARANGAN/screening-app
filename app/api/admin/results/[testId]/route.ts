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
      .filter(r => r.question.type === 'coding' && r.points_earned)
      .reduce((sum, r) => sum + Number(r.points_earned), 0);

    const scores = {
      aptitudeScore: test.analytics?.total_score ? Number(test.analytics.total_score) : null,
      codingScore: codingScore,
      overallScore: test.score ? Number(test.score) : null,
    };

    return NextResponse.json({
      success: true,
      data: {
        id: test.id,
        studentName: test.student?.full_name || 'Unknown Student',
        status: test.status,
        startTime: test.start_time,
        endTime: test.end_time,
        totalDuration: test.total_duration,
        timeTaken: test.analytics?.time_taken,
        scores
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
