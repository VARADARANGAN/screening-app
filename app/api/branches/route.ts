import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function GET() {
  try {
    // Fetch distinct branch names from the Student model
    const distinctBranches = await prisma.student.findMany({
      select: { branch_name: true },
      distinct: ['branch_name'],
      where: {
        branch_name: {
          not: null
        }
      }
    });

    const branches = distinctBranches
      .filter(b => b.branch_name)
      .map(b => ({
        id: b.branch_name,
        name: b.branch_name
      }));

    return NextResponse.json({ branches });
  } catch (error) {
    console.error('[Branches GET]', error);
    return NextResponse.json({ message: 'Internal Error' }, { status: 500 });
  }
}
