#!/usr/bin/env node
/**
 * Fetch Android Platform Tools (Windows) locally into tools/platform-tools
 * so we can use adb without global install.
 */
const https = require('https');
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const ZIP_URL = 'https://dl.google.com/android/repository/platform-tools-latest-windows.zip';
const DEST_DIR = path.join(__dirname, '..', 'tools');
const ZIP_PATH = path.join(DEST_DIR, 'platform-tools.zip');
const TARGET_DIR = path.join(DEST_DIR, 'platform-tools');

function log(m){ console.log('[fetch-platform-tools]', m); }
function err(m){ console.error('[fetch-platform-tools][ERROR]', m); }

(async function run(){
  try {
    if(!fs.existsSync(DEST_DIR)) fs.mkdirSync(DEST_DIR, { recursive: true });
    if(fs.existsSync(path.join(TARGET_DIR,'adb.exe'))){
      log('Already present: ' + TARGET_DIR);
      process.exit(0);
    }
    log('Downloading platform tools...');
    await new Promise((resolve, reject)=>{
      const file = fs.createWriteStream(ZIP_PATH);
      https.get(ZIP_URL, res => {
        if(res.statusCode !== 200){
          reject(new Error('HTTP ' + res.statusCode)); return;
        }
        res.pipe(file);
        file.on('finish', ()=> file.close(resolve));
      }).on('error', reject);
    });
    log('Download complete. Extracting...');
    // Use PowerShell Expand-Archive (Windows) if unzip not available
    const psCmd = `powershell -Command "Expand-Archive -Force -Path '${ZIP_PATH}' -DestinationPath '${DEST_DIR}'"`;
    execSync(psCmd, { stdio: 'inherit' });
    if(!fs.existsSync(path.join(TARGET_DIR,'adb.exe'))){
      throw new Error('adb.exe not found after extraction');
    }
    log('Extraction done. adb at: ' + path.join(TARGET_DIR,'adb.exe'));
    log('You can now run: npm run android:smart-install');
  } catch(e){
    err(e.message);
    process.exit(1);
  }
})();
