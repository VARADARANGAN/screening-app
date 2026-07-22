import { NextRequest, NextResponse } from 'next/server';
import { verifyToken } from '@/lib/auth';

export async function POST(request: NextRequest) {
  try {
    const pdfModule = await import('pdf-parse');
    const pdfParse = (pdfModule as any).default || pdfModule;
    const authHeader = request.headers.get('authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    const token = authHeader.slice(7);
    const decoded = verifyToken(token);

    if (!decoded || (decoded.role !== 'admin' && decoded.role !== 'super_admin')) {
      return NextResponse.json({ message: 'Only admins can parse PDFs' }, { status: 403 });
    }

    const formData = await request.formData();
    const file = formData.get('file') as File;
    if (!file) {
      return NextResponse.json({ message: 'No file uploaded' }, { status: 400 });
    }

    const buffer = await file.arrayBuffer();
    const pdfData = await pdfParse(Buffer.from(buffer));
    const text = pdfData.text;

    // Simple Regex Parser for standard PDF formats
    // Assumes format:
    // 1. Question text here?
    // A) Option 1
    // B) Option 2
    // C) Option 3
    // D) Option 4
    // Answer: A

    const questions: any[] = [];
    
    // Split by numbering e.g., "1. ", "2. "
    const questionBlocks = text.split(/(?=\n\d+\.\s+)/);

    for (let block of questionBlocks) {
      block = block.trim();
      if (!block) continue;

      // Extract question text
      const questionMatch = block.match(/^\d+\.\s+(.*?)(?=\n[A-E]\)|\nAnswer:)/s);
      if (!questionMatch) continue;

      const questionText = questionMatch[1].replace(/\n/g, ' ').trim();

      // Extract options (A) B) C) D))
      const options = [];
      const optionMatches = [...block.matchAll(/\n([A-E])\)\s+(.*?)(?=\n[A-E]\)|\nAnswer:|$)/gs)];
      for (const match of optionMatches) {
        options.push(match[2].replace(/\n/g, ' ').trim());
      }

      // Extract answer
      const answerMatch = block.match(/\nAnswer:\s*([A-E])/i);
      let correctAnswer = '0';
      if (answerMatch && answerMatch[1]) {
        const char = answerMatch[1].toUpperCase();
        const index = char.charCodeAt(0) - 65; // A -> 0, B -> 1
        correctAnswer = String(index);
      }

      if (questionText && options.length > 0) {
        questions.push({
          questionText,
          type: 'mcq',
          category: 'PDF Import',
          optionsJson: options,
          correctAnswer,
          timeLimitSeconds: 60,
          points: 10,
          isPublished: false,
        });
      }
    }

    if (questions.length === 0) {
      return NextResponse.json(
        { message: 'Could not parse any questions from the PDF. Ensure it follows the "1. Q\\nA) Opt\\nAnswer: A" format.' },
        { status: 400 }
      );
    }

    return NextResponse.json({ questions });
  } catch (error: any) {
    console.error('[PDF Parse Error]', error);
    return NextResponse.json(
      { message: error.message || 'Failed to parse PDF' },
      { status: 500 }
    );
  }
}
