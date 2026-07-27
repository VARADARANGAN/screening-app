import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { verifyToken } from '@/lib/auth';

export async function GET(
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
