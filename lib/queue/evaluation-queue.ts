import { processBackgroundEvaluations } from '../services/evaluation-pipeline';

export interface EvaluationJobPayload {
  testId: string;
  evalPayloads: {
    questionId: string;
    studentAnswer: string;
  }[];
}

/**
 * Executes AI Evaluation asynchronously without requiring a Redis server.
 * This fixes the root cause where missing local Redis caused evaluations to silently fail.
 */
export async function enqueueEvaluationJob(testId: string, evalPayloads: EvaluationJobPayload['evalPayloads']) {
  if (evalPayloads.length === 0) return;

  console.log(`[Queue] Starting background evaluation for Test ${testId} with ${evalPayloads.length} questions.`);
  
  // Execute asynchronously but wait for it to finish so Next.js doesn't kill the context
  try {
    await processBackgroundEvaluations(evalPayloads);
  } catch (err) {
    console.error(`[Background Worker Error] Test ${testId}:`, err);
  }
}
