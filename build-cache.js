// צור סקריפט cache חכם:
const fs = require('fs');
const crypto = require('crypto');
const path = require('path');

const CACHE_DIR = '.build-cache';
const CACHE_KEY_FILE = path.join(CACHE_DIR, 'cache-key.txt');

function generateCacheKey() {
  const packageJson = fs.readFileSync('package.json', 'utf8');
  const srcFiles = getAllTsFiles('src');
  const combinedContent = packageJson + srcFiles.join('');
  return crypto.createHash('md5').update(combinedContent).digest('hex');
}

function getAllTsFiles(dir) {
  const files = [];
  const items = fs.readdirSync(dir);
  
  items.forEach(item => {
    const fullPath = path.join(dir, item);
    if (fs.statSync(fullPath).isDirectory()) {
      files.push(...getAllTsFiles(fullPath));
    } else if (item.endsWith('.ts') || item.endsWith('.tsx')) {
      files.push(fs.readFileSync(fullPath, 'utf8'));
    }
  });
  
  return files;
}

function shouldRebuild() {
  if (!fs.existsSync(CACHE_DIR)) {
    fs.mkdirSync(CACHE_DIR);
    return true;
  }
  
  if (!fs.existsSync(CACHE_KEY_FILE)) {
    return true;
  }
  
  const currentKey = generateCacheKey();
  const cachedKey = fs.readFileSync(CACHE_KEY_FILE, 'utf8');
  
  return currentKey !== cachedKey;
}

function saveCacheKey() {
  const currentKey = generateCacheKey();
  fs.writeFileSync(CACHE_KEY_FILE, currentKey);
}

module.exports = { shouldRebuild, saveCacheKey };
