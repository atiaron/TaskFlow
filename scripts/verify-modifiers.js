#!/usr/bin/env node
// Verify that every modifier class (gt-*-*--*) used in source code has a matching CSS rule.
// Pattern: base/element: gt-... ; modifier: --...
// Searches frontend/src for usage and base.css+theme.css for definitions.
const fs = require('fs');
const path = require('path');

const SRC_DIR = path.resolve(__dirname, '../frontend/src');
const CSS_FILES = [
  path.resolve(__dirname, '../frontend/src/ui/base.css'),
  path.resolve(__dirname, '../frontend/src/ui/theme.css')
];

function walk(dir, exts, acc = []) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) walk(full, exts, acc);
    else if (exts.some(e => full.endsWith(e))) acc.push(full);
  }
  return acc;
}

const codeFiles = walk(SRC_DIR, ['.js', '.jsx', '.ts', '.tsx', '.html']);
const codeText = codeFiles.map(f => fs.readFileSync(f, 'utf8')).join('\n');

// Match modifier occurrences (gt-...--modifier) ensuring base prefix
const modifierMatches = codeText.match(/gt-[a-z0-9-]+--[a-z0-9-]+/g) || [];
const modifiers = Array.from(new Set(modifierMatches));

if (!modifiers.length) {
  console.log('No modifiers detected in source. Skipping check.');
  process.exit(0);
}

const cssText = CSS_FILES.map(f => fs.existsSync(f) ? fs.readFileSync(f, 'utf8') : '').join('\n');

const missing = modifiers.filter(cls => {
  const re = new RegExp('\\.' + cls + '(\\b|:|\\s|\\{|,)');
  return !re.test(cssText);
});

if (missing.length) {
  console.error('❌ Missing CSS for modifiers:', missing.join(', '));
  process.exit(1);
}

// Additional validation: each modifier usage must also include its base class (e.g., gt-title + gt-title--primary)
const badCombinations = [];
for (const cls of modifiers) {
  const base = cls.split('--')[0];
  // parse each className attribute value crudely
  const classAttrRe = /class(Name)?=\"([^\"]+)\"/g;
  let m;
  while ((m = classAttrRe.exec(codeText))) {
    const classes = m[2].split(/\s+/);
    if (classes.includes(cls) && !classes.includes(base)) {
      badCombinations.push({ modifier: cls, base, snippet: m[2] });
    }
  }
}

if (badCombinations.length) {
  console.error('❌ Modifier used without base class:', badCombinations);
  process.exit(1);
}

console.log('✅ All modifiers implemented with base classes.');
