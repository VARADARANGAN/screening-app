import { POST as ActionPost } from '../[action]/route';
import { NextRequest } from 'next/server';

export async function POST(request: NextRequest, { params }: any) {
  const resolvedParams = await params;
  return ActionPost(request, { params: Promise.resolve({ id: resolvedParams.id?.trim(), action: 'ping' }) });
}
