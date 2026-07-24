import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function GET() {
  try {
    // Fetch distinct branch names from the Student model since the Branch model was removed
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

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { name } = body;
    // Return dummy response to satisfy the frontend if admin tries to create a branch
    return NextResponse.json({ 
        message: 'Branch concept is now dynamically based on student inputs.', 
        branch: { id: name, name } 
    });
  } catch (error) {
    console.error('[Branches POST]', error);
    return NextResponse.json({ message: 'Internal Error' }, { status: 500 });
  }
}
