import { NextRequest, NextResponse } from 'next/server';
import { verifyToken } from '@/lib/auth';
import prisma from '@/lib/prisma';

export async function GET(
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
      return NextResponse.json({ message: 'Only admins can view hiring drives' }, { status: 403 });
    }

    const resolvedParams = await params;
    const { id } = resolvedParams;

    const drive = await prisma.hiringDrive.findUnique({
      where: { id }
    });

    if (!drive) {
      return NextResponse.json({ message: 'Hiring drive not found' }, { status: 404 });
    }

    return NextResponse.json({ drive });
  } catch (error: any) {
    console.error('[Get Hiring Drive Error]', error);
    return NextResponse.json(
      { message: error.message || 'Failed to retrieve hiring drive' },
      { status: 500 }
    );
  }
}

export async function PUT(
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
      return NextResponse.json({ message: 'Only admins can edit hiring drives' }, { status: 403 });
    }

    const resolvedParams = await params;
    const { id } = resolvedParams;

    const data = await request.json();

    const drive = await prisma.hiringDrive.update({
      where: { id },
      data: {
        name: data.name,
        is_active: data.is_active,
        min_cgpa: data.min_cgpa ? parseFloat(data.min_cgpa) : null,
        max_active_backlogs: data.max_active_backlogs !== undefined && data.max_active_backlogs !== null ? parseInt(data.max_active_backlogs) : null,
        eligible_branches: data.eligible_branches || [],
        graduation_years: data.graduation_years || [],
        require_work_auth: data.require_work_auth,
      }
    });

    return NextResponse.json({ message: 'Hiring drive updated successfully', drive });
  } catch (error: any) {
    console.error('[Update Hiring Drive Error]', error);
    return NextResponse.json(
      { message: error.message || 'Failed to update hiring drive' },
      { status: 500 }
    );
  }
}

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
      return NextResponse.json({ message: 'Only admins can delete hiring drives' }, { status: 403 });
    }

    const resolvedParams = await params;
    const { id } = resolvedParams;

    await prisma.hiringDrive.delete({ where: { id } });

    return NextResponse.json({ message: 'Hiring drive deleted successfully' });
  } catch (error: any) {
    console.error('[Delete Hiring Drive Error]', error);
    return NextResponse.json(
      { message: error.message || 'Failed to delete hiring drive' },
      { status: 500 }
    );
  }
}
