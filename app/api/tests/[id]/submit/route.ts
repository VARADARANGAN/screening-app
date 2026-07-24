import { NextRequest, NextResponse } from 'next/server';
import { verifyToken } from '@/lib/auth';
import prisma from '@/lib/prisma';
import { processBackgroundEvaluations } from '@/lib/services/evaluation-pipeline';
import { recalculateTestScore } from '@/lib/services/score-calculation';

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

    let correctQuestionsCount = 0;
    const backgroundTasks: { testId: string; questionId: string; studentAnswer: string }[] = [];

    // Process all answers and persist them synchronously
    for (const [questionId, studentAnswer] of Object.entries(answers)) {
      const question = await prisma.question.findUnique({
        where: { id: questionId }
      });

      if (!question) continue;
      const pts = question.points || 0;

      let isCorrect = false;
      let pointsEarnedToSave: number | null = 0;
      let aiEvaluationJson: any = null;

      if (question.type === 'coding') {
        // Set pending status for coding evaluations
        aiEvaluationJson = { evaluation_status: 'PENDING', evaluated_at: new Date().toISOString() };
        pointsEarnedToSave = null;

        backgroundTasks.push({
          testId: id,
          questionId,
          studentAnswer: String(studentAnswer)
        });
      } else {
        // Evaluate MCQ immediately
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
        pointsEarnedToSave = isCorrect ? pts : 0;
        
        if (isCorrect) correctQuestionsCount++;
      }

      // Upsert the response so we don't violate unique constraints
      const dbData = {
        student_answer: studentAnswer ? String(studentAnswer) : null,
        is_correct: isCorrect,
        points_earned: pointsEarnedToSave,
        ai_evaluation_json: aiEvaluationJson,
        submitted_at: new Date()
      };

      const existingResponse = await prisma.testResponse.findFirst({
        where: { test_id: id, question_id: questionId }
      });

      if (existingResponse) {
        await prisma.testResponse.update({
          where: { id: existingResponse.id },
          data: dbData
        });
      } else {
        await prisma.testResponse.create({
          data: {
            test_id: id,
            question_id: questionId,
            ...dbData
          }
        });
      }
    }

    // Set test to submitted
    const { status } = data;
    await prisma.test.update({
      where: { id: id },
      data: {
        status: status || 'submitted',
        is_completed: true,
        end_time: new Date(),
        violations_count: violations ? violations.length : 0
      }
    });

    // Recalculate score (which right now just calculates MCQ scores since coding is null)
    const initialScore = await recalculateTestScore(id);

    // In Vercel serverless, floating promises are terminated immediately. 
    // We must await the execution to guarantee the AI evaluates the coding tasks.
    if (backgroundTasks.length > 0) {
      try {
        await processBackgroundEvaluations(backgroundTasks);
      } catch (err) {
        console.error(`[Background Task Spawning Error]`, err);
      }
    }

    return NextResponse.json({
      message: 'Test submitted successfully',
      score: initialScore,
      correctQuestions: correctQuestionsCount,
      totalQuestions: totalQuestions
    });

  } catch (error: any) {
    console.error('[Submit Test Error]', error);
    return NextResponse.json(
      { message: error.message || 'Failed to submit test' },
      { status: 500 }
    );
  }
}
