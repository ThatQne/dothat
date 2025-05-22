const fs = require('fs');
const path = require('path');

const pkgPath = path.join(__dirname, '../package.json');
const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf8'));

const mode = process.argv[2];

if (!mode || (mode !== 'dev' && mode !== 'prod')) {
  console.error('Usage: node scripts/set-main.js <dev|prod>');
  process.exit(1);
}

const newMain = mode === 'dev' ? 'src/main.js' : '.webpack/x64/main/index.js';
if (pkg.main !== newMain) {
  pkg.main = newMain;
  fs.writeFileSync(pkgPath, JSON.stringify(pkg, null, 2));
  console.log(`Set main to ${newMain}`);
} else {
  console.log(`main already set to ${newMain}`);
}

// Set PRELOAD_PATH env var for dev
if (mode === 'dev') {
  process.env.PRELOAD_PATH = path.join('src', 'preload.js');
  // Optionally write to a .env file or similar if needed
} 