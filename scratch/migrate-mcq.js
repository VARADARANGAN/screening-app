const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  console.log('Starting migration from single_select to mcq for INTEGRITY and ATTITUDE_AND_OWNERSHIP...');

  const result = await prisma.question.updateMany({
    where: {
      type: 'single_select',
      section: {
        in: ['INTEGRITY', 'ATTITUDE_AND_OWNERSHIP']
      }
    },
    data: {
      type: 'mcq'
    }
  });

  console.log(`Migration completed. Updated ${result.count} questions.`);
}

main()
  .catch(e => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
