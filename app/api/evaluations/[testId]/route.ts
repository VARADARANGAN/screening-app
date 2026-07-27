import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifyAuth } from '@/lib/auth';

export async function GET(
  req: NextRequest,
  { params }: { params: { testId: string } }
) {
  try {
    const authResult = await verifyAuth(req);
    // Only admins or recruiters should be able to view AI evaluations
    if (!authResult.user || (authResult.user.role !== 'admin' && authResult.user.role !== 'recruiter')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const evaluation = await prisma.aIEvaluation.findUnique({
      where: { test_id: params.testId }
    });

    if (!evaluation) {
      return NextResponse.json({ status: 'NOT_FOUND' });
    }

    return NextResponse.json(evaluation);
  } catch (error: any) {
    console.error('Fetch Evaluation Error:', error);
    return NextResponse.json({ error: 'Failed to fetch evaluation' }, { status: 500 });
  }
}
