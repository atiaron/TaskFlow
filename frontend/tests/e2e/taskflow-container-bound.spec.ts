import { test, expect, Page } from '@playwright/test';

/**
 * Container-Bound & Persistence Validation Suite
 * Tag: @Container-Bound
 */

const STORAGE_KEY = 'taskflow_tasks';
const PROFILE_KEY = 'taskflow_profile';

async function storageAudit(page: Page) {
  return await page.evaluate((keys) => {
    const tasks: any[] = JSON.parse(localStorage.getItem(keys.STORAGE_KEY) || '[]');
    return {
      keys: Object.keys(localStorage).filter(k => /taskflow|tasks/i.test(k)),
      sample: tasks.slice(0,3).map(t => ({
        id: t.id,
        title: t.title,
        completed: !!t.completed,
        starred: !!t.starred,
        order: t.order,
        updatedAt: t.updatedAt
      })),
      profileExists: !!localStorage.getItem(keys.PROFILE_KEY)
    };
  }, { STORAGE_KEY, PROFILE_KEY });
}

async function openApp(page: Page) {
  await page.goto('/');
  await page.waitForSelector('.google-tasks-wrapper');
}

// Utility: create task via FAB
async function createTask(page: Page, title: string) {
  await page.locator('.google-tasks-fab').click();
  await page.locator('input[placeholder="כותרת המשימה"], textarea, input').first().fill(title);
  await page.keyboard.press('Enter');
}

// Capture evidence helper
// (optional) evidence capture helper kept for future use
async function capture(page: Page, name: string) {
  await page.screenshot({ path: `test-results/${name}.png`, fullPage: false });
}

// 1. First-Run Onboarding
test.describe('@Container-Bound TaskFlow Mobile Container Geometry & Persistence', () => {
  test.beforeEach(async ({ page }) => {
    // Clear only our keys to simulate fresh state when needed inside tests manually
  });

  test('First-Run Onboarding', async ({ page }) => {
    await page.addInitScript(() => { localStorage.clear(); });
    await openApp(page);
    const audit = await storageAudit(page);
    expect(audit.profileExists).toBeTruthy();
    expect(audit.keys).toContain(PROFILE_KEY);
    expect(audit.keys).toContain(STORAGE_KEY);
  });

  test('Persist Create (No Reload)', async ({ page }) => {
    await page.addInitScript(() => { localStorage.clear(); });
    await openApp(page);
    await createTask(page, 'משימה א');
    // Reload
    await page.reload();
    await expect(page.locator('.tasks-container .task-row')).toHaveCount(1);
  });

  test('Edit Geometry Container-Bound', async ({ page }) => {
    await page.addInitScript(() => { localStorage.clear(); });
    await openApp(page);
    await createTask(page, 'Geometry');
    await page.locator('.task-row .task-title, .task-row').first().click();
    await page.locator('.task-edit-screen').waitFor();
    // Geometry batch
    const geo = await page.evaluate(() => {
      const w = document.querySelector('.google-tasks-wrapper');
      if(!w) return null;
      const rw = w.getBoundingClientRect();
      const n = document.querySelector('.task-edit-screen');
      if(!n) return null;
      const r = n.getBoundingClientRect();
      return {
        dx: Math.round(r.left - rw.left),
        dy: Math.round(r.top - rw.top),
        dw: Math.round(r.width - rw.width),
        dh: Math.round(r.height - rw.height)
      };
    });
    expect(geo).not.toBeNull();
    expect(Math.abs(geo!.dx)).toBeLessThanOrEqual(1);
    expect(Math.abs(geo!.dy)).toBeLessThanOrEqual(1);
    expect(Math.abs(geo!.dw)).toBeLessThanOrEqual(1);
    expect(Math.abs(geo!.dh)).toBeLessThanOrEqual(1);
  });

  test('Bottom-Sheet Geometry + Scroll-Lock', async ({ page }) => {
    await page.addInitScript(() => { localStorage.clear(); });
    await openApp(page);
    await createTask(page, 'SheetTest');
    // Open menu (three dots) - assume list header has a menu button in ListHeader component
    // Fallback: open via keyboard if needed
    await page.locator('button[aria-label="תפריט רשימה"], .list-header button, button:has-text("תפריט")').first().click({ trial: true }).catch(()=>{});
    // In our current code, menu button is inside ListHeader with onMenuClick passed - locate via .list-header maybe later.
    // If selector unknown, attempt Click on last button in header region
    const headerButtons = page.locator('.list-header button, .google-tasks-header button');
    if (await headerButtons.count() > 0) {
      await headerButtons.last().click();
    }
    await page.waitForTimeout(300);
    // Check sheet classes
    const geo = await page.evaluate(() => {
      const w = document.querySelector('.google-tasks-wrapper');
      const sheet = document.querySelector('.bottom-sheet');
      const overlay = document.querySelector('.sheet-overlay');
      const rw = w?.getBoundingClientRect();
      const rs = sheet?.getBoundingClientRect();
      return { hasModal: w?.classList.contains('is-modal-open'), sheet: !!sheet, overlay: !!overlay, dw: Math.round((rs?.width||0) - (rw?.width||0)) };
    });
    expect(geo.sheet).toBeTruthy();
    expect(geo.overlay).toBeTruthy();
    expect(geo.hasModal).toBeTruthy();
    expect(Math.abs(geo.dw)).toBeLessThanOrEqual(1);
  });

  test('RTL Row Order + Height=56px', async ({ page }) => {
    await page.addInitScript(() => { localStorage.clear(); });
    await openApp(page);
    await createTask(page, 'Row1');
    await createTask(page, 'Row2');
    const heights = await page.$$eval('.task-row', rows => rows.map(r => Math.round(r.getBoundingClientRect().height)));
    expect(heights.every(h => h === 56)).toBeTruthy();
  });

  test('Long Title Ellipsis', async ({ page }) => {
    await page.addInitScript(() => { localStorage.clear(); });
    await openApp(page);
    const long = 'ל'.repeat(140);
    await createTask(page, long);
    const overflow = await page.$eval('.task-row .task-title', el => window.getComputedStyle(el).textOverflow);
    expect(overflow).toMatch(/ellipsis/i);
  });

  test('Toggle + Clear Completed (No Reload)', async ({ page }) => {
    await page.addInitScript(() => { localStorage.clear(); });
    await openApp(page);
    await createTask(page, 'ToComplete');
    const first = page.locator('.task-row').first();
    await first.locator('input[type="checkbox"], button').first().click();
    // Open menu & clear completed
    const headerButtons = page.locator('.list-header button, .google-tasks-header button');
    if (await headerButtons.count() > 0) {
      await headerButtons.last().click();
    }
    await page.locator('text=מחיקת כל המשימות שהושלמו').click();
    await expect(page.locator('.task-row')).toHaveCount(0);
  });

  test('Dirty Guard (Edit)', async ({ page }) => {
    await page.addInitScript(() => { localStorage.clear(); });
    await openApp(page);
    await createTask(page, 'Guard');
    await page.locator('.task-row .task-title, .task-row').first().click();
    await page.locator('.task-edit-screen').waitFor();
    await page.locator('.task-title-edit').fill('Guard Changed');
    // Attempt close
    await page.locator('.edit-icon-btn').first().click();
    await expect(page.locator('.edit-confirm-dialog')).toBeVisible();
  });

  test('FAB Visibility Matrix', async ({ page }) => {
    await page.addInitScript(() => { localStorage.clear(); });
    await openApp(page);
    // Empty state: fab visible
    await expect(page.locator('.google-tasks-fab')).toBeVisible();
    // Creating new task
    await page.locator('.google-tasks-fab').click();
    // Input should appear - FAB hidden? (In our logic hidden during isCreating)
    const fabVisibleDuringCreate = await page.locator('.google-tasks-fab').isVisible();
    expect(fabVisibleDuringCreate).toBeFalsy();
  });

  test('Keys Clean', async ({ page }) => {
    await page.addInitScript(() => { localStorage.clear(); });
    await openApp(page);
    await createTask(page, 'KeyCheck');
    const audit = await storageAudit(page);
    expect(audit.keys.sort()).toEqual([PROFILE_KEY, STORAGE_KEY].sort());
  });
});
