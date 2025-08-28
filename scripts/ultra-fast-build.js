const { execSync } = require('child_process');
const { shouldRebuild, saveCacheKey } = require('../build-cache');
const fs = require('fs');

console.log('🚀 Ultra Fast Build Starting...');

if (!shouldRebuild() && fs.existsSync('build')) {
  console.log('✅ Cache hit! Build skipped. Total time: 0.1s');
  process.exit(0);
}

console.log('🔄 Changes detected, building...');
const startTime = Date.now();

try {
  // Build parallel
  execSync('npm run build:super-fast', { 
    stdio: 'inherit',
    env: {
      ...process.env,
      NODE_OPTIONS: '--max-old-space-size=8192',
      GENERATE_SOURCEMAP: 'false',
      DISABLE_ESLINT_PLUGIN: 'true',
      FAST_REFRESH: 'false'
    }
  });
  
  saveCacheKey();
  const totalTime = ((Date.now() - startTime) / 1000).toFixed(1);
  console.log(`✅ Ultra fast build completed in ${totalTime}s!`);
  
} catch (error) {
  console.error('❌ Build failed:', error.message);
  process.exit(1);
}
