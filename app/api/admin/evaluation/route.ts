import { NextRequest, NextResponse } from 'next/server';
import { verifyToken } from '@/lib/auth';
import prisma from '@/lib/prisma';

export async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    const token = authHeader.slice(7);
    const decoded = verifyToken(token);

    if (!decoded || (decoded.role !== 'admin' && decoded.role !== 'super_admin')) {
      return NextResponse.json({ message: 'Only admins can view evaluations' }, { status: 403 });
    }

    // Load all tests
    const tests = await prisma.test.findMany({
      include: {
        student: {
          include: {
            user: { select: { email: true } }
          }
        },
        _count: {
          select: { test_questions: true }
        }
      },
      orderBy: { created_at: 'desc' }
    });

    const submittedTests = tests.filter(t => t.status === 'submitted' || t.status === 'evaluated');

    // Overall stats
    const totalSubmitted = submittedTests.length;
    const avgScore = totalSubmitted > 0
      ? submittedTests.reduce((sum, t) => sum + (t.score !== null ? Number(t.score) : 0), 0) / totalSubmitted
      : 0;

    // Leaderboard/Rankings (sorted by score desc)
    const rankings = [...submittedTests]
      .filter(t => t.score !== null)
      .sort((a, b) => Number(b.score) - Number(a.score))
      .map((t, idx) => ({
        rank: idx + 1,
        testId: t.id,
        fullName: t.student.full_name,
        usn: t.student.usn,
        score: t.score !== null ? Number(t.score) : 0,
        violations: t.violations_count || 0,
        submittedAt: t.end_time || t.updated_at
      }));

    const branchStats: any[] = [];

    return NextResponse.json({
      message: 'Evaluations retrieved',
      tests: tests.map(t => ({
        id: t.id,
        fullName: t.student.full_name,
        usn: t.student.usn,
        email: t.student.user?.email || '',
        status: t.status,
        score: t.score !== null ? Number(t.score) : null,
        totalQuestions: t._count?.test_questions || 0,
        violations: t.violations_count || 0,
        createdAt: t.created_at,
        submittedAt: t.end_time || t.updated_at,
        results_published: t.results_published
      })),
      rankings,
      branchStats,
      stats: {
        totalSubmitted,
        avgScore: Math.round(avgScore),
        totalTests: tests.length,
      }
    });
  } catch (error: any) {
    console.error('[Get Evaluation Error]', error);
    return NextResponse.json(
      { message: error.message || 'Failed to retrieve evaluations' },
      { status: 500 }
    );
  }
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
      return NextResponse.json({ message: 'Only admins can publish results' }, { status: 403 });
    }

    const data = await request.json();
    const { testIds, branchId, publishAll, publish = true } = data;

    let whereClause: any = {};

    if (publishAll) {
      whereClause = {
        status: { in: ['submitted', 'evaluated'] }
      };
    } else if (testIds && testIds.length > 0) {
      whereClause = {
        id: { in: testIds }
      };
    } else {
      return NextResponse.json({ message: 'No target specified for publishing' }, { status: 400 });
    }

    await prisma.test.updateMany({
      where: whereClause,
      data: {
        results_published: publish
      }
    });

    return NextResponse.json({
      message: `Results ${publish ? 'published' : 'unpublished'} successfully`
    });
  } catch (error: any) {
    console.error('[Publish Results Error]', error);
    return NextResponse.json(
      { message: error.message || 'Failed to publish results' },
      { status: 500 }
    );
  }
}
