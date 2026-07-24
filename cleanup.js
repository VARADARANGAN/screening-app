const fs = require('fs');
const path = require('path');

try {
  fs.rmSync(path.join(__dirname, 'app', 'admin', 'branches'), { recursive: true, force: true });
  console.log('Removed app/admin/branches');
} catch(e) { console.error(e); }

try {
  fs.rmSync(path.join(__dirname, 'app', 'api', 'branches'), { recursive: true, force: true });
  console.log('Removed app/api/branches');
} catch(e) { console.error(e); }
