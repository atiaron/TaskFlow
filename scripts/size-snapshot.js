// scripts/size-snapshot.js
// Generates a lightweight size & hash snapshot for main JS bundles.
// Output: build/size-snapshot.json

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

function hashFile(p) {
  const buf = fs.readFileSync(p);
  return crypto.createHash('md5').update(buf).digest('hex');
}

function formatBytes(b) {
  return b.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',');
}

// Primary expected path (standard CRA build)
const primaryJsDir = path.join(__dirname, '..', 'frontend', 'build', 'static', 'js');
let buildDir = primaryJsDir;
if (!fs.existsSync(buildDir)) {
  // Fallback: Android assets embedded public path
  const androidCandidate = path.join(__dirname, '..', 'frontend', 'android', 'app', 'src', 'main', 'assets', 'public', 'static', 'js');
  if (fs.existsSync(androidCandidate)) {
    buildDir = androidCandidate;
  }
}

if (!fs.existsSync(buildDir)) {
  console.error('Build JS directory not found (checked):', primaryJsDir);
  process.exit(1);
}

const files = fs.readdirSync(buildDir).filter(f => f.endsWith('.js') && !f.endsWith('.LICENSE.txt'));
const snapshot = {
  generatedAt: new Date().toISOString(),
  source: buildDir.includes('android') ? 'android-embedded' : 'web-build',
  files: [],
  totalBytes: 0
};

// After computing files list
if (!files.length) {
  const outPath = path.join(__dirname, '..', 'frontend', 'build', 'size-snapshot.json');
  const snapshot = { generatedAt: new Date().toISOString(), source: 'missing', reason: 'No JS bundle files found', checkedPath: buildDir };
  const parent = path.dirname(outPath); if (!fs.existsSync(parent)) fs.mkdirSync(parent, { recursive: true });
  fs.writeFileSync(outPath, JSON.stringify(snapshot, null, 2));
  console.warn('No JS files found for snapshot. Wrote status JSON.');
  process.exit(0);
}

files.forEach(f => {
  const full = path.join(buildDir, f);
  const stat = fs.statSync(full);
  const hash = hashFile(full);
  snapshot.files.push({ file: f, bytes: stat.size, pretty: formatBytes(stat.size), md5: hash });
  snapshot.totalBytes += stat.size;
});

snapshot.prettyTotal = formatBytes(snapshot.totalBytes);

const outPath = path.join(__dirname, '..', 'frontend', 'build', 'size-snapshot.json');
// Ensure parent exists
const outParent = path.dirname(outPath);
if (!fs.existsSync(outParent)) fs.mkdirSync(outParent, { recursive: true });
fs.writeFileSync(outPath, JSON.stringify(snapshot, null, 2));
console.log('Size snapshot written to', outPath, 'files:', snapshot.files.length);
