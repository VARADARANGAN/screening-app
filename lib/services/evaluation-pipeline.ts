import prisma from '@/lib/prisma';
import { evaluateAnswer } from '@/lib/evaluation-engine';
import { recalculateTestScore } from '@/lib/services/score-calculation';
import { EvaluationRequest } from '@/types';

interface BackgroundEvalPayload {
  testId: string;
  questionId: string;
  studentAnswer: string;
}

/**
 * Executes AI evaluations in the background.
 * Processes each submission, interacts with the Evaluation Engine,
 * updates the DB with structured results, and recalculates the total test score.
 */
export async function processBackgroundEvaluations(payloads: BackgroundEvalPayload[]) {
  if (payloads.length === 0) return;

  const testId = payloads[0].testId;

  try {
    const test = await prisma.test.findUnique({ where: { id: testId } });
    if (!test) return;

    for (const payload of payloads) {
      const { questionId, studentAnswer } = payload;

      const existingResponse = await prisma.testResponse.findFirst({
        where: { test_id: testId, question_id: questionId }
      });

      if (existingResponse) {
        await prisma.testResponse.update({
          where: { id: existingResponse.id },
          data: {
            evaluation_status: 'PROCESSING',
            ai_evaluation_json: { evaluationStatus: 'PROCESSING', evaluatedAt: new Date().toISOString() }
          }
        });
      }

      const question = await prisma.question.findUnique({ where: { id: questionId } });
      if (!question) continue;

      const pts = question.points || 0;
      
      const evaluationRequest: EvaluationRequest = {
        questionId: question.id,
        section: question.section || undefined,
        questionType: question.type as string,
        question: question.question_text,
        studentAnswer: String(studentAnswer),
        maxMarks: pts,
      };

      const evaluationResponse = await evaluateAnswer(evaluationRequest);

      let pointsEarnedToSave: number | null = null;
      let finalStatus: any = 'FAILED';

      if (evaluationResponse.success) {
        pointsEarnedToSave = evaluationResponse.score;
        finalStatus = 'COMPLETED';
      } else {
        console.error(`[Background Evaluation] Failed for Question ${questionId}:`, evaluationResponse.error);
        pointsEarnedToSave = null;
        finalStatus = evaluationResponse.evaluationStatus === 'RETRYING' ? 'RETRYING' : 'FAILED';
      }

      if (existingResponse) {
        await prisma.testResponse.update({
          where: { id: existingResponse.id },
          data: {
            points_earned: pointsEarnedToSave,
            is_correct: pointsEarnedToSave === pts,
            evaluation_status: finalStatus,
            ai_evaluation_json: evaluationResponse as any
          }
        });

        await prisma.aIEvaluation.upsert({
          where: { test_response_id: existingResponse.id },
          update: {
            obtained_marks: pointsEarnedToSave,
            maximum_marks: pts,
            feedback: evaluationResponse.feedback,
            strengths: evaluationResponse.strengths,
            improvements: evaluationResponse.improvements,
            evaluation_status: finalStatus,
            model_used: evaluationResponse.modelUsed,
            raw_response: evaluationResponse.rawJson,
            evaluated_at: new Date()
          },
          create: {
            test_id: testId,
            student_id: test.student_id,
            question_id: questionId,
            section: question.section,
            question_type: question.type,
            obtained_marks: pointsEarnedToSave,
            maximum_marks: pts,
            feedback: evaluationResponse.feedback,
            strengths: evaluationResponse.strengths,
            improvements: evaluationResponse.improvements,
            evaluation_status: finalStatus,
            model_used: evaluationResponse.modelUsed,
            raw_response: evaluationResponse.rawJson,
            evaluated_at: new Date(),
            test_response_id: existingResponse.id
          }
        });
      }
    }

    await recalculateTestScore(testId);
    
  } catch (error) {
    console.error(`[Background Evaluation Fatal Error] Test ID: ${testId}`, error);
  }
}
