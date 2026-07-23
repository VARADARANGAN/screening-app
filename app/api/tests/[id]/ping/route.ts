import { NextRequest, NextResponse } from 'next/server';
import { verifyToken } from '@/lib/auth';
import prisma from '@/lib/prisma';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const resolvedParams = await params;
    const { id } = resolvedParams;
    const authHeader = request.headers.get('authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    const token = authHeader.slice(7);
    const decoded = verifyToken(token);

    if (!decoded) {
      return NextResponse.json({ message: 'Invalid token' }, { status: 401 });
    }

    const student = await prisma.student.findUnique({
      where: { user_id: decoded.userId }
    });

    if (!student) {
      return NextResponse.json({ message: 'Student profile not found' }, { status: 404 });
    }

    // Verify test ownership
    const test = await prisma.test.findFirst({
      where: {
        id: id,
        student_id: student.id
      }
    });

    if (!test) {
      return NextResponse.json({ message: 'Test not found' }, { status: 404 });
    }

    // Update the updated_at timestamp to act as a heartbeat
    await prisma.test.update({
      where: { id: test.id },
      data: { updated_at: new Date() }
    });

    return NextResponse.json({ message: 'Ping successful' });
  } catch (error: any) {
    console.error('[Ping Error]', error);
    return NextResponse.json(
      { message: error.message || 'Failed to ping' },
      { status: 400 }
    );
  }
}
