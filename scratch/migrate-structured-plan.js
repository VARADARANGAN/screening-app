const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  console.log('Migrating structured_plan to structured_response in database...');
  
  // Find questions with type 'structured_plan'
  const questionsToUpdate = await prisma.question.findMany({
    where: { type: 'structured_plan' }
  });

  console.log(`Found ${questionsToUpdate.length} questions to migrate.`);

  if (questionsToUpdate.length > 0) {
    const updatedCount = await prisma.question.updateMany({
      where: { type: 'structured_plan' },
      data: { type: 'structured_response' }
    });
    console.log(`Successfully updated ${updatedCount.count} questions.`);
  }

  // Also migrate AI evaluations that store the question_type
  const evalToUpdate = await prisma.aIEvaluation.findMany({
    where: { question_type: 'structured_plan' }
  });

  console.log(`Found ${evalToUpdate.length} AI Evaluations to migrate.`);

  if (evalToUpdate.length > 0) {
    const updatedEvalsCount = await prisma.aIEvaluation.updateMany({
      where: { question_type: 'structured_plan' },
      data: { question_type: 'structured_response' }
    });
    console.log(`Successfully updated ${updatedEvalsCount.count} AI Evaluations.`);
  }

  console.log('Migration complete.');
}

main()
  .catch(e => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
