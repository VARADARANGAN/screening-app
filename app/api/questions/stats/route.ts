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

    if (!decoded) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }
    
    if (decoded.role !== 'admin' && decoded.role !== 'super_admin') {
      return NextResponse.json({ message: 'Forbidden' }, { status: 403 });
    }

    const total = await prisma.question.count();
    const typeGroup = await prisma.question.groupBy({
      by: ['type'],
      _count: {
        type: true,
      }
    });

    const types: Record<string, number> = {};
    typeGroup.forEach(group => {
      if (group.type) {
        types[group.type.toLowerCase()] = group._count.type;
      }
    });

    return NextResponse.json({
      message: 'Stats retrieved',
      total,
      types
    });
  } catch (error: any) {
    console.error('[Get Question Stats Error]', error);
    return NextResponse.json(
      { message: error.message || 'Failed to retrieve stats' },
      { status: 400 }
    );
  }
}
