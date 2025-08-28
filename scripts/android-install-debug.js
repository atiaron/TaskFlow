#!/usr/bin/env node
/**
 * Smart debug APK installer.
 * 1. Verifies APK exists.
 * 2. Locates adb (PATH, ANDROID_HOME, Program Files). If not found, prints guidance.
 * 3. Lists devices. If none, instructs user to connect & enable USB debugging.
 * 4. Installs (adb install -r) and reports success.
 */
const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const apkPath = path.join('frontend','android','app','build','outputs','apk','debug','app-debug.apk');

function log(msg){console.log('[android-install]', msg);} 
function err(msg){console.error('[android-install][ERROR]', msg);} 

if(!fs.existsSync(apkPath)){
  err('APK not found at ' + apkPath + ' — run: npm run android:build:debug');
  process.exit(1);
}

function findAdb(){
  // 1. PATH direct
  try { execSync('adb version', { stdio:'ignore' }); return 'adb'; } catch(e) {}
  const guesses = [];
  const envs = [process.env.ANDROID_HOME, process.env.ANDROID_SDK_ROOT];
  envs.filter(Boolean).forEach(base=>{
    guesses.push(path.join(base,'platform-tools','adb.exe'));
  });
  // Local project fetched tools
  guesses.push(path.join(__dirname,'..','tools','platform-tools','adb.exe'));
  guesses.push('C://Android//platform-tools//adb.exe');
  guesses.push('C://Program Files//Android//platform-tools//adb.exe');
  for(const g of guesses){
    if(fs.existsSync(g)) return '"' + g + '"';
  }
  return null;
}

const adb = findAdb();
if(!adb){
  err('adb not found. התקן Platform Tools: https://developer.android.com/studio/releases/platform-tools והוסף ל-PATH');
  process.exit(2);
}

function run(cmd){
  log('> ' + cmd);
  return execSync(cmd, { stdio:'pipe' }).toString();
}

let devicesOut;
try { devicesOut = run(adb + ' devices'); } catch(e){ err('Failed running adb devices'); process.exit(3);} 
log('\n' + devicesOut.trim());
const lines = devicesOut.split(/\r?\n/).slice(1).filter(l=>l.trim());
const attached = lines.filter(l=>/\bdevice\b/.test(l));
if(attached.length === 0){
  err('No connected devices. חבר מכשיר, אפשר USB Debugging, ואשר fingerprint. ואז תריץ שוב: npm run android:smart-install');
  process.exit(4);
}

log('Found device(s): ' + attached.map(l=>l.split('\t')[0]).join(', '));
log('Installing APK...');
try {
  const out = run(adb + ' install -r ' + apkPath.replace(/\\/g,'/'));
  log(out.trim());
  if(/Success/i.test(out)){
    log('✅ הותקן בהצלחה על המכשיר. בדוק במסך האפליקציות: TaskFlow');
  } else {
    err('Install output did not contain Success.');
  }
} catch(e){
  err('Installation failed: ' + e.message);
  process.exit(5);
}
