import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { verifyToken } from '@/lib/auth';
import { AdminProfileSchema } from '@/lib/validators';

/**
 * POST /api/admin/profile
 * Update admin profile
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

    if (!decoded || (decoded.role !== 'admin' && decoded.role !== 'super_admin')) {
      return NextResponse.json({ message: 'Only admins can update this profile' }, { status: 403 });
    }

    const data = await request.json();
    const validatedData = AdminProfileSchema.parse(data);

    // 1. Update User Email if provided
    if (validatedData.email) {
      // Check if email belongs to someone else
      const existingUser = await prisma.user.findFirst({
        where: { email: validatedData.email, id: { not: decoded.userId } }
      });
      if (existingUser) {
        return NextResponse.json({ message: 'Email is already in use by another account' }, { status: 400 });
      }
      await prisma.user.update({
        where: { id: decoded.userId },
        data: { email: validatedData.email }
      });
    }

    // 2. Update Admin details
    const admin = await prisma.admin.upsert({
      where: { user_id: decoded.userId },
      update: {
        full_name: validatedData.fullName,
        department: validatedData.department
      },
      create: {
        user_id: decoded.userId,
        full_name: validatedData.fullName,
        department: validatedData.department
      }
    });

    return NextResponse.json({
      message: 'Profile updated successfully',
      admin,
    });
  } catch (error: any) {
    console.error('[Admin Profile Error]', error);
    return NextResponse.json(
      { message: error.message || 'Failed to update profile' },
      { status: 400 }
    );
  }
}

/**
 * GET /api/admin/profile
 * Get admin profile
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

    if (!decoded || (decoded.role !== 'admin' && decoded.role !== 'super_admin')) {
      return NextResponse.json({ message: 'Only admins can view this profile' }, { status: 403 });
    }

    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
      include: { admin: true }
    });

    if (!user) {
      return NextResponse.json({ message: 'User not found' }, { status: 404 });
    }

    return NextResponse.json({
      message: 'Admin profile retrieved',
      admin: {
        email: user.email,
        fullName: user.admin?.full_name || '',
        department: user.admin?.department || '',
      },
    });
  } catch (error: any) {
    console.error('[Get Admin Profile Error]', error);
    return NextResponse.json(
      { message: error.message || 'Failed to retrieve profile' },
      { status: 400 }
    );
  }
}
