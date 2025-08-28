const os = require('os');
const fs = require('fs');
const path = require('path');

console.log('🚀 RAM and SSD Optimization Script');
console.log('====================================');

// Check system specifications
const totalRAM = os.totalmem() / (1024 * 1024 * 1024); // Convert to GB
const freeRAM = os.freemem() / (1024 * 1024 * 1024);
const cpuCores = os.cpus().length;

console.log(`💾 Total RAM: ${totalRAM.toFixed(2)} GB`);
console.log(`🆓 Free RAM: ${freeRAM.toFixed(2)} GB`);
console.log(`⚡ CPU Cores: ${cpuCores}`);

// Optimize Node.js memory based on available RAM
let optimalMemory;
if (totalRAM >= 32) {
  optimalMemory = 16384; // 16GB for high-end systems
} else if (totalRAM >= 16) {
  optimalMemory = 8192;  // 8GB for mid-range systems
} else if (totalRAM >= 8) {
  optimalMemory = 4096;  // 4GB for lower-end systems
} else {
  optimalMemory = 2048;  // 2GB for minimal systems
}

console.log(`🎯 Recommended Node.js memory: ${optimalMemory}MB`);

// Update environment for current session
process.env.NODE_OPTIONS = `--max-old-space-size=${optimalMemory}`;

// Create optimized build script
const optimizedBuildScript = `
# Optimized Build Script - Auto-generated
export NODE_OPTIONS="--max-old-space-size=${optimalMemory}"
export UV_THREADPOOL_SIZE=${cpuCores * 2}
export NODE_ENV=production

echo "🚀 Starting optimized build with ${optimalMemory}MB memory..."
echo "⚡ Using ${cpuCores * 2} threads..."

npm run build:super-fast
`;

// Write optimized script for Unix/Linux
fs.writeFileSync(path.join(__dirname, 'optimized-build.sh'), optimizedBuildScript);

// Create Windows batch file
const windowsBuildScript = `@echo off
set NODE_OPTIONS=--max-old-space-size=${optimalMemory}
set UV_THREADPOOL_SIZE=${cpuCores * 2}
set NODE_ENV=production

echo 🚀 Starting optimized build with ${optimalMemory}MB memory...
echo ⚡ Using ${cpuCores * 2} threads...

npm run build:super-fast
`;

fs.writeFileSync(path.join(__dirname, 'optimized-build.bat'), windowsBuildScript);

console.log('✅ Optimization complete!');
console.log('📁 Generated files:');
console.log('   - scripts/optimized-build.sh');
console.log('   - scripts/optimized-build.bat');
console.log('');
console.log('🚀 To use optimized build:');
console.log('   Windows: npm run scripts/optimized-build.bat');
console.log('   Unix/Linux: npm run scripts/optimized-build.sh');

// SSD Optimization tips
console.log('');
console.log('💽 SSD Optimization Tips:');
console.log('1. Ensure node_modules is on SSD (not HDD)');
console.log('2. Build output directory should be on fastest drive');
console.log('3. Consider disabling Windows indexing for project folder');
console.log('4. Use Windows fast startup and hibernate for faster boot');

// Check if running on SSD
try {
  const projectPath = path.resolve(__dirname, '..');
  console.log(`📂 Project location: ${projectPath}`);
  
  // Basic check for SSD indicators (Windows)
  if (process.platform === 'win32') {
    console.log('💡 For SSD verification on Windows, run: "Get-PhysicalDisk | Get-StorageReliabilityCounter"');
  }
} catch (error) {
  console.log('⚠️  Could not determine storage type');
}

module.exports = {
  optimalMemory,
  cpuCores,
  totalRAM: totalRAM.toFixed(2),
  freeRAM: freeRAM.toFixed(2)
};
