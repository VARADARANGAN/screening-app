const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const typesToRemove = ['date', 'open_response', 'essay', 'code_response', 'code_review', 'multiple_select', 'prompt_writing'];
  
  const questions = await prisma.question.findMany({
    where: { type: { in: typesToRemove } }
  });

  console.log(`Found ${questions.length} questions to remove.`);

  if (questions.length > 0) {
    const questionIds = questions.map(q => q.id);

    // Delete related AIEvaluations
    const deletedEvals = await prisma.aIEvaluation.deleteMany({
      where: { question_id: { in: questionIds } }
    });
    console.log(`Deleted ${deletedEvals.count} AI evaluations.`);

    // Delete related TestResponses
    const deletedResponses = await prisma.testResponse.deleteMany({
      where: { question_id: { in: questionIds } }
    });
    console.log(`Deleted ${deletedResponses.count} test responses.`);

    // Delete related TestQuestions
    const deletedTestQuestions = await prisma.testQuestion.deleteMany({
      where: { question_id: { in: questionIds } }
    });
    console.log(`Deleted ${deletedTestQuestions.count} test questions.`);

    // Finally, delete the Questions
    const deletedQuestions = await prisma.question.deleteMany({
      where: { id: { in: questionIds } }
    });
    console.log(`Deleted ${deletedQuestions.count} questions.`);
  } else {
    console.log('No questions of the removed types were found in the database.');
  }
}

main()
  .catch(e => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
