import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

export async function GET() {
  try {
    const root = process.cwd();
    
    const filesToDelete = [
      'app/api/sections/route.ts',
      'components/questions/dynamic-renderer.tsx',
      'components/questions/types/coding.tsx',
      'components/questions/types/date.tsx',
      'components/questions/types/mcq.tsx',
      'components/questions/types/multi-select.tsx',
      'components/questions/types/open-text.tsx',
      'components/questions/types/ranking.tsx',
      'components/questions/types/single-select.tsx',
      'components/questions/types/structured-response.tsx',
    ];

    for (const f of filesToDelete) {
      const p = path.join(root, f);
      if (fs.existsSync(p)) {
        fs.unlinkSync(p);
      }
    }

    const dir = path.join(root, 'components/questions/types');
    if (fs.existsSync(dir)) {
      if (fs.readdirSync(dir).length === 0) {
         fs.rmdirSync(dir);
      }
    }

    const typesDir = path.join(root, 'components/questions');
    if (fs.existsSync(typesDir)) {
      if (fs.readdirSync(typesDir).length === 0) {
         fs.rmdirSync(typesDir);
      }
    }

    return NextResponse.json({ success: true });
  } catch (e: any) {
    return NextResponse.json({ error: e.message });
  }
}
