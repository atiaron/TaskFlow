import { test, expect, Page } from '@playwright/test';

/**
 * TaskFlow MVP Acceptance Suite (10 tests)
 * Focus: Container-bound overlays, persistence, RTL, FAB logic.
 */

const STORAGE_KEY = 'taskflow_tasks';
const PROFILE_KEY = 'taskflow_profile';

async function storageAudit(page: Page) {
  return await page.evaluate((keys) => {
    const tasks: any[] = JSON.parse(localStorage.getItem(keys.STORAGE_KEY) || '[]');
    return {
      keys: Object.keys(localStorage).filter(k => /taskflow|tasks/i.test(k)),
      sample: tasks.slice(0,3).map(t => ({ id: t.id, title: t.title, completed: !!t.completed, starred: !!t.starred, order: t.order, updatedAt: t.updatedAt })),
      profileExists: !!localStorage.getItem(keys.PROFILE_KEY)
    };
  }, { STORAGE_KEY, PROFILE_KEY });
}

async function openApp(page: Page) {
  await page.goto('/');
  await page.waitForSelector('.google-tasks-wrapper');
}

async function createTask(page: Page, title: string) {
  await page.locator('.google-tasks-fab').click();
  // New task input variants – fallback to any input to proceed
  const input = page.locator('input.task-title-edit, input[placeholder="כותרת המשימה"], input, textarea').first();
  await input.fill(title);
  await page.keyboard.press('Enter');
}

async function screenshot(page: Page, name: string) {
  await page.screenshot({ path: `test-results/evidence/${name}.png` });
}

// Suite
test.describe('TaskFlow Container-Bound MVP (@Container-Bound)', () => {
  test.beforeEach(async ({ page }) => {
    await page.addInitScript(() => { localStorage.clear(); });
  });

  test('1. First-Run Onboarding', async ({ page }) => {
    await openApp(page);
    const audit = await storageAudit(page);
    expect(audit.profileExists).toBeTruthy();
    expect(audit.keys).toContain(PROFILE_KEY);
    expect(audit.keys).toContain(STORAGE_KEY);
  });

  test('2. Persist Create (No Reload)', async ({ page }) => {
    await openApp(page);
    await createTask(page, 'PersistOne');
    await page.reload();
    await expect(page.locator('.task-row')).toHaveCount(1);
  });

  test('3. Edit Geometry', async ({ page }) => {
    await openApp(page);
    await createTask(page, 'Geom');
    await page.locator('.task-row').first().click();
    await page.locator('.task-edit-screen').waitFor();
    const geo = await page.evaluate(() => {
      const w = document.querySelector('.google-tasks-wrapper'); if(!w) return null;
      const rw = w.getBoundingClientRect();
      const n = document.querySelector('.task-edit-screen'); if(!n) return null;
      const r = n.getBoundingClientRect();
      return { dx: Math.round(r.left-rw.left), dy: Math.round(r.top-rw.top), dw: Math.round(r.width-rw.width), dh: Math.round(r.height-rw.height) };
    });
    expect(geo).not.toBeNull();
    expect(Math.abs(geo!.dx)).toBeLessThanOrEqual(1);
    expect(Math.abs(geo!.dy)).toBeLessThanOrEqual(1);
    expect(Math.abs(geo!.dw)).toBeLessThanOrEqual(1);
    expect(Math.abs(geo!.dh)).toBeLessThanOrEqual(1);
    await screenshot(page, '03-edit-open');
  });

  test('4. Bottom-Sheet Geometry + Lock', async ({ page }) => {
    await openApp(page);
    await createTask(page, 'Sheet');
    // Try generic header menu buttons
    const headerButtons = page.locator('.list-header button, .google-tasks-header button');
    if (await headerButtons.count() > 0) {
      await headerButtons.last().click();
    }
    await page.waitForTimeout(300);
    const geo = await page.evaluate(() => {
      const w=document.querySelector('.google-tasks-wrapper');
      const bw=document.querySelector('.bottom-sheet');
      const ov=document.querySelector('.sheet-overlay');
      const rw=w?.getBoundingClientRect();
      const rs=bw?.getBoundingClientRect();
      return { hasModal:w?.classList.contains('is-modal-open'), sheet:!!bw, overlay:!!ov, dw: Math.round((rs?.width||0)-(rw?.width||0)) };
    });
    expect(geo.sheet).toBeTruthy();
    expect(geo.overlay).toBeTruthy();
    expect(geo.hasModal).toBeTruthy();
    expect(Math.abs(geo.dw)).toBeLessThanOrEqual(1);
    await screenshot(page, '04-bottom-sheet');
  });

  test('5. RTL Row + 56px', async ({ page }) => {
    await openApp(page);
    await createTask(page, 'RowA');
    await createTask(page, 'RowB');
    const heights = await page.$$eval('.task-row', rows => rows.map(r => Math.round(r.getBoundingClientRect().height)));
    expect(heights.every(h => h === 56)).toBeTruthy();
  });

  test('6. Long Title Ellipsis', async ({ page }) => {
    await openApp(page);
    await createTask(page, 'ל'.repeat(140));
    const overflow = await page.$eval('.task-row .task-title', el => window.getComputedStyle(el).textOverflow);
    expect(/ellipsis/i.test(overflow)).toBeTruthy();
  });

  test('7. Toggle + Clear Completed', async ({ page }) => {
    await openApp(page);
    await createTask(page, 'CompleteMe');
    const row = page.locator('.task-row').first();
    // Try checkbox or first button
    await row.locator('input[type="checkbox"], button').first().click();
    const headerButtons = page.locator('.list-header button, .google-tasks-header button');
    if (await headerButtons.count() > 0) { await headerButtons.last().click(); }
    await page.locator('text=מחיקת כל המשימות שהושלמו').click();
    await expect(page.locator('.task-row')).toHaveCount(0);
  });

  test('8. Dirty Guard', async ({ page }) => {
    await openApp(page);
    await createTask(page, 'Dirty');
    await page.locator('.task-row').first().click();
    await page.locator('.task-edit-screen').waitFor();
    await page.locator('.task-title-edit').fill('Dirty*');
    await page.locator('.edit-icon-btn').first().click();
    await expect(page.locator('.edit-confirm-dialog')).toBeVisible();
    await screenshot(page, '08-dirty-guard');
  });

  test('9. FAB Visibility Matrix', async ({ page }) => {
    await openApp(page);
    // Empty state visible
    await expect(page.locator('.google-tasks-fab')).toBeVisible();
    // Enter creation
    await page.locator('.google-tasks-fab').click();
    const hiddenDuringCreate = !(await page.locator('.google-tasks-fab').isVisible());
    expect(hiddenDuringCreate).toBeTruthy();
  });

  test('10. Keys Clean', async ({ page }) => {
    await openApp(page);
    await createTask(page, 'KeyCheck');
    const audit = await storageAudit(page);
    expect(audit.keys.sort()).toEqual([PROFILE_KEY, STORAGE_KEY].sort());
    await screenshot(page, '10-final-state');
  });
});
