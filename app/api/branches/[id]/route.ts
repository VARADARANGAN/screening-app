// This route has been removed. Branch deletion is not needed.
import { NextResponse } from 'next/server';

export async function DELETE() {
  return NextResponse.json({ message: 'Branch deletion is not supported.' }, { status: 404 });
}
