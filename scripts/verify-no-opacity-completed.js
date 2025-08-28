const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '../frontend/src/ui');
const targets = ['base.css','theme.css'];
let combined = '';
for (const f of targets) {
  const p = path.join(ROOT, f);
  if (fs.existsSync(p)) combined += '\n/*FILE:'+f+'*/\n' + fs.readFileSync(p,'utf8');
}
// Look for any .is-completed block containing opacity:
const pattern = /\.is-completed[^{]*{[^}]*opacity\s*:/gi;
if (pattern.test(combined)) {
  console.error('❌ Found opacity declaration inside .is-completed block. Remove it.');
  process.exit(1);
}
console.log('✅ No opacity under .is-completed.');
