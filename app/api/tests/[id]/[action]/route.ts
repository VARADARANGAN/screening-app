import { NextRequest, NextResponse } from 'next/server';
import { verifyToken } from '@/lib/auth';
import prisma from '@/lib/prisma';
import { processBackgroundEvaluations } from '@/lib/services/evaluation-pipeline';
import { recalculateTestScore } from '@/lib/services/score-calculation';
import { SubmitTestResponseSchema } from '@/lib/validators';
import vm from 'vm';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string, action: string }> }
) {
  try {
    const resolvedParams = await params;
    const { id, action } = resolvedParams;

    const authHeader = request.headers.get('authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    const token = authHeader.slice(7);
    const decoded = verifyToken(token);

    if (!decoded) {
      return NextResponse.json({ message: 'Invalid token' }, { status: 401 });
    }

    // Special case for run-code
    if (action === 'run-code') {
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

      return NextResponse.json({ testCases: results });
    }

    // Special case for reevaluate
    if (action === 'reevaluate') {
      const data = await request.json();
      const { questionId } = data;

      if (!questionId) {
        return NextResponse.json({ message: 'questionId is required' }, { status: 400 });
      }

      const testResponse = await prisma.testResponse.findFirst({
        where: {
          test_id: id,
          question_id: questionId
        }
      });

      if (!testResponse) {
        return NextResponse.json({ message: 'Submission not found' }, { status: 404 });
      }

      await prisma.testResponse.update({
        where: { id: testResponse.id },
        data: {
          points_earned: null,
          ai_evaluation_json: { evaluation_status: 'PENDING', evaluated_at: new Date().toISOString() }
        }
      });

      processBackgroundEvaluations([{
        testId: id,
        questionId: questionId,
        studentAnswer: testResponse.student_answer || ''
      }]).catch(err => {
        console.error(`[Re-Evaluation Spawn Error]`, err);
      });

      return NextResponse.json({
        message: 'Re-evaluation triggered successfully',
        status: 'PENDING'
      });
    }

    // The other actions (ping, auto-save, submit) require checking if it belongs to the student
    const student = await prisma.student.findUnique({
      where: { user_id: decoded.userId }
    });

    if (!student) {
      return NextResponse.json({ message: 'Student profile not found' }, { status: 404 });
    }

    const test = await prisma.test.findFirst({
      where: {
        id: id,
        student_id: student.id
      }
    });

    if (!test) {
      return NextResponse.json({ message: 'Test not found' }, { status: 404 });
    }

    if (action === 'ping') {
      await prisma.test.update({
        where: { id: test.id },
        data: { updated_at: new Date() }
      });
      return NextResponse.json({ message: 'Pong' });
    }

    if (action === 'auto-save') {
      if (test.is_completed || test.status === 'submitted' || test.status === 'auto_submitted') {
        return NextResponse.json({ message: 'Test has already been submitted' }, { status: 409 });
      }

      const data = await request.json();
      const { questionId, answer } = data;

      if (!questionId) {
        return NextResponse.json({ message: 'Question ID is required' }, { status: 400 });
      }

      const testResponse = await prisma.testResponse.findFirst({
        where: { test_id: test.id, question_id: questionId }
      });

      if (testResponse) {
        await prisma.testResponse.update({
          where: { id: testResponse.id },
          data: { student_answer: answer, auto_saved_at: new Date() }
        });
      } else {
        await prisma.testResponse.create({
          data: {
            test_id: test.id,
            question_id: questionId,
            student_answer: answer,
            auto_saved_at: new Date(),
            started_at: new Date()
          }
        });
      }

      await prisma.test.update({
        where: { id: test.id },
        data: { updated_at: new Date() }
      });

      return NextResponse.json({ message: 'Answer saved' });
    }

    if (action === 'submit') {
      if (test.is_completed || test.status === 'submitted' || test.status === 'auto_submitted') {
        return NextResponse.json({ message: 'Test already submitted' }, { status: 400 });
      }

      const data = await request.json().catch(() => ({}));
      
      const validationResult = SubmitTestResponseSchema.safeParse(data);
      if (!validationResult.success) {
        return NextResponse.json(
          { message: 'Invalid submission payload', errors: validationResult.error.issues },
          { status: 400 }
        );
      }

      const validatedData = validationResult.data;

      if (validatedData.responses && validatedData.responses.length > 0) {
        for (const response of validatedData.responses) {
          if (!response.questionId) continue;
          
          const existing = await prisma.testResponse.findFirst({
            where: { test_id: test.id, question_id: response.questionId }
          });
          
          if (existing) {
            await prisma.testResponse.update({
              where: { id: existing.id },
              data: {
                student_answer: response.answer || '',
                submitted_at: new Date()
              }
            });
          } else {
            await prisma.testResponse.create({
              data: {
                test_id: test.id,
                question_id: response.questionId,
                student_answer: response.answer || '',
                submitted_at: new Date(),
                started_at: new Date()
              }
            });
          }
        }
      }
      
      await prisma.test.update({
        where: { id: test.id },
        data: {
          status: validatedData.status || 'submitted',
          is_completed: true,
          end_time: new Date(),
          updated_at: new Date()
        }
      });

      processBackgroundEvaluations(test.id).catch(err => {
        console.error('[Background Evaluation Error]', err);
      });

      return NextResponse.json({ message: 'Test submitted successfully' });
    }

    return NextResponse.json({ message: 'Route not found' }, { status: 404 });
  } catch (error: any) {
    console.error(`[Test Action Error]`, error);
    return NextResponse.json(
      { message: error.message || 'Action failed' },
      { status: 500 }
    );
  }
}
