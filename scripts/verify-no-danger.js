const fs = require('fs');
const path = require('path');

const SRC = path.resolve(__dirname, '../frontend/src');

function walk(dir) {
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap(e => {
    const p = path.join(dir, e.name);
    if (e.isDirectory()) return walk(p);
    return [p];
  });
}

const files = walk(SRC).filter(f => /\.(j|t)sx?$/.test(f));
const bad = [];
for (const f of files) {
  const t = fs.readFileSync(f, 'utf8');
  if (/dangerouslySetInnerHTML\s*:|dangerouslySetInnerHTML\s*=/.test(t)) bad.push(f);
}
if (bad.length) {
  console.error('❌ Found dangerouslySetInnerHTML in:\n' + bad.join('\n'));
  process.exit(1);
}
console.log('✅ No dangerouslySetInnerHTML found.');
