import { NextRequest, NextResponse } from 'next/server';
import { verifyToken } from '@/lib/auth';
import prisma from '@/lib/prisma';

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const authHeader = request.headers.get('authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    const token = authHeader.slice(7);
    const decoded = verifyToken(token);

    if (!decoded || (decoded.role !== 'admin' && decoded.role !== 'super_admin')) {
      return NextResponse.json({ message: 'Only admins can delete branches' }, { status: 403 });
    }

    const resolvedParams = await params;
    const id = resolvedParams.id;

    await prisma.branch.delete({
      where: { id }
    });

    return NextResponse.json({ message: 'Branch deleted successfully' });
  } catch (error: any) {
    console.error('[Delete Branch Error]', error);
    return NextResponse.json(
      { message: error.message || 'Failed to delete branch' },
      { status: 500 }
    );
  }
}
