import { NextRequest, NextResponse } from 'next/server';
import { verifyToken } from '@/lib/auth';
import prisma from '@/lib/prisma';

/**
 * GET /api/admin/analytics
 * Get analytics data for admin dashboard
 */
export async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    const token = authHeader.slice(7);
    const decoded = verifyToken(token);

    if (!decoded || (decoded.role !== 'admin' && decoded.role !== 'super_admin')) {
      return NextResponse.json({ message: 'Only admins can access analytics' }, { status: 403 });
    }

    // Total students
    const studentCount = await prisma.student.count();

    // Total tests
    const testCount = await prisma.test.count();

    // Average score
    const avgScoreAgg = await prisma.test.aggregate({
      _avg: { score: true },
      where: { score: { not: null } }
    });
    const avgScore = avgScoreAgg._avg.score?.toNumber() || 0;

    // Tests by branch
    // Because Prisma's groupBy is limited with relations, we can fetch tests and include branch
    // Or just group by branch_id if we want.
    const branchGroups = await prisma.student.groupBy({
      by: ['branch_id'],
      _count: {
        _all: true,
      },
    });

    // To get names, fetch branches
    const branches = await prisma.branch.findMany();
    const branchMap = new Map(branches.map(b => [b.id, b.name]));

    const testsByBranch = branchGroups.map(g => ({
      branch: g.branch_id ? branchMap.get(g.branch_id) : 'Other',
      count: g._count._all,
    }));

    // Violations
    const violationCount = await prisma.violation.count();

    // Tests submitted today
    const startOfToday = new Date();
    startOfToday.setHours(0,0,0,0);
    const submittedToday = await prisma.test.count({
      where: {
        status: 'submitted',
        end_time: { gte: startOfToday }
      }
    });

    return NextResponse.json({
      message: 'Analytics retrieved',
      analytics: {
        totalStudents: studentCount,
        totalTests: testCount,
        averageScore: avgScore.toFixed(2),
        testsByBranch,
        questionsByDifficulty: [], // Deprecated
        totalViolations: violationCount,
        submittedToday,
      },
    });
  } catch (error: any) {
    console.error('[Analytics Error]', error);
    return NextResponse.json(
      { message: error.message || 'Failed to retrieve analytics' },
      { status: 400 }
    );
  }
}
