// frontend/scripts/collect-evidence.js
// Evidence Collector: יצירת 3 צילומים + 2 JSON (Storage + Geometry/Edit+Sheet)
const fs = require('fs');
const path = require('path');
const { chromium, devices } = require('playwright');

const iPhoneSE = devices['iPhone SE'];

const ART_DIR = path.resolve(process.cwd(), 'artifacts');
const HOST = process.env.EVIDENCE_URL || 'http://localhost:3000';

async function ensureDir(dir) {
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
}

async function storageAudit(page) {
  return await page.evaluate(() => {
    const KEY = 'taskflow_tasks';
    return {
      keys: Object.keys(localStorage).filter(k => /taskflow|tasks/i.test(k)),
      sample: (JSON.parse(localStorage.getItem(KEY) || '[]') || [])
        .slice(0, 3)
        .map(t => ({
          id: t.id, title: t.title,
          completed: !!t.completed, starred: !!t.starred,
          order: t.order, updatedAt: t.updatedAt
        }))
    };
  });
}

async function batchGeometry(page) {
  return await page.evaluate(() => {
    const w = document.querySelector('.google-tasks-wrapper');
    if (!w) return 'wrapper not found';
    const rw = w.getBoundingClientRect();
    return ['.task-edit-screen', '.bottom-sheet'].map(sel => {
      const n = document.querySelector(sel);
      if (!n) return { sel, found: false };
      const r = n.getBoundingClientRect();
      return {
        sel, found: true,
        dx: Math.round(r.left - rw.left),
        dy: Math.round(r.top - rw.top),
        dw: Math.round(r.width - rw.width),
        dh: Math.round(r.height - rw.height)
      };
    });
  });
}

// עוזר קטן: יצירת משימה אם אין מספיק (פשוט יותר)
async function ensureAtLeastTwoTasks(page) {
  await page.waitForSelector('.google-tasks-wrapper', { timeout: 15000 });

  const count = await page.locator('.task-row').count();
  console.log(`Found ${count} existing tasks`);
  
  // אם יש כבר משימות - נשתמש בהן
  if (count >= 1) return;

  // אם אין משימות בכלל - ננסה ליצור (אבל לא נפסיל אם נכשל)
  try {
    const fab = page.locator('.fab, .google-tasks-fab, button');
    if (await fab.count()) {
      await fab.first().click();
      await page.waitForTimeout(1000); // חכה שהאינפוט יופיע
    }
    
    // ננסה למצוא אינפוט פשוט
    const input = page.locator('input[type="text"], input[placeholder*="משימה"], textarea').first();
    if (await input.count()) {
      await input.fill('משימת בדיקה');
      await page.keyboard.press('Enter');
      await page.waitForTimeout(1000);
    }
  } catch (e) {
    console.log('Could not create tasks, continuing with existing ones:', e.message);
  }
}

async function openEdit(page) {
  const text = page.locator('.task-row .task-text').first();
  await text.click();                   // פותח עריכה
  await page.waitForSelector('.task-edit-screen', { timeout: 10000 });
}

async function closeEdit(page) {
  const backBtn = page.locator('.edit-header .edit-icon-btn').first();
  if (await backBtn.count()) {
    await backBtn.click();
    await page.waitForSelector('.task-edit-screen', { state: 'detached', timeout: 10000 });
  }
}

async function openBottomSheet(page) {
  const selector = [
    'button[aria-label*="תפריט"]',
    '.google-tasks-icon-button[aria-label*="תפריט"]',
    'button[aria-label*="menu"]',
    'button:has-text("⋮")',
    '.google-tasks-list-controls button'
  ].join(', ');
  const menuBtn = page.locator(selector).first();
  await menuBtn.click();
  await page.waitForSelector('.bottom-sheet', { timeout: 10000 });
}

(async () => {
  await ensureDir(ART_DIR);

  const headless = !process.env.HEADFUL;
  const browser = await chromium.launch({ headless, slowMo: process.env.SLOWMO ? Number(process.env.SLOWMO) : undefined });
  const ctx = await browser.newContext({
    ...iPhoneSE,
    locale: 'he-IL',
    deviceScaleFactor: 2
  });
  const page = await ctx.newPage();

  // 1) כניסה לאפליקציה
  await page.goto(HOST, { waitUntil: 'domcontentloaded' });
  await page.waitForSelector('.google-tasks-wrapper', { timeout: 15000 });

  // 2) וודא שיש ≥2 משימות
  await ensureAtLeastTwoTasks(page);

  // 3) צילום: רשימה + FAB
  const listShot = path.join(ART_DIR, '01-list-with-fab.png');
  await page.screenshot({ path: listShot, fullPage: false });

  // 4) JSON: Storage Audit
  const storage = await storageAudit(page);
  fs.writeFileSync(path.join(ART_DIR, 'storage-audit.json'), JSON.stringify(storage, null, 2), 'utf8');

  // 5) Edit: פתיחה + Geometry + צילום
  await openEdit(page);
  const geoEdit = await batchGeometry(page);
  fs.writeFileSync(path.join(ART_DIR, 'geometry-edit.json'), JSON.stringify(geoEdit, null, 2), 'utf8');
  const editShot = path.join(ART_DIR, '02-edit-open.png');
  await page.screenshot({ path: editShot, fullPage: false });

  // 6) סגירת Edit
  await closeEdit(page);

  // 7) Bottom-Sheet: פתיחה + Geometry + צילום
  await openBottomSheet(page);
  const geoSheet = await batchGeometry(page);
  fs.writeFileSync(path.join(ART_DIR, 'geometry-sheet.json'), JSON.stringify(geoSheet, null, 2), 'utf8');
  const sheetShot = path.join(ART_DIR, '03-bottom-sheet.png');
  await page.screenshot({ path: sheetShot, fullPage: false });

  await browser.close();

  // הדפסה לסיכום (שיהיה לך קל להדביק)
  console.log('=== EVIDENCE READY ===');
  console.log('Artifacts folder:', ART_DIR);
  console.log('- storage-audit.json');
  console.log('- geometry-edit.json');
  console.log('- geometry-sheet.json');
  console.log('- 01-list-with-fab.png');
  console.log('- 02-edit-open.png');
  console.log('- 03-bottom-sheet.png');
})().catch(err => {
  console.error('Evidence collection failed:', err);
  process.exit(1);
});
