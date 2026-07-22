import { NextRequest, NextResponse } from 'next/server';
import { verifyToken } from '@/lib/auth';
import prisma from '@/lib/prisma';
import { BranchSchema } from '@/lib/validators';

export async function GET(request: NextRequest) {
  try {
    const branches = await prisma.branch.findMany({
      orderBy: { name: 'asc' }
    });

    return NextResponse.json({ branches });
  } catch (error: any) {
    console.error('[Get Branches Error]', error);
    return NextResponse.json(
      { message: error.message || 'Failed to retrieve branches' },
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
      return NextResponse.json({ message: 'Only admins can create branches' }, { status: 403 });
    }

    const body = await request.json();
    const validatedData = BranchSchema.parse(body);

    const existingBranch = await prisma.branch.findUnique({
      where: { name: validatedData.name.toUpperCase() }
    });

    if (existingBranch) {
      return NextResponse.json({ message: 'Branch already exists' }, { status: 409 });
    }

    const branch = await prisma.branch.create({
      data: {
        name: validatedData.name.toUpperCase(),
      }
    });

    return NextResponse.json({ message: 'Branch created successfully', branch }, { status: 201 });
  } catch (error: any) {
    console.error('[Create Branch Error]', error);
    return NextResponse.json(
      { message: error.message || 'Failed to create branch' },
      { status: 400 }
    );
  }
}
