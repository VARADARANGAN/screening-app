import { NextRequest, NextResponse } from 'next/server';
import { verifyToken, hashPassword } from '@/lib/auth';
import prisma from '@/lib/prisma';
import { z } from 'zod';

const CreateAdminInputSchema = z.object({
  email: z.string().email('Invalid email format'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  role: z.enum(['admin', 'super_admin']).default('admin'),
  fullName: z.string().optional(),
  department: z.string().optional(),
});

export async function POST(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    const token = authHeader.slice(7);
    const decoded = verifyToken(token);

    if (!decoded || decoded.role !== 'super_admin') {
      return NextResponse.json(
        { message: 'Only Super Admins can create administrative accounts' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const validation = CreateAdminInputSchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json(
        { message: 'Validation failed', errors: validation.error.flatten() },
        { status: 400 }
      );
    }

    const { email, password, role, fullName, department } = validation.data;

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email: email.toLowerCase() },
    });

    if (existingUser) {
      return NextResponse.json(
        { message: 'User with this email already exists' },
        { status: 409 }
      );
    }

    const passwordHash = await hashPassword(password);

    // Create user and profile
    const newUser = await prisma.$transaction(async (tx) => {
      const u = await tx.user.create({
        data: {
          email: email.toLowerCase(),
          password_hash: passwordHash,
          role,
        },
      });

      await tx.admin.create({
        data: {
          user_id: u.id,
          full_name: fullName || 'Admin User',
          department: department || 'Recruitment',
        },
      });

      return u;
    });

    return NextResponse.json({
      message: 'Administrative account created successfully',
      user: {
        id: newUser.id,
        email: newUser.email,
        role: newUser.role,
      },
    }, { status: 201 });
  } catch (error: any) {
    console.error('[Create Admin Error]', error);
    return NextResponse.json(
      { message: error.message || 'Failed to create admin' },
      { status: 500 }
    );
  }
}
