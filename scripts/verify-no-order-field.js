const fs = require('fs');
const path = require('path');
const ROOT = path.resolve(__dirname, '..');
const SRC = path.join(ROOT, 'frontend', 'src');
const BLOCK = /\b(order)\b/;

function walk(dir){
  for (const entry of fs.readdirSync(dir)){
    const full = path.join(dir, entry);
    const stat = fs.statSync(full);
    if (stat.isDirectory()){
      if (!/node_modules|build|dist|\.git/.test(full)) walk(full);
      continue;
    }
    if (!/\.(js|jsx|ts|tsx|md|css)$/.test(full)) continue;
    const txt = fs.readFileSync(full,'utf8');
    if (BLOCK.test(txt)){
      // allow mentions inside migration file or type hint comment lines referencing removal
      if (/migrations-1_3\.js/.test(full)) continue;
      if (/order\?: never/.test(txt)) continue;
      console.error(`❌ Found forbidden token "order" in ${path.relative(ROOT, full)}`);
      process.exit(1);
    }
  }
}
walk(SRC);
console.log('✅ No forbidden "order" field usages found.');
