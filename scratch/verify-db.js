require('dotenv').config();
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const fs = require('fs');

async function main() {
  const legacyTypes = ['structured_plan', 'descriptive', 'short_answer', 'coding_challenge', 'code_response'];
  
  const questionsCount = await prisma.question.count({
    where: { type: { in: legacyTypes } }
  });

  const aiEvalsCount = await prisma.aIEvaluation.count({
    where: { question_type: { in: legacyTypes } }
  });

  const allQuestionsTypes = await prisma.question.groupBy({
    by: ['type'],
    _count: { type: true }
  });

  const allAiEvalsTypes = await prisma.aIEvaluation.groupBy({
    by: ['question_type'],
    _count: { question_type: true }
  });

  const result = {
    legacyQuestionsCount: questionsCount,
    legacyAIEvalsCount: aiEvalsCount,
    questionTypes: allQuestionsTypes,
    aiEvalTypes: allAiEvalsTypes
  };

  fs.writeFileSync('scratch/verify-results.json', JSON.stringify(result, null, 2));
  console.log('Results written to scratch/verify-results.json');
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
