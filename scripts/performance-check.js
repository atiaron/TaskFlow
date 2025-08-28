#!/usr/bin/env node

/**
 * ⚡ Performance Analyzer
 * ניתוח ביצועים מקיף לאפליקציית TaskFlow
 */

const fs = require('fs');
const path = require('path');

class PerformanceAnalyzer {
  constructor() {
    this.results = [];
    this.metrics = {
      bundleSize: 0,
      loadTime: 0,
      memoryUsage: 0,
      optimizationScore: 0
    };
  }

  log(message, level = 'info') {
    const icons = {
      info: 'ℹ️',
      success: '✅',
      warning: '⚠️',
      error: '❌',
      performance: '⚡'
    };
    
    const colors = {
      info: '\x1b[36m',
      success: '\x1b[32m',
      warning: '\x1b[33m',
      error: '\x1b[31m',
      performance: '\x1b[35m',
      reset: '\x1b[0m'
    };

    console.log(`${colors[level]}${icons[level]} ${message}${colors.reset}`);
    this.results.push({ level, message, timestamp: new Date().toISOString() });
  }

  // 📦 ניתוח גודל Bundle
  async analyzeBundleSize() {
    this.log('📦 Analyzing bundle size...', 'performance');

    const buildPath = path.join(process.cwd(), 'build');
    if (!fs.existsSync(buildPath)) {
      this.log('Build directory not found. Run npm run build first.', 'error');
      return;
    }

    try {
      const staticPath = path.join(buildPath, 'static');
      let totalSize = 0;
      const fileSizes = {};

      const analyzePath = (dirPath, category) => {
        if (!fs.existsSync(dirPath)) return;
        
        const files = fs.readdirSync(dirPath);
        let categorySize = 0;
        
        files.forEach(file => {
          const filePath = path.join(dirPath, file);
          const stats = fs.statSync(filePath);
          
          if (stats.isFile()) {
            categorySize += stats.size;
            totalSize += stats.size;
          }
        });
        
        fileSizes[category] = categorySize;
        return categorySize;
      };

      // ניתוח קבצי JS
      const jsSize = analyzePath(path.join(staticPath, 'js'), 'JavaScript');
      const cssSize = analyzePath(path.join(staticPath, 'css'), 'CSS');
      const mediaSize = analyzePath(path.join(staticPath, 'media'), 'Media');

      this.metrics.bundleSize = totalSize;

      // המרה ליחידות קריאות
      const formatSize = (bytes) => {
        if (bytes === 0) return '0 B';
        const k = 1024;
        const sizes = ['B', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
      };

      this.log(`Total bundle size: ${formatSize(totalSize)}`, 'info');
      this.log(`JavaScript: ${formatSize(jsSize)}`, 'info');
      this.log(`CSS: ${formatSize(cssSize)}`, 'info');
      this.log(`Media: ${formatSize(mediaSize)}`, 'info');

      // סטנדרטים לבדיקה
      const maxBundleSize = 2 * 1024 * 1024; // 2MB
      const warnBundleSize = 1.5 * 1024 * 1024; // 1.5MB
      const maxJSSize = 1 * 1024 * 1024; // 1MB

      if (totalSize > maxBundleSize) {
        this.log(`🚨 Bundle too large: ${formatSize(totalSize)} (max recommended: ${formatSize(maxBundleSize)})`, 'error');
      } else if (totalSize > warnBundleSize) {
        this.log(`⚠️ Bundle size warning: ${formatSize(totalSize)} (consider optimization)`, 'warning');
      } else {
        this.log(`✅ Bundle size is optimal: ${formatSize(totalSize)}`, 'success');
      }

      if (jsSize > maxJSSize) {
        this.log(`⚠️ JavaScript bundle is large: ${formatSize(jsSize)} (consider code splitting)`, 'warning');
      } else {
        this.log(`✅ JavaScript bundle size is good: ${formatSize(jsSize)}`, 'success');
      }

      // ניתוח קבצים בודדים
      const jsPath = path.join(staticPath, 'js');
      if (fs.existsSync(jsPath)) {
        const jsFiles = fs.readdirSync(jsPath)
          .filter(file => file.endsWith('.js'))
          .map(file => {
            const filePath = path.join(jsPath, file);
            const stats = fs.statSync(filePath);
            return { name: file, size: stats.size };
          })
          .sort((a, b) => b.size - a.size);

        if (jsFiles.length > 0) {
          this.log(`Largest JS files:`, 'info');
          jsFiles.slice(0, 5).forEach(file => {
            this.log(`  ${file.name}: ${formatSize(file.size)}`, 'info');
          });
        }

        // בדיקת source maps
        const sourceMaps = jsFiles.filter(file => file.name.endsWith('.map'));
        if (sourceMaps.length > 0) {
          const sourceMapsSize = sourceMaps.reduce((sum, file) => sum + file.size, 0);
          this.log(`⚠️ Source maps found in production build: ${formatSize(sourceMapsSize)}`, 'warning');
        } else {
          this.log(`✅ No source maps in production build`, 'success');
        }
      }

    } catch (error) {
      this.log(`Error analyzing bundle: ${error.message}`, 'error');
    }
  }

  // 🚀 בדיקת אופטימיזציות Build
  async checkBuildOptimizations() {
    this.log('🚀 Checking build optimizations...', 'performance');

    try {
      const packagePath = path.join(process.cwd(), 'package.json');
      const packageJson = JSON.parse(fs.readFileSync(packagePath, 'utf8'));
      const scripts = packageJson.scripts || {};

      // בדיקת סקריפטי build מותאמים
      const optimizedScripts = Object.keys(scripts).filter(script => 
        script.includes('optimized') || script.includes('production') || script.includes('fast')
      );

      if (optimizedScripts.length > 0) {
        this.log(`✅ Found ${optimizedScripts.length} optimized build scripts: ${optimizedScripts.join(', ')}`, 'success');
      } else {
        this.log('⚠️ No optimized build scripts found', 'warning');
      }

      // בדיקת הגדרות environment variables
      const buildScript = scripts.build || '';
      const optimizations = [
        { name: 'Source Maps Disabled', pattern: 'GENERATE_SOURCEMAP=false', weight: 10 },
        { name: 'ESLint Disabled', pattern: 'DISABLE_ESLINT_PLUGIN=true', weight: 5 },
        { name: 'TypeScript Error Skip', pattern: 'TSC_COMPILE_ON_ERROR=true', weight: 5 },
        { name: 'Webpack Bundle Analyzer', pattern: 'ANALYZE=true', weight: 5 }
      ];

      let optimizationScore = 0;
      optimizations.forEach(opt => {
        if (buildScript.includes(opt.pattern) || Object.values(scripts).some(script => script.includes(opt.pattern))) {
          this.log(`✅ ${opt.name} enabled`, 'success');
          optimizationScore += opt.weight;
        } else {
          this.log(`⚠️ ${opt.name} not enabled`, 'warning');
        }
      });

      this.metrics.optimizationScore = optimizationScore;
      this.log(`Optimization score: ${optimizationScore}/25`, 'info');

      // בדיקת webpack config customizations
      const configFiles = [
        'craco.config.js',
        'config-overrides.js',
        'webpack.config.js'
      ];

      let hasCustomConfig = false;
      configFiles.forEach(configFile => {
        const configPath = path.join(process.cwd(), configFile);
        if (fs.existsSync(configPath)) {
          hasCustomConfig = true;
          this.log(`✅ Custom webpack config found: ${configFile}`, 'success');
          
          try {
            const configContent = fs.readFileSync(configPath, 'utf8');
            
            // בדיקת optimizations ספציפיים
            const webpackOptimizations = [
              { name: 'Tree Shaking', pattern: /usedExports|optimization.*tree/i },
              { name: 'Code Splitting', pattern: /splitChunks|chunks.*all/i },
              { name: 'Minification', pattern: /TerserPlugin|minimize.*true/i },
              { name: 'Compression', pattern: /CompressionPlugin|gzip/i }
            ];

            webpackOptimizations.forEach(opt => {
              if (opt.pattern.test(configContent)) {
                this.log(`✅ ${opt.name} configured`, 'success');
              } else {
                this.log(`⚠️ ${opt.name} not found`, 'warning');
              }
            });
            
          } catch (error) {
            this.log(`Error reading ${configFile}: ${error.message}`, 'error');
          }
        }
      });

      if (!hasCustomConfig) {
        this.log('ℹ️ No custom webpack configuration found', 'info');
      }

    } catch (error) {
      this.log(`Error checking build optimizations: ${error.message}`, 'error');
    }
  }

  // 🎯 בדיקת אופטימיזציות React
  async checkReactOptimizations() {
    this.log('🎯 Checking React optimizations...', 'performance');

    const srcPath = path.join(process.cwd(), 'src');
    if (!fs.existsSync(srcPath)) {
      this.log('Source directory not found', 'error');
      return;
    }

    const optimizations = {
      lazyLoading: 0,
      memoization: 0,
      useCallback: 0,
      useMemo: 0,
      reactMemo: 0,
      codesplitting: 0
    };

    const scanDirectory = (dir) => {
      const files = fs.readdirSync(dir);
      
      files.forEach(file => {
        const filePath = path.join(dir, file);
        
        if (fs.statSync(filePath).isDirectory() && !file.startsWith('.')) {
          scanDirectory(filePath);
        } else if (file.match(/\.(tsx?|jsx?)$/)) {
          try {
            const content = fs.readFileSync(filePath, 'utf8');
            
            // בדיקת אופטימיזציות שונות
            if (content.includes('React.lazy') || content.includes('lazy(')) {
              optimizations.lazyLoading++;
            }
            
            if (content.includes('useCallback')) {
              optimizations.useCallback++;
            }
            
            if (content.includes('useMemo')) {
              optimizations.useMemo++;
            }
            
            if (content.includes('React.memo') || content.includes('memo(')) {
              optimizations.reactMemo++;
            }
            
            if (content.includes('import(')) {
              optimizations.codesplitting++;
            }
            
          } catch (error) {
            // Ignore read errors
          }
        }
      });
    };

    scanDirectory(srcPath);

    // דוח על האופטימיזציות
    this.log('React optimizations found:', 'info');
    
    if (optimizations.lazyLoading > 0) {
      this.log(`✅ Lazy loading: ${optimizations.lazyLoading} instances`, 'success');
    } else {
      this.log('⚠️ No lazy loading found - consider for large components', 'warning');
    }
    
    if (optimizations.useCallback > 0) {
      this.log(`✅ useCallback: ${optimizations.useCallback} instances`, 'success');
    } else {
      this.log('ℹ️ No useCallback found', 'info');
    }
    
    if (optimizations.useMemo > 0) {
      this.log(`✅ useMemo: ${optimizations.useMemo} instances`, 'success');
    } else {
      this.log('ℹ️ No useMemo found', 'info');
    }
    
    if (optimizations.reactMemo > 0) {
      this.log(`✅ React.memo: ${optimizations.reactMemo} instances`, 'success');
    } else {
      this.log('⚠️ No React.memo found - consider for pure components', 'warning');
    }
    
    if (optimizations.codeSpitting > 0) {
      this.log(`✅ Dynamic imports: ${optimizations.codeSpitting} instances`, 'success');
    } else {
      this.log('⚠️ No dynamic imports found - consider for route-based splitting', 'warning');
    }

    // חישוב ציון אופטימיזציה
    const totalOptimizations = Object.values(optimizations).reduce((sum, count) => sum + count, 0);
    this.log(`Total React optimizations: ${totalOptimizations}`, 'info');
  }

  // 📊 בדיקת Web Vitals ו-Performance Monitoring
  async checkPerformanceMonitoring() {
    this.log('📊 Checking performance monitoring...', 'performance');

    try {
      // בדיקת Web Vitals
      const packagePath = path.join(process.cwd(), 'package.json');
      const packageJson = JSON.parse(fs.readFileSync(packagePath, 'utf8'));
      const allDeps = { ...packageJson.dependencies, ...packageJson.devDependencies };

      if (allDeps['web-vitals']) {
        this.log(`✅ Web Vitals package installed: ${allDeps['web-vitals']}`, 'success');
        
        // בדיקת implementation
        const indexPath = path.join(process.cwd(), 'src', 'index.tsx');
        if (fs.existsSync(indexPath)) {
          const indexContent = fs.readFileSync(indexPath, 'utf8');
          if (indexContent.includes('reportWebVitals') || indexContent.includes('web-vitals')) {
            this.log('✅ Web Vitals properly implemented', 'success');
          } else {
            this.log('⚠️ Web Vitals not implemented in index.tsx', 'warning');
          }
        }
      } else {
        this.log('⚠️ Web Vitals package not installed', 'warning');
      }

      // בדיקת Lighthouse script
      const scripts = packageJson.scripts || {};
      if (scripts.lighthouse || Object.values(scripts).some(script => script.includes('lighthouse'))) {
        this.log('✅ Lighthouse script available', 'success');
      } else {
        this.log('⚠️ No Lighthouse script found', 'warning');
      }

      // בדיקת Performance Monitoring services
      const perfServices = [
        'sentry',
        '@sentry/react',
        'new-relic',
        'datadog',
        'bugsnag'
      ];

      let hasPerfMonitoring = false;
      perfServices.forEach(service => {
        if (allDeps[service]) {
          hasPerfMonitoring = true;
          this.log(`✅ Performance monitoring service: ${service}`, 'success');
        }
      });

      if (!hasPerfMonitoring) {
        this.log('ℹ️ No external performance monitoring service found', 'info');
      }

      // בדיקת Analytics
      const analyticsServices = [
        'google-analytics',
        'gtag',
        '@google-analytics/gtag',
        'react-ga'
      ];

      let hasAnalytics = false;
      analyticsServices.forEach(service => {
        if (allDeps[service]) {
          hasAnalytics = true;
          this.log(`✅ Analytics service: ${service}`, 'success');
        }
      });

      if (!hasAnalytics) {
        this.log('ℹ️ No analytics service found', 'info');
      }

    } catch (error) {
      this.log(`Error checking performance monitoring: ${error.message}`, 'error');
    }
  }

  // 🔧 בדיקת אופטימיזציות Assets
  async checkAssetOptimizations() {
    this.log('🔧 Checking asset optimizations...', 'performance');

    const publicPath = path.join(process.cwd(), 'public');
    const buildPath = path.join(process.cwd(), 'build');

    for (const checkPath of [publicPath, buildPath]) {
      if (!fs.existsSync(checkPath)) continue;

      const pathName = path.basename(checkPath);
      this.log(`Analyzing ${pathName} directory:`, 'info');

      // בדיקת Service Worker
      const swPath = path.join(checkPath, 'sw.js');
      if (fs.existsSync(swPath)) {
        this.log(`✅ Service Worker found in ${pathName}`, 'success');
      } else {
        this.log(`ℹ️ No Service Worker in ${pathName}`, 'info');
      }

      // בדיקת PWA Manifest
      const manifestPath = path.join(checkPath, 'manifest.json');
      if (fs.existsSync(manifestPath)) {
        this.log(`✅ PWA Manifest found in ${pathName}`, 'success');
        
        try {
          const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
          
          const requiredFields = ['name', 'short_name', 'start_url', 'display', 'theme_color', 'background_color'];
          const missingFields = requiredFields.filter(field => !manifest[field]);
          
          if (missingFields.length === 0) {
            this.log('✅ PWA Manifest has all required fields', 'success');
          } else {
            this.log(`⚠️ PWA Manifest missing fields: ${missingFields.join(', ')}`, 'warning');
          }
          
          if (manifest.icons && manifest.icons.length > 0) {
            this.log(`✅ PWA Manifest has ${manifest.icons.length} icons`, 'success');
          } else {
            this.log('⚠️ PWA Manifest has no icons', 'warning');
          }
          
        } catch (error) {
          this.log(`Error reading manifest.json: ${error.message}`, 'error');
        }
      } else {
        this.log(`ℹ️ No PWA Manifest in ${pathName}`, 'info');
      }

      // בדיקת Icons directory
      const iconsPath = path.join(checkPath, 'icons');
      if (fs.existsSync(iconsPath)) {
        const iconFiles = fs.readdirSync(iconsPath);
        this.log(`✅ Icons directory found with ${iconFiles.length} files`, 'success');
      }

      // בדיקת robots.txt
      const robotsPath = path.join(checkPath, 'robots.txt');
      if (fs.existsSync(robotsPath)) {
        this.log(`✅ robots.txt found in ${pathName}`, 'success');
      } else {
        this.log(`⚠️ No robots.txt in ${pathName}`, 'warning');
      }

      // בדיקת sitemap.xml
      const sitemapPath = path.join(checkPath, 'sitemap.xml');
      if (fs.existsSync(sitemapPath)) {
        this.log(`✅ sitemap.xml found in ${pathName}`, 'success');
      } else {
        this.log(`ℹ️ No sitemap.xml in ${pathName}`, 'info');
      }
    }

    // בדיקת Image optimizations
    const imageExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.svg', '.webp'];
    let totalImages = 0;
    let optimizedImages = 0;

    const checkImages = (dir) => {
      if (!fs.existsSync(dir)) return;
      
      const files = fs.readdirSync(dir);
      files.forEach(file => {
        const filePath = path.join(dir, file);
        const ext = path.extname(file).toLowerCase();
        
        if (fs.statSync(filePath).isDirectory()) {
          checkImages(filePath);
        } else if (imageExtensions.includes(ext)) {
          totalImages++;
          
          if (ext === '.webp' || ext === '.svg') {
            optimizedImages++;
          }
        }
      });
    };

    checkImages(publicPath);
    checkImages(path.join(process.cwd(), 'src'));

    if (totalImages > 0) {
      const optimizationRatio = (optimizedImages / totalImages * 100).toFixed(1);
      this.log(`Images: ${totalImages} total, ${optimizedImages} optimized (${optimizationRatio}%)`, 'info');
      
      if (optimizationRatio > 50) {
        this.log('✅ Good image optimization ratio', 'success');
      } else {
        this.log('⚠️ Consider converting images to WebP format', 'warning');
      }
    }
  }

  // 🎯 הפעלת כל בדיקות הביצועים
  async runPerformanceAnalysis() {
    console.log('⚡ Starting Performance Analysis...\n');

    await this.analyzeBundleSize();
    await this.checkBuildOptimizations();
    await this.checkReactOptimizations();
    await this.checkPerformanceMonitoring();
    await this.checkAssetOptimizations();

    // חישוב ציון ביצועים כללי
    let performanceScore = 100;
    const issues = this.results.filter(r => r.level === 'error').length;
    const warnings = this.results.filter(r => r.level === 'warning').length;
    const successes = this.results.filter(r => r.level === 'success').length;

    performanceScore -= issues * 15;
    performanceScore -= warnings * 5;
    performanceScore = Math.max(0, performanceScore);

    let performanceLevel, color;
    if (performanceScore >= 90) {
      performanceLevel = 'Excellent';
      color = '\x1b[32m';
    } else if (performanceScore >= 75) {
      performanceLevel = 'Good';
      color = '\x1b[32m';
    } else if (performanceScore >= 60) {
      performanceLevel = 'Fair';
      color = '\x1b[33m';
    } else {
      performanceLevel = 'Poor';
      color = '\x1b[31m';
    }

    console.log(`\n⚡ Performance Analysis Summary:`);
    console.log(`✅ Optimizations: ${successes}`);
    console.log(`⚠️  Warnings: ${warnings}`);
    console.log(`❌ Issues: ${issues}`);
    console.log(`\n${color}⚡ Performance Score: ${performanceScore}/100 (${performanceLevel})\x1b[0m`);

    // המלצות לשיפור
    if (performanceScore < 90) {
      console.log('\n💡 Performance Improvement Recommendations:');
      
      if (this.metrics.bundleSize > 1.5 * 1024 * 1024) {
        console.log('   • Implement code splitting for large components');
        console.log('   • Enable tree shaking in webpack configuration');
        console.log('   • Consider lazy loading for non-critical components');
      }
      
      if (warnings > 5) {
        console.log('   • Implement React.memo for pure components');
        console.log('   • Add useCallback and useMemo for expensive operations');
        console.log('   • Convert images to WebP format');
      }
      
      console.log('   • Add service worker for caching');
      console.log('   • Implement performance monitoring (Web Vitals)');
      console.log('   • Run Lighthouse audit for detailed insights');
    }

    return {
      score: performanceScore,
      level: performanceLevel,
      issues,
      warnings,
      successes,
      metrics: this.metrics,
      results: this.results
    };
  }
}

// Run if called directly
if (require.main === module) {
  const analyzer = new PerformanceAnalyzer();
  analyzer.runPerformanceAnalysis().catch(error => {
    console.error('Performance analysis failed:', error);
    process.exit(1);
  });
}

module.exports = { PerformanceAnalyzer };
