import { NextRequest, NextResponse } from 'next/server';
import { getPool } from '@/lib/db';
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

    const pool = await getPool();
    const result = await pool.query(
      `INSERT INTO admins (user_id, full_name, department)
       VALUES ($1, $2, $3)
       ON CONFLICT (user_id) DO UPDATE SET
       full_name = $2, department = $3
       RETURNING *`,
      [decoded.userId, validatedData.fullName, validatedData.department]
    );

    return NextResponse.json({
      message: 'Profile updated successfully',
      admin: result.rows[0],
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

    const pool = await getPool();
    const result = await pool.query(
      'SELECT * FROM admins WHERE user_id = $1',
      [decoded.userId]
    );

    if (result.rows.length === 0) {
      return NextResponse.json({ message: 'Admin profile not found' }, { status: 404 });
    }

    return NextResponse.json({
      message: 'Admin profile retrieved',
      admin: {
        fullName: result.rows[0].full_name,
        department: result.rows[0].department,
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
