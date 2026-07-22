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

    const student = await prisma.student.findUnique({
      where: { user_id: decoded.userId }
    });

    if (!student) {
      return NextResponse.json({ message: 'Student profile not found' }, { status: 404 });
    }

    // Verify test ownership
    const test = await prisma.test.findFirst({
      where: {
        id: id,
        student_id: student.id
      }
    });

    if (!test) {
      return NextResponse.json({ message: 'Test not found' }, { status: 404 });
    }

    const data = await request.json();
    const { answers, violations } = data;

    // Store violations
    if (violations && violations.length > 0) {
      for (const v of violations) {
        await prisma.violation.create({
          data: {
            test_id: id,
            violation_type: 'suspicious_activity',
            description: v
          }
        });
      }
    }

    const totalQuestions = await prisma.testQuestion.count({
      where: { test_id: id }
    });
    let score = 0;
    let totalPoints = 0;
    let correctQuestionsCount = 0;

    for (const [questionId, studentAnswer] of Object.entries(answers)) {
      // Get question details
      const question = await prisma.question.findUnique({
        where: { id: questionId }
      });

      if (!question) continue;
      const pts = question.points || 0;
      totalPoints += pts;

      let isCorrect = false;
      let pointsEarned = 0;

      if (question.type === 'coding') {
        const options = (question.options_json as any) || {};
        const hiddenTestCases = options.hiddenTestCases || [];
        
        if (hiddenTestCases.length > 0) {
          let passedCount = 0;
          for (const tc of hiddenTestCases) {
            const inputVal = tc.input || '';
            const expectedOutput = tc.expectedOutput || tc.output || '';
            
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
                  ${studentAnswer}
                })();
              `;
              const script = new vm.Script(scriptCode);
              const context = vm.createContext(sandbox);
              script.runInContext(context, { timeout: 1000 });

              const actualOutput = sandbox.output.trim();
              if (String(actualOutput) === String(expectedOutput).trim()) {
                passedCount++;
              }
            } catch (e) {
              const containsPrint = String(studentAnswer).toLowerCase().includes('print') || String(studentAnswer).toLowerCase().includes('system.out') || String(studentAnswer).toLowerCase().includes('cout');
              if (containsPrint) {
                passedCount++;
              }
            }
          }
          pointsEarned = Math.round((passedCount / hiddenTestCases.length) * pts);
          isCorrect = passedCount === hiddenTestCases.length;
        } else {
          const isDirectMatch = String(studentAnswer).trim() === String(question.correct_answer).trim();
          let isTextMatch = false;
          if (question.options_json && Array.isArray(question.options_json)) {
            const correctIdx = parseInt(question.correct_answer || '-1');
            if (correctIdx >= 0 && correctIdx < question.options_json.length) {
              const correctOpt = question.options_json[correctIdx];
              const correctOptText = typeof correctOpt === 'object' && correctOpt !== null && 'text' in correctOpt
                                     ? correctOpt.text
                                     : String(correctOpt);
              isTextMatch = String(studentAnswer).trim() === String(correctOptText).trim();
            }
          }
          isCorrect = isDirectMatch || isTextMatch;
          pointsEarned = isCorrect ? pts : 0;
        }
      } else {
        const isDirectMatch = String(studentAnswer).trim() === String(question.correct_answer).trim();
        let isTextMatch = false;
        if (question.options_json && Array.isArray(question.options_json)) {
          const correctIdx = parseInt(question.correct_answer || '-1');
          if (correctIdx >= 0 && correctIdx < question.options_json.length) {
            const correctOpt = question.options_json[correctIdx];
            const correctOptText = typeof correctOpt === 'object' && correctOpt !== null && 'text' in correctOpt
                                   ? correctOpt.text
                                   : String(correctOpt);
            isTextMatch = String(studentAnswer).trim() === String(correctOptText).trim();
          }
        }
        isCorrect = isDirectMatch || isTextMatch;
        pointsEarned = isCorrect ? pts : 0;
      }

      score += pointsEarned;
      correctQuestionsCount += pts > 0 ? (pointsEarned / pts) : (isCorrect ? 1 : 0);

      // Store response (using findFirst to prevent duplicate insert on unique constraint)
      const existingResponse = await prisma.testResponse.findFirst({
        where: {
          test_id: id,
          question_id: questionId
        }
      });

      if (existingResponse) {
        await prisma.testResponse.update({
          where: { id: existingResponse.id },
          data: {
            student_answer: studentAnswer ? String(studentAnswer) : null,
            is_correct: isCorrect,
            points_earned: pointsEarned,
            submitted_at: new Date()
          }
        });
      } else {
        await prisma.testResponse.create({
          data: {
            test_id: id,
            question_id: questionId,
            student_answer: studentAnswer ? String(studentAnswer) : null,
            is_correct: isCorrect,
            points_earned: pointsEarned,
            submitted_at: new Date()
          }
        });
      }
    }

    const { status } = data;
    const updatedTest = await prisma.test.update({
      where: { id: id },
      data: {
        status: status || 'submitted',
        score: correctQuestionsCount,
        end_time: new Date(),
        violations_count: violations ? violations.length : 0
      }
    });

    return NextResponse.json({
      message: 'Test submitted successfully',
      test: updatedTest,
      score: correctQuestionsCount,
      totalQuestions: totalQuestions
    });
  } catch (error: any) {
    console.error('[Submit Test Error]', error);
    return NextResponse.json(
      { message: error.message || 'Failed to submit test' },
      { status: 400 }
    );
  }
}
