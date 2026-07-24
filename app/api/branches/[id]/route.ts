import { NextResponse } from 'next/server';

export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const resolvedParams = await params;
    const { id } = resolvedParams;
    
    // Return dummy response since branches are dynamically derived from students
    return NextResponse.json({ 
        message: 'Branch concept is now dynamically based on students. Deletion simulated.', 
        id 
    });
  } catch (error) {
    console.error('[Branches DELETE]', error);
    return NextResponse.json({ message: 'Internal Error' }, { status: 500 });
  }
}
