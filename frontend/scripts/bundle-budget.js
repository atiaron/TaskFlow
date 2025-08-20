#!/usr/bin/env node
/**
 * Simple bundle budget guard.
 * Default threshold: 225 KB raw main bundle (adjust via BUNDLE_MAX_KB env var)
 */
const fs = require('fs');
const path = require('path');

const maxKB = parseInt(process.env.BUNDLE_MAX_KB || '225', 10);
const snapshotPath = path.resolve(__dirname, '..', 'build', 'size-snapshot.json');
if (!fs.existsSync(snapshotPath)) {
  console.error('[BUNDLE-BUDGET] size-snapshot.json missing. Run build + size:snapshot first.');
  process.exit(1);
}
const data = JSON.parse(fs.readFileSync(snapshotPath, 'utf8'));
const main = data.files.find(f => /^main\./.test(f.file));
if (!main) {
  console.error('[BUNDLE-BUDGET] main bundle not found in snapshot.');
  process.exit(1);
}
const kb = main.bytes / 1024;
if (kb > maxKB) {
  console.error(`[BUNDLE-BUDGET] FAIL: main bundle ${kb.toFixed(2)} KB exceeds limit ${maxKB} KB`);
  process.exit(1);
}
console.log(`[BUNDLE-BUDGET] OK: main bundle ${kb.toFixed(2)} KB <= ${maxKB} KB`);
