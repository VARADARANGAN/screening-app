const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const result = await prisma.question.updateMany({
    where: {
      type: 'single_select',
      section: {
        not: 'ELIGIBILITY'
      }
    },
    data: {
      type: 'mcq'
    }
  });
  console.log(`Migration completed. Updated ${result.count} questions.`);
}

main()
  .catch(e => console.error(e))
  .finally(async () => {
    await prisma.$disconnect();
  });
