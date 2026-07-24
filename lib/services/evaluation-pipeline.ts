import prisma from '@/lib/prisma';
import { evaluateCodingAnswer } from '@/lib/ai-evaluation';
import { recalculateTestScore } from '@/lib/services/score-calculation';

interface BackgroundEvalPayload {
  testId: string;
  questionId: string;
  studentAnswer: string;
}

/**
 * Executes the AI coding evaluation in the background.
 * Processes each coding submission, interacts with Groq, updates the DB with results/status,
 * and finally recalculates the total test score.
 */
export async function processBackgroundEvaluations(payloads: BackgroundEvalPayload[]) {
  if (payloads.length === 0) return;

  const testId = payloads[0].testId;
  console.log(`[Background Evaluation] Starting async processing for test ${testId}`);

  try {
    for (const payload of payloads) {
      const { questionId, studentAnswer } = payload;

      // Update status to PROCESSING
      await prisma.testResponse.update({
        where: { test_id_question_id: { test_id: testId, question_id: questionId } },
        data: {
          ai_evaluation_json: { evaluation_status: 'PROCESSING', evaluated_at: new Date().toISOString() }
        }
      });

      // Get question details for max marks and problem statement
      const question = await prisma.question.findUnique({ where: { id: questionId } });
      if (!question) continue;

      const pts = question.points || 0;
      console.log(`[Background Evaluation] Evaluating Question ${questionId} (Max Marks: ${pts})`);

      const evaluationResult = await evaluateCodingAnswer(
        question.question_text,
        pts,
        String(studentAnswer)
      );

      let pointsEarnedToSave: number | null = null;
      let aiEvaluationJson: any = null;

      if (evaluationResult.success) {
        console.log(`[Background Evaluation] Success for Question ${questionId}`);
        pointsEarnedToSave = evaluationResult.marksAwarded;
        
        aiEvaluationJson = {
          detected_language: evaluationResult.language,
          marks_awarded: pointsEarnedToSave,
          total_marks: pts,
          evaluation_status: 'COMPLETED',
          ai_feedback: evaluationResult.feedback,
          deduction_reason: evaluationResult.deductionReason,
          ai_evaluation_json: evaluationResult.rawJson,
          evaluated_at: new Date().toISOString()
        };
      } else {
        console.error(`[Background Evaluation] Failed for Question ${questionId}:`, evaluationResult.error);
        pointsEarnedToSave = null;
        
        aiEvaluationJson = {
          evaluation_status: 'FAILED',
          error: evaluationResult.error || 'Unknown AI Service Failure',
          raw_response: evaluationResult.rawJson?.raw_response,
          evaluated_at: new Date().toISOString()
        };
      }

      // Update the DB with the final evaluation result
      await prisma.testResponse.update({
        where: { test_id_question_id: { test_id: testId, question_id: questionId } },
        data: {
          points_earned: pointsEarnedToSave,
          ai_evaluation_json: aiEvaluationJson
        }
      });
    }

    // After all coding questions are evaluated, recalculate the final score
    console.log(`[Background Evaluation] All AI evaluations completed. Recalculating score for test ${testId}`);
    await recalculateTestScore(testId);
    
  } catch (error) {
    console.error(`[Background Evaluation Fatal Error] Test ID: ${testId}`, error);
  }
}
