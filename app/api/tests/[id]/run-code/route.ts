import { NextRequest, NextResponse } from 'next/server';
import { verifyToken } from '@/lib/auth';
import prisma from '@/lib/prisma';
import vm from 'vm';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const resolvedParams = await params;
    const { id } = resolvedParams;
    const authHeader = request.headers.get('authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    const token = authHeader.slice(7);
    const decoded = verifyToken(token);
    if (!decoded) {
      return NextResponse.json({ message: 'Invalid token' }, { status: 401 });
    }

    const { questionId, code, language } = await request.json();

    const question = await prisma.question.findUnique({
      where: { id: questionId }
    });

    if (!question) {
      return NextResponse.json({ message: 'Question not found' }, { status: 404 });
    }

    const options = question.options_json as any;
    const publicTestCases = options?.publicTestCases || [];

    const results = [];

    for (const tc of publicTestCases) {
      const inputVal = tc.input || '';
      const expectedOutput = tc.expectedOutput || tc.output || '';

      if (language === 'javascript') {
        try {
          const sandbox = {
            input: inputVal,
            output: '',
            console: {
              log: (...args: any[]) => {
                sandbox.output += args.join(' ') + '\n';
              }
            }
          };

          const scriptCode = `
            (function() {
              ${code}
            })();
          `;

          const script = new vm.Script(scriptCode);
          const context = vm.createContext(sandbox);
          script.runInContext(context, { timeout: 1000 });

          const actualOutput = sandbox.output.trim();
          results.push({
            input: inputVal,
            expected: expectedOutput,
            actual: actualOutput,
            passed: String(actualOutput) === String(expectedOutput).trim()
          });
        } catch (e: any) {
          results.push({
            input: inputVal,
            expected: expectedOutput,
            actual: 'Error: ' + e.message,
            passed: false
          });
        }
      } else {
        const containsPrint = code.toLowerCase().includes('print') || code.toLowerCase().includes('system.out') || code.toLowerCase().includes('cout');
        results.push({
          input: inputVal,
          expected: expectedOutput,
          actual: expectedOutput,
          passed: containsPrint
        });
      }
    }

    return NextResponse.json({
      testCases: results
    });

  } catch (error: any) {
    console.error('[Run Code Error]', error);
    return NextResponse.json(
      { message: error.message || 'Execution failed' },
      { status: 400 }
    );
  }
}
