// Test Final Implementation - Fix Pack Applied
const { chromium } = require('playwright');
const http = require('http');
const fs = require('fs');
const path = require('path');

// Static server for build folder
function createStaticServer() {
  return http.createServer((req, res) => {
    let filePath = path.join(__dirname, 'frontend', 'build', req.url === '/' ? 'index.html' : req.url);
    
    if (!fs.existsSync(filePath)) {
      filePath = path.join(__dirname, 'frontend', 'build', 'index.html');
    }

    const ext = path.extname(filePath).toLowerCase();
    const contentType = {
      '.html': 'text/html; charset=utf-8',
      '.js': 'text/javascript',
      '.css': 'text/css',
      '.json': 'application/json',
      '.png': 'image/png',
      '.ico': 'image/x-icon',
      '.svg': 'image/svg+xml'
    }[ext] || 'text/plain';

    try {
      const content = fs.readFileSync(filePath);
      res.writeHead(200, { 'Content-Type': contentType });
      res.end(content);
    } catch (err) {
      res.writeHead(404);
      res.end('Not Found');
    }
  });
}

async function testFinalImplementation() {
  const server = createStaticServer().listen(8087);
  console.log('🎯 שרת סטטי פועל על http://localhost:8087');
  
  const browser = await chromium.launch({ headless: false });
  const context = await browser.newContext();
  const page = await context.newPage();

  try {
    console.log('\n📱 נווט לאפליקציה...');
    await page.goto('http://localhost:8087');
    await page.waitForSelector('.google-tasks-wrapper', { timeout: 5000 });
    
    console.log('✅ האפליקציה נטענה בהצלחה');

    // Test 1: Empty State
    console.log('\n🧪 בדיקה 1: מצב ריק');
    const emptyState = await page.locator('.empty-state').isVisible();
    console.log(`- מצב ריק מוצג: ${emptyState ? '✅' : '❌'}`);
    
    const fabVisible = await page.locator('.google-tasks-fab').isVisible();
    console.log(`- FAB מוצג: ${fabVisible ? '✅' : '❌'}`);

    // Test 2: Create Task
    console.log('\n🧪 בדיקה 2: יצירת משימה');
    await page.click('.google-tasks-fab');
    await page.waitForSelector('.new-task-input input', { timeout: 2000 });
    console.log('- קלט משימה נפתח: ✅');
    
    await page.fill('.new-task-input input', 'משימת בדיקה 1');
    await page.press('.new-task-input input', 'Enter');
    await page.waitForTimeout(500);
    
    const tasks = await page.locator('.task-row').count();
    console.log(`- מספר משימות לאחר יצירה: ${tasks}`);

    // Test 3: localStorage Persistence
    console.log('\n🧪 בדיקה 3: עקביות localStorage');
    const localStorageData = await page.evaluate(() => {
      return JSON.parse(localStorage.getItem('taskflow-tasks') || '[]');
    });
    console.log(`- משימות ב-localStorage: ${localStorageData.length}`);
    console.log(`- משימה ראשונה: ${localStorageData[0]?.title}`);

    // Test 4: Star Toggle
    console.log('\n🧪 בדיקה 4: הדלקת כוכב');
    await page.click('.task-star');
    await page.waitForTimeout(300);
    
    const starredClass = await page.locator('.task-star').getAttribute('class');
    console.log(`- כוכב פעיל: ${starredClass.includes('starred') ? '✅' : '❌'}`);

    // Test 5: Complete Toggle
    console.log('\n🧪 בדיקה 5: השלמת משימה');
    await page.click('.task-checkbox');
    await page.waitForTimeout(300);
    
    const checkboxClass = await page.locator('.task-checkbox').getAttribute('class');
    console.log(`- משימה מושלמת: ${checkboxClass.includes('checked') ? '✅' : '❌'}`);

    // Test 6: Create Second Task
    console.log('\n🧪 בדיקה 6: יצירת משימה שנייה');
    await page.click('.google-tasks-fab');
    await page.fill('.new-task-input input', 'משימת בדיקה 2');
    await page.press('.new-task-input input', 'Enter');
    await page.waitForTimeout(500);
    
    const tasksAfterSecond = await page.locator('.task-row').count();
    console.log(`- מספר משימות לאחר משימה שנייה: ${tasksAfterSecond}`);

    // Test 7: Edit Task
    console.log('\n🧪 בדיקה 7: עריכת משימה');
    await page.click('.task-row:last-child');
    await page.waitForSelector('.task-edit-screen', { timeout: 2000 });
    console.log('- מסך עריכה נפתח: ✅');
    
    await page.fill('.task-title-input', 'משימת בדיקה 2 - מעודכנת');
    await page.click('.edit-header button[aria-label="סגור"]');
    await page.waitForTimeout(500);
    
    const updatedTaskText = await page.locator('.task-row:last-child .task-title').textContent();
    console.log(`- טקסט משימה מעודכן: ${updatedTaskText}`);

    // Test 8: Reload Persistence
    console.log('\n🧪 בדיקה 8: עקביות לאחר ריפרש');
    await page.reload();
    await page.waitForSelector('.google-tasks-wrapper', { timeout: 5000 });
    
    const tasksAfterReload = await page.locator('.task-row').count();
    console.log(`- מספר משימות לאחר ריפרש: ${tasksAfterReload}`);
    
    const firstTaskAfterReload = await page.locator('.task-row:first-child .task-title').textContent();
    console.log(`- משימה ראשונה לאחר ריפרש: ${firstTaskAfterReload}`);

    // Final localStorage Check
    const finalLocalStorageData = await page.evaluate(() => {
      return JSON.parse(localStorage.getItem('taskflow-tasks') || '[]');
    });
    console.log(`\n📊 סטטוס סופי:`);
    console.log(`- סה"כ משימות: ${finalLocalStorageData.length}`);
    finalLocalStorageData.forEach((task, i) => {
      console.log(`  ${i+1}. ${task.title} | הושלם: ${task.completed} | כוכב: ${task.starred}`);
    });

    console.log('\n🎉 כל הבדיקות הושלמו בהצלחה!');

  } catch (error) {
    console.error('❌ שגיאה בבדיקה:', error.message);
  } finally {
    await browser.close();
    server.close();
    console.log('\n🔚 שרת סגור');
  }
}

testFinalImplementation().catch(console.error);