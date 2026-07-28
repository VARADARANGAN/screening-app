const fs = require('fs');
const path = require('path');

const projectRoot = __dirname;

const pathsToDelete = [
  // AI prompts and logic
  'lib/ai/evaluator.ts',
  'lib/ai/behaviour.prompt.ts',
  'lib/ai/learning.prompt.ts',
  'lib/ai/aiLiteracy.prompt.ts',
  'lib/ai/candidateAggregator.prompt.ts',
  
  // API routes
  'app/api/evaluations',
  'app/api/admin/evaluation',
  'app/api/admin/hiring-drives',
  'app/api/students/eligibility',
  'app/api/health',
  
  // App pages
  'app/admin/evaluation',
  'app/admin/hiring-drives',
  'app/student/eligibility',
  
  // Components
  'components/admin/evaluation-manager.tsx',
];

pathsToDelete.forEach(relativePath => {
  const fullPath = path.join(projectRoot, relativePath);
  try {
    if (fs.existsSync(fullPath)) {
      const stats = fs.statSync(fullPath);
      if (stats.isDirectory()) {
        fs.rmSync(fullPath, { recursive: true, force: true });
        console.log(`✅ Deleted directory: ${relativePath}`);
      } else {
        fs.rmSync(fullPath, { force: true });
        console.log(`✅ Deleted file: ${relativePath}`);
      }
    } else {
      console.log(`⚠️ Path not found (already deleted?): ${relativePath}`);
    }
  } catch (error) {
    console.error(`❌ Error deleting ${relativePath}:`, error.message);
  }
});

console.log('\nCleanup script finished. Now please run the following commands:');
console.log('1. npx prisma db push --accept-data-loss');
console.log('2. npx prisma generate');
