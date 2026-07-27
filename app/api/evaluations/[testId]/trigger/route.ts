import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { verifyToken } from '@/lib/auth';
import { evaluateCandidate } from '@/lib/ai/evaluator';

export async function POST(
  req: NextRequest,
  { params }: { params: { testId: string } }
) {
  try {
    const authHeader = req.headers.get('authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }
    const token = authHeader.slice(7);
    const decoded = verifyToken(token);

    if (!decoded || (decoded.role !== 'admin' && decoded.role !== 'super_admin' && decoded.role !== 'recruiter')) {
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
