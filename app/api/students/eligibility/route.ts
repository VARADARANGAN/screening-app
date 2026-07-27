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

    if (!decoded || decoded.role !== 'student') {
      return NextResponse.json({ message: 'Only students can access this endpoint' }, { status: 403 });
    }

    const student = await prisma.student.findUnique({
      where: { user_id: decoded.userId }
    });

    if (!student || !student.profile_completed) {
      return NextResponse.json({ message: 'Profile not completed' }, { status: 400 });
    }

    // 1. Fetch active hiring drive
    const drive = await prisma.hiringDrive.findFirst({
      where: { is_active: true },
      orderBy: { created_at: 'desc' }
    });

    if (!drive) {
      return NextResponse.json({ message: 'No active hiring drive found', skip: true });
    }

    // 2. Check if student already has an eligibility result
    const existingResult = await prisma.eligibilityResult.findFirst({
      where: { student_id: student.id, hiring_drive_id: drive.id }
    });

    if (existingResult) {
      return NextResponse.json({ message: 'Eligibility already submitted', completed: true });
    }

    // 3. Fetch custom eligibility questions
    const customQuestions = await prisma.question.findMany({
      where: { section: 'ELIGIBILITY', is_published: true },
      orderBy: { display_order: 'asc' }
    });

    return NextResponse.json({
      drive: {
        id: drive.id,
        name: drive.name,
        requires_cgpa: drive.min_cgpa !== null,
        requires_backlogs: drive.max_active_backlogs !== null,
        requires_branch: drive.eligible_branches.length > 0,
        requires_grad_year: drive.graduation_years.length > 0,
        requires_work_auth: drive.require_work_auth,
      },
      customQuestions
    });

  } catch (error: any) {
    console.error('[Get Eligibility Config Error]', error);
    return NextResponse.json(
      { message: error.message || 'Failed to fetch eligibility config' },
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

    if (!decoded || decoded.role !== 'student') {
      return NextResponse.json({ message: 'Only students can submit eligibility' }, { status: 403 });
    }

    const student = await prisma.student.findUnique({
      where: { user_id: decoded.userId }
    });

    if (!student) {
      return NextResponse.json({ message: 'Student not found' }, { status: 404 });
    }

    const data = await request.json();
    const { hiring_drive_id, cgpa, backlogs, branch, grad_year, work_auth, custom_responses } = data;

    const drive = await prisma.hiringDrive.findUnique({
      where: { id: hiring_drive_id }
    });

    if (!drive) {
      return NextResponse.json({ message: 'Hiring drive not found' }, { status: 404 });
    }

    // Evaluate Eligibility
    let status = 'ELIGIBLE';
    const reasons: string[] = [];

    // Evaluate Rules
    if (drive.min_cgpa !== null) {
      if (cgpa === undefined || cgpa === null || cgpa === '') {
        status = 'MANUAL_REVIEW';
        reasons.push('CGPA missing');
      } else if (parseFloat(cgpa) < parseFloat(drive.min_cgpa.toString())) {
        status = 'NOT_ELIGIBLE';
        reasons.push('CGPA below minimum requirement');
      }
    }

    if (drive.max_active_backlogs !== null && status !== 'NOT_ELIGIBLE') {
      if (backlogs === undefined || backlogs === null || backlogs === '') {
        status = 'MANUAL_REVIEW';
        reasons.push('Backlogs missing');
      } else if (parseInt(backlogs) > drive.max_active_backlogs) {
        status = 'NOT_ELIGIBLE';
        reasons.push('Backlogs exceed limit');
      }
    }

    if (drive.eligible_branches.length > 0 && status !== 'NOT_ELIGIBLE') {
      if (!branch) {
        status = 'MANUAL_REVIEW';
        reasons.push('Branch missing');
      } else {
        const isEligible = drive.eligible_branches.some(b => b.toLowerCase() === branch.toLowerCase());
        if (!isEligible) {
          status = 'NOT_ELIGIBLE';
          reasons.push('Branch not eligible');
        }
      }
    }

    if (drive.graduation_years.length > 0 && status !== 'NOT_ELIGIBLE') {
      if (!grad_year) {
        status = 'MANUAL_REVIEW';
        reasons.push('Graduation Year missing');
      } else if (!drive.graduation_years.includes(parseInt(grad_year))) {
        status = 'NOT_ELIGIBLE';
        reasons.push('Graduation year not eligible');
      }
    }

    if (drive.require_work_auth && status !== 'NOT_ELIGIBLE') {
      if (!work_auth) {
        status = 'NOT_ELIGIBLE';
        reasons.push('Missing work authorization');
      }
    }

    if (status === 'ELIGIBLE' && reasons.length === 0) {
      reasons.push('All requirements met');
    }

    // Create Result
    const result = await prisma.eligibilityResult.create({
      data: {
        student_id: student.id,
        hiring_drive_id: drive.id,
        status,
        reason: reasons.join(' | '),
        responses_json: {
          cgpa,
          backlogs,
          branch,
          grad_year,
          work_auth,
          custom_responses
        }
      }
    });

    return NextResponse.json({ message: 'Eligibility evaluated', result });
  } catch (error: any) {
    console.error('[Submit Eligibility Error]', error);
    return NextResponse.json(
      { message: error.message || 'Failed to submit eligibility' },
      { status: 500 }
    );
  }
}
