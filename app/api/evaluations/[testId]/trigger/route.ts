import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifyAuth } from '@/lib/auth';
import { evaluateCandidate } from '@/lib/ai/evaluator';

export async function POST(
  req: NextRequest,
  { params }: { params: { testId: string } }
) {
  try {
    const authResult = await verifyAuth(req);
    if (!authResult.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const testId = params.testId;
    const test = await prisma.test.findUnique({
      where: { id: testId },
    });

    if (!test) {
      return NextResponse.json({ error: 'Test not found' }, { status: 404 });
    }

    // Fire and forget evaluation process so the request doesn't hang
    evaluateCandidate(testId).catch(err => console.error("Async evaluation error:", err));

    return NextResponse.json({ 
      success: true, 
      message: 'Evaluation triggered successfully' 
    });
  } catch (error: any) {
    console.error('Trigger Evaluation Error:', error);
    return NextResponse.json(
      { error: 'Failed to trigger evaluation', details: error.message },
      { status: 500 }
    );
  }
}
