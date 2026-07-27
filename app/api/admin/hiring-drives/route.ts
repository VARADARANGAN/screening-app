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
      return NextResponse.json({ message: 'Only admins can view hiring drives' }, { status: 403 });
    }

    const drives = await prisma.hiringDrive.findMany({
      orderBy: { created_at: 'desc' }
    });

    return NextResponse.json({ drives });
  } catch (error: any) {
    console.error('[Get Hiring Drives Error]', error);
    return NextResponse.json(
      { message: error.message || 'Failed to retrieve hiring drives' },
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
      return NextResponse.json({ message: 'Only admins can create hiring drives' }, { status: 403 });
    }

    const data = await request.json();
    
    // Basic validation
    if (!data.name) {
      return NextResponse.json({ message: 'Name is required' }, { status: 400 });
    }

    const drive = await prisma.hiringDrive.create({
      data: {
        name: data.name,
        is_active: data.is_active !== undefined ? data.is_active : true,
        min_cgpa: data.min_cgpa ? parseFloat(data.min_cgpa) : null,
        max_active_backlogs: data.max_active_backlogs !== undefined && data.max_active_backlogs !== null ? parseInt(data.max_active_backlogs) : null,
        eligible_branches: data.eligible_branches || [],
        graduation_years: data.graduation_years || [],
        require_work_auth: data.require_work_auth || false,
      }
    });

    return NextResponse.json({ message: 'Hiring drive created', drive }, { status: 201 });
  } catch (error: any) {
    console.error('[Create Hiring Drive Error]', error);
    return NextResponse.json(
      { message: error.message || 'Failed to create hiring drive' },
      { status: 500 }
    );
  }
}
