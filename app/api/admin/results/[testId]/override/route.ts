import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { verifyToken } from '@/lib/auth';
import { recalculateTestScore } from '@/lib/services/score-calculation';

export async function POST(
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
    const body = await req.json();
    const { questionId, newScore, comment, feedback } = body;

    if (!questionId || newScore === undefined) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const existingResponse = await prisma.testResponse.findFirst({
      where: { test_id: testId, question_id: questionId }
    });

    if (!existingResponse) {
      return NextResponse.json({ error: 'Response not found' }, { status: 404 });
    }

    // Update TestResponse
    await prisma.testResponse.update({
      where: { id: existingResponse.id },
      data: {
        points_earned: Number(newScore),
      }
    });

    // Attempt to update AIEvaluation if it exists
    try {
      const aiEval = await prisma.aIEvaluation.findUnique({
        where: { test_response_id: existingResponse.id }
      });
      
      if (aiEval) {
        await prisma.aIEvaluation.update({
          where: { test_response_id: existingResponse.id },
          data: {
            obtained_marks: Number(newScore),
            feedback: feedback !== undefined ? feedback : (comment ? `[MANUAL OVERRIDE] ${comment}\n\n${aiEval.feedback || ''}` : undefined)
          }
        });
      }
    } catch (e) {
      // Ignore if AIEvaluation doesn't exist or fails
    }

    await recalculateTestScore(testId);

    return NextResponse.json({ success: true, message: 'Score updated successfully' });

  } catch (error: any) {
    console.error('Manual Override Error:', error);
    return NextResponse.json(
      { error: 'Failed to update score', details: error.message },
      { status: 500 }
    );
  }
}
