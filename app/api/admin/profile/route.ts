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

    // 1. Update User Email if provided
    if (validatedData.email) {
      // Check if email belongs to someone else
      const existingUser = await pool.query('SELECT id FROM users WHERE email = $1 AND id != $2', [validatedData.email, decoded.userId]);
      if (existingUser.rows.length > 0) {
        return NextResponse.json({ message: 'Email is already in use by another account' }, { status: 400 });
      }
      await pool.query('UPDATE users SET email = $1 WHERE id = $2', [validatedData.email, decoded.userId]);
    }

    // 2. Update Admin details
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
    // We need to fetch email from users table and everything else from admins table
    const result = await pool.query(
      `SELECT a.*, u.email 
       FROM users u 
       LEFT JOIN admins a ON u.id = a.user_id 
       WHERE u.id = $1`,
      [decoded.userId]
    );

    if (result.rows.length === 0) {
      return NextResponse.json({ message: 'User not found' }, { status: 404 });
    }

    const row = result.rows[0];

    return NextResponse.json({
      message: 'Admin profile retrieved',
      admin: {
        email: row.email,
        fullName: row.full_name || '',
        department: row.department || '',
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
