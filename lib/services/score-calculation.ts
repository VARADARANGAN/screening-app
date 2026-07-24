import prisma from '@/lib/prisma';

/**
 * Recalculates the total score for a test based on all completed TestResponses.
 * This is called both synchronously (for MCQs) and asynchronously (after AI grading finishes).
 */
export async function recalculateTestScore(testId: string): Promise<number> {
  const test = await prisma.test.findUnique({
    where: { id: testId },
    include: {
      test_questions: {
        include: { question: true }
      }
    }
  });

  if (!test) throw new Error(`Test ${testId} not found`);

  // Calculate maximum possible points for the test
  let totalPossiblePoints = 0;
  for (const tq of test.test_questions) {
    totalPossiblePoints += tq.question.points || 0;
  }

  // Get all responses
  const responses = await prisma.testResponse.findMany({
    where: { test_id: testId }
  });

  let totalEarnedPoints = 0;
  for (const response of responses) {
    if (response.points_earned !== null && response.points_earned !== undefined) {
      totalEarnedPoints += Number(response.points_earned);
    }
  }

  // Persist the recalculated absolute score
  await prisma.test.update({
    where: { id: testId },
    data: {
      score: totalEarnedPoints
    }
  });

  return totalEarnedPoints;
}
