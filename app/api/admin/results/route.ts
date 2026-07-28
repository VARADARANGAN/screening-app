import { NextResponse } from 'next/server';

export async function GET() {
  return NextResponse.json({ error: 'Results dashboard deprecated' }, { status: 410 });
}
