#!/usr/bin/env node
/**
 * Simple build artifact verification for CRA output.
 * Fails CI if critical assets missing.
 */
const fs = require('fs');
const path = require('path');

const buildDir = path.resolve(__dirname, '..', 'build');
const indexHtml = path.join(buildDir, 'index.html');
const staticJsDir = path.join(buildDir, 'static', 'js');

function fail(msg) {
  console.error(`\n[VERIFY-BUILD] FAIL: ${msg}`);
  process.exit(1);
}

function info(msg) {
  console.log(`[VERIFY-BUILD] ${msg}`);
}

if (!fs.existsSync(buildDir)) fail('build directory missing');
if (!fs.existsSync(indexHtml)) fail('index.html missing');
if (!fs.existsSync(staticJsDir)) fail('static/js directory missing');

const jsFiles = fs.readdirSync(staticJsDir).filter(f => f.endsWith('.js'));
if (jsFiles.length === 0) fail('no JS bundle files found inside static/js');

info(`index.html present (${(fs.statSync(indexHtml).size)} bytes)`);
info(`JS bundles: ${jsFiles.join(', ')}`);

// Optional minimal size sanity (can be adjusted): ensure main bundle > 10k
const main = jsFiles.find(f => f.startsWith('main.'));
if (main) {
  const size = fs.statSync(path.join(staticJsDir, main)).size;
  if (size < 10 * 1024) fail(`main bundle suspiciously small (${size} bytes)`);
  info(`Main bundle size OK (${size} bytes)`);
}

info('Build verification PASSED');
