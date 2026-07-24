import { NextRequest, NextResponse } from 'next/server';
import { verifyToken } from '@/lib/auth';
import prisma from '@/lib/prisma';
import { evaluateCodingAnswer } from '@/lib/ai-evaluation';

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
      let aiEvaluationJson = null;
      let pointsEarnedToSave: number | null = 0;

      if (question.type === 'coding') {
        try {
          console.log(`[AI Evaluation] [Test: ${id}] [Question: ${questionId}] [Student: ${student.id}] Starting evaluation.`);
          
          const evaluationResult = await evaluateCodingAnswer(
            question.question_text,
            pts,
            String(studentAnswer)
          );

          if (evaluationResult.success) {
            console.log(`[AI Evaluation] [Test: ${id}] Successfully parsed JSON result from service.`);
            pointsEarned = evaluationResult.marksAwarded;
            isCorrect = pointsEarned >= pts * 0.5; // Correct if >= 50% marks

            aiEvaluationJson = {
              detected_language: evaluationResult.language,
              marks_awarded: pointsEarned,
              total_marks: pts,
              evaluation_status: 'success',
              ai_feedback: evaluationResult.feedback,
              deduction_reason: evaluationResult.deductionReason,
              ai_evaluation_json: evaluationResult.rawJson,
              evaluated_at: new Date().toISOString()
            };
          } else {
            console.error(`[AI Evaluation Service Error] [Test: ${id}]`, evaluationResult.error);
            pointsEarned = 0;
            isCorrect = false;

            aiEvaluationJson = {
              evaluation_status: 'FAILED',
              error: evaluationResult.error || 'Unknown AI Service Failure',
              raw_response: evaluationResult.rawJson?.raw_response,
              evaluated_at: new Date().toISOString()
            };
          }
        } catch (e: any) {
          console.error(`[AI Evaluation System Error] [Test: ${id}]`, e);
          pointsEarned = 0;
          isCorrect = false;
          aiEvaluationJson = {
            evaluation_status: 'FAILED',
            error: `System Exception: ${e.message || e}`,
            evaluated_at: new Date().toISOString()
          };
        }

        // If evaluation failed, we save points_earned as null
        const isFailed = aiEvaluationJson?.evaluation_status === 'FAILED';
        pointsEarnedToSave = isFailed ? null : pointsEarned;

        // In score calculation, we add 0 if it failed, but save null in DB
        score += pointsEarned;
        correctQuestionsCount += pts > 0 ? (pointsEarned / pts) : (isCorrect ? 1 : 0);
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
        pointsEarnedToSave = pointsEarned;

        score += pointsEarned;
        correctQuestionsCount += pts > 0 ? (pointsEarned / pts) : (isCorrect ? 1 : 0);
      }

      // Store response (using findFirst to prevent duplicate insert on unique constraint)
      const existingResponse = await prisma.testResponse.findFirst({
        where: {
          test_id: id,
          question_id: questionId
        }
      });

      const dbData = {
        student_answer: studentAnswer ? String(studentAnswer) : null,
        is_correct: isCorrect,
        points_earned: pointsEarnedToSave,
        ai_evaluation_json: aiEvaluationJson ? JSON.parse(JSON.stringify(aiEvaluationJson)) : null,
        submitted_at: new Date()
      };

      if (existingResponse) {
        await prisma.testResponse.update({
          where: { id: existingResponse.id },
          data: dbData
        });
        console.log(`[AI Evaluation] [Test: ${id}] Successfully updated database response for question ${questionId}`);
      } else {
        await prisma.testResponse.create({
          data: {
            test_id: id,
            question_id: questionId,
            ...dbData
          }
        });
        console.log(`[AI Evaluation] [Test: ${id}] Successfully created database response for question ${questionId}`);
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
