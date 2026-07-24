import { NextRequest, NextResponse } from 'next/server';
import { verifyToken } from '@/lib/auth';
import prisma from '@/lib/prisma';

/**
 * GET /api/admin/students
 * Get all students (Admin only)
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
      return NextResponse.json({ message: 'Only admins can view all students' }, { status: 403 });
    }

    const searchParams = request.nextUrl.searchParams;
    const limit = parseInt(searchParams.get('limit') || '10');
    const offset = parseInt(searchParams.get('offset') || '0');

    // Build Prisma query filters
    const whereClause: any = {};

    const students = await prisma.student.findMany({
      where: whereClause,
      include: {
        user: {
          select: { email: true }
        },
        tests: {
          select: { score: true, created_at: true },
          orderBy: { created_at: 'desc' }
        }
      },
      take: limit,
      skip: offset,
      orderBy: { created_at: 'desc' }
    });

    const formattedStudents = students.map(s => {
      const tests = s.tests || [];
      const test_count = tests.length;
      const validTests = tests.filter(t => t.score !== null);
      const avg_score = validTests.length > 0 ? Number(validTests[0].score) : 0;

      return {
        id: s.id,
        fullName: s.full_name,
        usn: s.usn,
        college: s.college,
        email: s.user?.email || '',
        test_count,
        avg_score
      };
    });

    return NextResponse.json({
      message: 'Students retrieved',
      students: formattedStudents,
    });
  } catch (error: any) {
    console.error('[Get Students Error]', error);
    return NextResponse.json(
      { message: error.message || 'Failed to retrieve students' },
      { status: 400 }
    );
  }
}
