import { NextRequest, NextResponse } from 'next/server';
import { verifyToken } from '@/lib/auth';
import { StudentProfileSchema } from '@/lib/validators';
import prisma from '@/lib/prisma';
import { z } from 'zod';

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

    if (String(decoded.role).toLowerCase() !== 'student') {
      return NextResponse.json({ message: 'Only students can update their profile' }, { status: 403 });
    }

    const data = await request.json();
    const validatedData = StudentProfileSchema.parse(data);

    // Check USN Uniqueness
    const existingStudent = await prisma.student.findUnique({
      where: { usn: validatedData.usn }
    });
    
    if (existingStudent && existingStudent.user_id !== decoded.userId) {
      return NextResponse.json({ message: 'This USN is already registered.' }, { status: 400 });
    }

    // Check Email Uniqueness
    const existingUser = await prisma.user.findUnique({
      where: { email: validatedData.email }
    });

    if (existingUser && existingUser.id !== decoded.userId) {
      return NextResponse.json({ message: 'This email is already registered.' }, { status: 400 });
    }

    const [updatedUser, student] = await prisma.$transaction([
      prisma.user.update({
        where: { id: decoded.userId },
        data: { email: validatedData.email }
      }),
      prisma.student.upsert({
        where: { user_id: decoded.userId },
        update: {
          full_name: validatedData.fullName,
          phone: validatedData.phone,
          college: validatedData.college,
          usn: validatedData.usn,
          branch_name: validatedData.branchName,
          camera_permission: validatedData.cameraPermission,
          microphone_permission: validatedData.microphonePermission,
          profile_completed: true,
        },
        create: {
          user_id: decoded.userId,
          full_name: validatedData.fullName,
          phone: validatedData.phone,
          college: validatedData.college,
          usn: validatedData.usn,
          branch_name: validatedData.branchName,
          camera_permission: validatedData.cameraPermission,
          microphone_permission: validatedData.microphonePermission,
          profile_completed: true,
        }
      })
    ]);

    return NextResponse.json({
      message: 'Profile updated successfully',
      student,
    });
  } catch (error: any) {
    console.error('[Student Profile Error]', error);
    if (error.name === 'ZodError') {
      return NextResponse.json(
        { message: error.errors[0].message },
        { status: 400 }
      );
    }
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
 * PATCH /api/students/profile
 * Update specific fields of student profile (fullName, phone)
 */
export async function PATCH(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    const token = authHeader.slice(7);
    const decoded = verifyToken(token);

    if (!decoded || String(decoded.role).toLowerCase() !== 'student') {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    const data = await request.json();
    const validatedData = StudentProfileSchema.parse(data);

    // Check USN Uniqueness
    const existingStudent = await prisma.student.findUnique({
      where: { usn: validatedData.usn }
    });
    
    if (existingStudent && existingStudent.user_id !== decoded.userId) {
      return NextResponse.json({ message: 'This USN is already registered.' }, { status: 400 });
    }

    // Check Email Uniqueness
    const existingUser = await prisma.user.findUnique({
      where: { email: validatedData.email }
    });

    if (existingUser && existingUser.id !== decoded.userId) {
      return NextResponse.json({ message: 'This email is already registered.' }, { status: 400 });
    }

    const [updatedUser, student] = await prisma.$transaction([
      prisma.user.update({
        where: { id: decoded.userId },
        data: { email: validatedData.email }
      }),
      prisma.student.upsert({
        where: { user_id: decoded.userId },
        update: {
          full_name: validatedData.fullName,
          phone: validatedData.phone,
          college: validatedData.college,
          usn: validatedData.usn,
          branch_name: validatedData.branchName,
          camera_permission: validatedData.cameraPermission,
          microphone_permission: validatedData.microphonePermission,
          profile_completed: true,
        },
        create: {
          user_id: decoded.userId,
          full_name: validatedData.fullName,
          phone: validatedData.phone,
          college: validatedData.college,
          usn: validatedData.usn,
          branch_name: validatedData.branchName,
          camera_permission: validatedData.cameraPermission,
          microphone_permission: validatedData.microphonePermission,
          profile_completed: true,
        }
      })
    ]);


    return NextResponse.json({
      message: 'Profile updated successfully',
      student,
    });
  } catch (error: any) {
    console.error('[Student Profile Patch Error]', error);
    if (error instanceof z.ZodError || error.name === 'ZodError') {
      return NextResponse.json(
        { message: error.errors?.[0]?.message || 'Validation error' },
        { status: 400 }
      );
    }
    return NextResponse.json(
      { 
        message: 'Failed to update profile',
        error: error.message,
        stack: error.stack
      },
      { status: 500 }
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
      include: { user: true }
    });

    if (!student) {
      return NextResponse.json({ message: 'Student profile not found' }, { status: 404 });
    }

    return NextResponse.json({
      message: 'Student profile retrieved',
      student: {
        fullName: student.full_name,
        email: student.user?.email || '',
        phone: student.phone,
        college: student.college,
        usn: student.usn,
        branchName: student.branch_name || '',
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
