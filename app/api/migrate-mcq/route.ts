import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function GET() {
  try {
    const result = await prisma.question.updateMany({
      where: {
        type: 'single_select',
        section: {
          not: 'ELIGIBILITY'
        }
      },
      data: {
        type: 'mcq'
      }
    });

    return NextResponse.json({ message: `Migration completed. Updated ${result.count} questions.` });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
