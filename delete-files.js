const fs = require('fs');
const path = require('path');

const root = process.cwd();

const filesToDelete = [
  'app/api/sections/route.ts',
  'components/questions/dynamic-renderer.tsx',
  'components/questions/types/coding.tsx',
  'components/questions/types/date.tsx',
  'components/questions/types/mcq.tsx',
  'components/questions/types/multi-select.tsx',
  'components/questions/types/open-text.tsx',
  'components/questions/types/ranking.tsx',
  'components/questions/types/single-select.tsx',
  'components/questions/types/structured-response.tsx',
  'app/api/delete/route.ts'
];

for (const f of filesToDelete) {
  const p = path.join(root, f);
  if (fs.existsSync(p)) {
    fs.unlinkSync(p);
    console.log('Deleted:', p);
  }
}

const dir = path.join(root, 'components/questions/types');
if (fs.existsSync(dir)) {
  if (fs.readdirSync(dir).length === 0) {
     fs.rmdirSync(dir);
     console.log('Deleted dir:', dir);
  }
}

const typesDir = path.join(root, 'components/questions');
if (fs.existsSync(typesDir)) {
  if (fs.readdirSync(typesDir).length === 0) {
     fs.rmdirSync(typesDir);
     console.log('Deleted dir:', typesDir);
  }
}
