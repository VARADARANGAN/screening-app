import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { verifyToken } from '@/lib/auth';

export async function GET(req: NextRequest) {
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

    const tests = await prisma.test.findMany({
      include: {
        student: true,
        analytics: true,
        ai_evaluation: true,
      },
      orderBy: {
        created_at: 'desc',
      },
    });

    const results = tests.map(test => {
      const aiReport = test.ai_evaluation?.aggregated_report as any;
      return {
        id: test.id,
        studentName: test.student?.full_name || 'Unknown Student',
        status: test.status,
        aptitudeScore: test.analytics?.total_score ? Number(test.analytics.total_score) : null,
        codingScore: aiReport?.technicalScore || null,
        behaviourScore: aiReport?.behaviourScore || null,
        learningScore: aiReport?.learningScore || null,
        aiLiteracyScore: aiReport?.aiLiteracyScore || null,
        overallScore: aiReport?.overallScore || (test.score ? Number(test.score) : null),
        recommendation: aiReport?.recommendation || 'Pending',
      };
    });

    const attemptedCount = tests.length;
    const completedCount = tests.filter(t => t.status === 'submitted' || t.status === 'evaluated' || t.is_completed).length;

    const validScores = (key: keyof typeof results[0]) => 
      results.map(r => r[key]).filter((v): v is number => typeof v === 'number' && !isNaN(v as number));
    
    const avg = (arr: number[]) => arr.length ? (arr.reduce((a,b) => a+b, 0) / arr.length).toFixed(1) : 'N/A';

    const averages = {
      aptitude: avg(validScores('aptitudeScore')),
      coding: avg(validScores('codingScore')),
      behaviour: avg(validScores('behaviourScore')),
      learning: avg(validScores('learningScore')),
      aiLiteracy: avg(validScores('aiLiteracyScore')),
      overall: avg(validScores('overallScore')),
    };

    return NextResponse.json({
      success: true,
      results,
      summary: {
        attempted: attemptedCount,
        completed: completedCount,
        averages
      }
    });
  } catch (error: any) {
    console.error('Fetch Admin Results Error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch results', details: error.message },
      { status: 500 }
    );
  }
}
