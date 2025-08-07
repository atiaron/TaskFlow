#!/usr/bin/env node

/**
 * 📊 HTML Report Generator
 * יוצר דוח HTML מפורט וצבעוני עם המלצות
 */

const fs = require('fs');

class HTMLReportGenerator {
  constructor(results) {
    this.results = results;
    this.timestamp = new Date().toISOString();
  }

  generateHTML() {
    return `
<!DOCTYPE html>
<html lang="he" dir="rtl">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>🚀 TaskFlow Health Check Report</title>
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }
        
        body {
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            min-height: 100vh;
            padding: 20px;
            color: #333;
        }
        
        .container {
            max-width: 1200px;
            margin: 0 auto;
            background: white;
            border-radius: 15px;
            box-shadow: 0 20px 60px rgba(0,0,0,0.1);
            overflow: hidden;
        }
        
        .header {
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            padding: 30px;
            text-align: center;
        }
        
        .header h1 {
            font-size: 2.5rem;
            margin-bottom: 10px;
            text-shadow: 2px 2px 4px rgba(0,0,0,0.3);
        }
        
        .header .subtitle {
            font-size: 1.2rem;
            opacity: 0.9;
        }
        
        .summary {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
            gap: 20px;
            padding: 30px;
            background: #f8f9fa;
        }
        
        .summary-card {
            background: white;
            padding: 20px;
            border-radius: 10px;
            text-align: center;
            box-shadow: 0 5px 15px rgba(0,0,0,0.08);
            transition: transform 0.3s ease;
        }
        
        .summary-card:hover {
            transform: translateY(-5px);
        }
        
        .summary-card .icon {
            font-size: 2rem;
            margin-bottom: 10px;
        }
        
        .summary-card .number {
            font-size: 2rem;
            font-weight: bold;
            margin-bottom: 5px;
        }
        
        .summary-card .label {
            color: #666;
            font-size: 0.9rem;
        }
        
        .passed { color: #28a745; }
        .warnings { color: #ffc107; }
        .failed { color: #dc3545; }
        .score { color: #6f42c1; }
        
        .sections {
            padding: 20px 30px;
        }
        
        .section {
            background: white;
            margin-bottom: 20px;
            border-radius: 10px;
            box-shadow: 0 2px 10px rgba(0,0,0,0.05);
            overflow: hidden;
        }
        
        .section-header {
            background: #f8f9fa;
            padding: 15px 20px;
            border-bottom: 1px solid #e9ecef;
            cursor: pointer;
            transition: background 0.3s ease;
        }
        
        .section-header:hover {
            background: #e9ecef;
        }
        
        .section-header h3 {
            margin: 0;
            display: flex;
            align-items: center;
            gap: 10px;
        }
        
        .section-content {
            padding: 20px;
        }
        
        .test-item {
            display: flex;
            align-items: center;
            gap: 15px;
            padding: 12px;
            border-radius: 8px;
            margin-bottom: 10px;
            transition: background 0.3s ease;
        }
        
        .test-item:hover {
            background: #f8f9fa;
        }
        
        .test-icon {
            font-size: 1.2rem;
            min-width: 20px;
        }
        
        .test-content {
            flex: 1;
        }
        
        .test-name {
            font-weight: 600;
            margin-bottom: 5px;
        }
        
        .test-message {
            color: #666;
            font-size: 0.9rem;
        }
        
        .test-details {
            margin-top: 10px;
            padding: 10px;
            background: #f8f9fa;
            border-radius: 5px;
            font-size: 0.85rem;
            color: #555;
        }
        
        .recommendations {
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            padding: 30px;
        }
        
        .recommendations h3 {
            margin-bottom: 20px;
            font-size: 1.5rem;
        }
        
        .recommendation-item {
            background: rgba(255,255,255,0.1);
            padding: 15px;
            border-radius: 8px;
            margin-bottom: 15px;
            backdrop-filter: blur(10px);
        }
        
        .recommendation-item h4 {
            margin-bottom: 8px;
            color: #fff;
        }
        
        .recommendation-item p {
            opacity: 0.9;
            line-height: 1.5;
        }
        
        .footer {
            background: #343a40;
            color: white;
            padding: 20px 30px;
            text-align: center;
        }
        
        .toggle-btn {
            background: none;
            border: none;
            color: inherit;
            font-size: 0.8rem;
            cursor: pointer;
            opacity: 0.7;
            transition: opacity 0.3s ease;
        }
        
        .toggle-btn:hover {
            opacity: 1;
        }
        
        .collapsible {
            max-height: 0;
            overflow: hidden;
            transition: max-height 0.3s ease;
        }
        
        .collapsible.expanded {
            max-height: 1000px;
        }
        
        @media (max-width: 768px) {
            .container {
                margin: 10px;
                border-radius: 10px;
            }
            
            .header {
                padding: 20px;
            }
            
            .header h1 {
                font-size: 2rem;
            }
            
            .summary {
                grid-template-columns: repeat(2, 1fr);
                padding: 20px;
                gap: 15px;
            }
            
            .sections {
                padding: 15px 20px;
            }
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>🚀 TaskFlow Health Check</h1>
            <div class="subtitle">דוח בדיקת מערכת מקיף • ${new Date().toLocaleDateString('he-IL')}</div>
        </div>
        
        ${this.generateSummary()}
        
        <div class="sections">
            ${this.generateSections()}
        </div>
        
        ${this.generateRecommendations()}
        
        <div class="footer">
            <p>נוצר על ידי TaskFlow Health Check System • ${this.timestamp}</p>
        </div>
    </div>
    
    <script>
        // Toggle section visibility
        document.querySelectorAll('.section-header').forEach(header => {
            header.addEventListener('click', () => {
                const content = header.nextElementSibling;
                content.classList.toggle('expanded');
                
                const btn = header.querySelector('.toggle-btn');
                btn.textContent = content.classList.contains('expanded') ? '▼' : '▶';
            });
        });
        
        // Auto-expand failed sections
        document.querySelectorAll('.section').forEach(section => {
            const hasErrors = section.querySelector('.test-item .failed');
            if (hasErrors) {
                const content = section.querySelector('.collapsible');
                const btn = section.querySelector('.toggle-btn');
                content.classList.add('expanded');
                btn.textContent = '▼';
            }
        });
    </script>
</body>
</html>`;
  }

  generateSummary() {
    const summary = this.results.summary || {};
    const healthScore = summary.healthScore || 0;
    
    return `
    <div class="summary">
        <div class="summary-card">
            <div class="icon">🎯</div>
            <div class="number score">${healthScore}%</div>
            <div class="label">ציון כללי</div>
        </div>
        <div class="summary-card">
            <div class="icon">✅</div>
            <div class="number passed">${summary.passed || 0}</div>
            <div class="label">בדיקות עברו</div>
        </div>
        <div class="summary-card">
            <div class="icon">⚠️</div>
            <div class="number warnings">${summary.warnings || 0}</div>
            <div class="label">אזהרות</div>
        </div>
        <div class="summary-card">
            <div class="icon">❌</div>
            <div class="number failed">${summary.failed || 0}</div>
            <div class="label">כשלונות</div>
        </div>
    </div>`;
  }

  generateSections() {
    const sections = this.groupTestsByCategory();
    
    return Object.entries(sections).map(([category, tests]) => {
      const categoryIcons = {
        'Bundle': '📦',
        'Firebase': '🔥',
        'Security': '🔒',
        'Performance': '⚡',
        'Build': '🏗️',
        'Deployment': '🚀'
      };
      
      const icon = categoryIcons[category] || '📋';
      
      return `
      <div class="section">
          <div class="section-header">
              <h3>
                  ${icon} ${category}
                  <button class="toggle-btn">▶</button>
              </h3>
          </div>
          <div class="section-content collapsible">
              ${tests.map(test => this.generateTestItem(test)).join('')}
          </div>
      </div>`;
    }).join('');
  }

  generateTestItem(test) {
    const statusIcons = {
      pass: '✅',
      fail: '❌', 
      warn: '⚠️',
      skip: 'ℹ️'
    };
    
    const statusClasses = {
      pass: 'passed',
      fail: 'failed',
      warn: 'warnings',
      skip: 'info'
    };
    
    const icon = statusIcons[test.status] || 'ℹ️';
    const cssClass = statusClasses[test.status] || 'info';
    
    const detailsHtml = test.details && Array.isArray(test.details) 
      ? `<div class="test-details">${test.details.join('<br>')}</div>`
      : '';
    
    return `
    <div class="test-item">
        <div class="test-icon ${cssClass}">${icon}</div>
        <div class="test-content">
            <div class="test-name">${test.name}</div>
            <div class="test-message">${test.message}</div>
            ${detailsHtml}
        </div>
    </div>`;
  }

  groupTestsByCategory() {
    const tests = this.results.tests || [];
    const categories = {};
    
    tests.forEach(test => {
      // Determine category from test name
      let category = 'Other';
      
      if (test.name.includes('Bundle') || test.name.includes('Large Files')) {
        category = 'Bundle';
      } else if (test.name.includes('Firebase') || test.name.includes('Firestore')) {
        category = 'Firebase';
      } else if (test.name.includes('Security') || test.name.includes('CSP') || test.name.includes('Secret')) {
        category = 'Security';
      } else if (test.name.includes('Performance') || test.name.includes('Web Vitals') || test.name.includes('Lighthouse')) {
        category = 'Performance';
      } else if (test.name.includes('Build') || test.name.includes('TypeScript') || test.name.includes('ESLint')) {
        category = 'Build';
      } else if (test.name.includes('Deployment') || test.name.includes('Vercel') || test.name.includes('GitIgnore')) {
        category = 'Deployment';
      }
      
      if (!categories[category]) {
        categories[category] = [];
      }
      categories[category].push(test);
    });
    
    return categories;
  }

  generateRecommendations() {
    const recommendations = this.getRecommendations();
    
    if (recommendations.length === 0) {
      return `
      <div class="recommendations">
          <h3>🎉 מעולה! אין המלצות נוספות</h3>
          <p>המערכת שלך במצב מצוין ואין בעיות דחופות לטיפול.</p>
      </div>`;
    }
    
    return `
    <div class="recommendations">
        <h3>💡 המלצות לשיפור</h3>
        ${recommendations.map(rec => `
        <div class="recommendation-item">
            <h4>${rec.title}</h4>
            <p>${rec.description}</p>
        </div>
        `).join('')}
    </div>`;
  }

  getRecommendations() {
    const recommendations = [];
    const tests = this.results.tests || [];
    
    // Bundle size recommendations
    const bundleIssues = tests.filter(t => t.name.includes('Bundle') && (t.status === 'fail' || t.status === 'warn'));
    if (bundleIssues.length > 0) {
      recommendations.push({
        title: '📦 אופטימיזציית גודל Bundle',
        description: 'מומלץ להטמיע Code Splitting, Lazy Loading ו-Tree Shaking כדי להקטין את גודל הקבצים.'
      });
    }
    
    // Security recommendations
    const securityIssues = tests.filter(t => (t.name.includes('Security') || t.name.includes('CSP')) && t.status === 'fail');
    if (securityIssues.length > 0) {
      recommendations.push({
        title: '🔒 שיפור אבטחה',
        description: 'מומלץ להוסיף Content Security Policy, לבדוק אם אין מידע רגיש בקוד ולעדכן חבילות עם פגיעויות ביטחון.'
      });
    }
    
    // Performance recommendations
    const perfIssues = tests.filter(t => (t.name.includes('Performance') || t.name.includes('Web Vitals')) && t.status === 'warn');
    if (perfIssues.length > 0) {
      recommendations.push({
        title: '⚡ שיפור ביצועים',
        description: 'מומלץ להוסיף Web Vitals monitoring, להטמיע React.memo ו-useCallback, ולהוסיף Service Worker.'
      });
    }
    
    // Firebase recommendations
    const firebaseIssues = tests.filter(t => t.name.includes('Firebase') && t.status === 'fail');
    if (firebaseIssues.length > 0) {
      recommendations.push({
        title: '🔥 תיקון תצורת Firebase',
        description: 'מומלץ לבדוק את כללי האבטחה של Firestore, להוסיף Indexes חסרים ולוודא שהגדרות ההגנה במקום.'
      });
    }
    
    return recommendations;
  }

  saveReport(outputPath = './health-report.html') {
    const html = this.generateHTML();
    fs.writeFileSync(outputPath, html, 'utf8');
    return outputPath;
  }
}

module.exports = { HTMLReportGenerator };
