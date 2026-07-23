import { NextRequest, NextResponse } from 'next/server';
import { verifyToken } from '@/lib/auth';
import { StudentProfileSchema } from '@/lib/validators';
import prisma from '@/lib/prisma';

/**
 * POST /api/students/profile
 * Update student profile
 */
export async function POST(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    const token = authHeader.slice(7);
    const decoded = verifyToken(token);

    if (!decoded) {
      return NextResponse.json({ message: 'Invalid or expired token' }, { status: 401 });
    }

    if (decoded.role !== 'student') {
      return NextResponse.json({ message: 'Only students can update their profile' }, { status: 403 });
    }

    const data = await request.json();
    const validatedData = StudentProfileSchema.parse(data);

    // Dynamic Branch Handling
    const branchName = validatedData.branchName.trim();
    let branch = await prisma.branch.findUnique({
      where: { name: branchName }
    });

    if (!branch) {
      branch = await prisma.branch.create({
        data: { name: branchName }
      });
    }

    const student = await prisma.student.upsert({
      where: { user_id: decoded.userId },
      update: {
        full_name: validatedData.fullName,
        phone: validatedData.phone,
        college: validatedData.college,
        usn: validatedData.usn,
        branch_id: branch.id,
        profile_completed: true,
      },
      create: {
        user_id: decoded.userId,
        full_name: validatedData.fullName,
        phone: validatedData.phone,
        college: validatedData.college,
        usn: validatedData.usn,
        branch_id: branch.id,
        profile_completed: true,
      }
    });

    return NextResponse.json({
      message: 'Profile updated successfully',
      student,
    });
  } catch (error: any) {
    console.error('[Student Profile Error]', error);
    return NextResponse.json(
      { 
        message: 'Failed to update profile',
        error: error.message,
        stack: error.stack
      },
      { status: 400 }
    );
  }
}

/**
 * GET /api/students/profile
 * Get student profile
 */
export async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    const token = authHeader.slice(7);
    const decoded = verifyToken(token);

    if (!decoded) {
      return NextResponse.json({ message: 'Invalid or expired token' }, { status: 401 });
    }

    const student = await prisma.student.findUnique({
      where: { user_id: decoded.userId },
      include: { branch: true }
    });

    if (!student) {
      return NextResponse.json({ message: 'Student profile not found' }, { status: 404 });
    }

    return NextResponse.json({
      message: 'Student profile retrieved',
      student: {
        fullName: student.full_name,
        phone: student.phone,
        college: student.college,
        usn: student.usn,
        branchName: student.branch?.name || '',
        profileCompleted: student.profile_completed,
      },
    });
  } catch (error: any) {
    console.error('[Get Student Profile Error]', error);
    return NextResponse.json(
      { 
        message: 'Failed to retrieve profile',
        error: error.message,
        stack: error.stack
      },
      { status: 400 }
    );
  }
}
