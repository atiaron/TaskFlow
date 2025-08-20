#!/usr/bin/env node
/**
 * One-shot release helper for mobile (Capacitor) + web build integrity.
 * Steps:
 * 1. Build web
 * 2. Verify build artifacts
 * 3. Create size snapshot
 * 4. Enforce bundle budget (optional override via BUNDLE_MAX_KB)
 * 5. Capacitor copy (and optionally sync) for Android embedding
 */
const { execSync } = require('child_process');

function run(cmd, opts = {}) {
  console.log(`\n[release-mobile] >> ${cmd}`);
  execSync(cmd, { stdio: 'inherit', ...opts });
}

try {
  run('npm run build');
  run('npm run verify:build');
  run('npm run size:snapshot');
  run('npm run bundle:budget');
  // Capacitor: copy web assets
  run('npx cap copy');
  // If full sync desired (plugins/gradle updates), uncomment next line:
  // run('npx cap sync');
  console.log('\n[release-mobile] SUCCESS. Assets copied to native platforms.');
  console.log('Next: open android project (npx cap open android) and build APK.');
} catch (e) {
  console.error('\n[release-mobile] FAILED');
  process.exit(1);
}
