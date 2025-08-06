const { Worker, isMainThread, parentPort, workerData } = require('worker_threads');
const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

if (isMainThread) {
  console.log('🚀 Starting Parallel TypeScript Checking...');
  const startTime = Date.now();
  
  const srcFiles = getAllTsFiles('src');
  console.log(`📁 Found ${srcFiles.length} TypeScript files`);
  
  const chunks = chunkArray(srcFiles, 4); // 4 workers
  console.log(`⚡ Using ${chunks.length} parallel workers`);
  
  Promise.all(chunks.map((chunk, index) => {
    return new Promise((resolve, reject) => {
      console.log(`🔄 Worker ${index + 1} checking ${chunk.length} files...`);
      const worker = new Worker(__filename, { workerData: { chunk, workerId: index + 1 } });
      
      worker.on('message', (result) => {
        if (result.error) {
          console.error(`❌ Worker ${result.workerId} found error in ${result.file}:`);
          console.error(result.error);
          reject(new Error(`TypeScript error in ${result.file}`));
        } else {
          console.log(`✅ Worker ${result.workerId} completed successfully (${result.filesChecked} files)`);
          resolve(result);
        }
      });
      
      worker.on('error', (error) => {
        console.error(`❌ Worker ${index + 1} failed:`, error.message);
        reject(error);
      });
    });
  })).then((results) => {
    const totalFiles = results.reduce((sum, result) => sum + result.filesChecked, 0);
    const totalTime = ((Date.now() - startTime) / 1000).toFixed(1);
    
    console.log('✅ All TypeScript files checked successfully!');
    console.log(`📊 Results: ${totalFiles} files checked in ${totalTime}s`);
    console.log(`⚡ Performance: ${(totalFiles / totalTime).toFixed(1)} files/second`);
    
    process.exit(0);
  }).catch((error) => {
    console.error('❌ TypeScript checking failed:', error.message);
    process.exit(1);
  });
  
} else {
  // Worker code
  const { chunk, workerId } = workerData;
  let filesChecked = 0;
  
  try {
    for (const file of chunk) {
      try {
        execSync(`npx tsc ${file} --noEmit --skipLibCheck`, { 
          stdio: 'pipe',
          timeout: 30000 // 30 second timeout per file
        });
        filesChecked++;
      } catch (error) {
        parentPort.postMessage({ 
          error: error.message, 
          file, 
          workerId 
        });
        return;
      }
    }
    
    parentPort.postMessage({ 
      success: true, 
      filesChecked, 
      workerId 
    });
    
  } catch (error) {
    parentPort.postMessage({ 
      error: error.message, 
      workerId 
    });
  }
}

function getAllTsFiles(dir) {
  const files = [];
  
  try {
    const items = fs.readdirSync(dir);
    
    items.forEach(item => {
      const fullPath = path.join(dir, item);
      
      try {
        const stat = fs.statSync(fullPath);
        
        if (stat.isDirectory()) {
          // Skip node_modules and other build directories
          if (!['node_modules', 'build', 'dist', '.git', '.next'].includes(item)) {
            files.push(...getAllTsFiles(fullPath));
          }
        } else if (item.endsWith('.ts') || item.endsWith('.tsx')) {
          // Skip declaration files and test files for faster checking
          if (!item.endsWith('.d.ts') && !item.includes('.test.') && !item.includes('.spec.')) {
            files.push(fullPath);
          }
        }
      } catch (statError) {
        // Skip files that can't be accessed
        console.warn(`⚠️  Skipping ${fullPath}: ${statError.message}`);
      }
    });
  } catch (readError) {
    console.warn(`⚠️  Cannot read directory ${dir}: ${readError.message}`);
  }
  
  return files;
}

function chunkArray(array, chunkSize) {
  const chunks = [];
  for (let i = 0; i < array.length; i += chunkSize) {
    chunks.push(array.slice(i, i + chunkSize));
  }
  return chunks;
}

module.exports = {
  getAllTsFiles,
  chunkArray
};
