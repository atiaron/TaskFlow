// @ts-check
const { test, expect } = require('@playwright/test');

/**
 * TaskFlow Container-Bound & Functional Tests
 * Mirrors manual test plan (Tests 1-12) focusing on geometry, RTL, actions, storage.
 */

// Utility: ensure wrapper exists
async function ensureWrapper(page) {
  await expect(page.locator('.google-tasks-wrapper')).toBeVisible();
}

// Utility: add a task via FAB inline creation flow
async function addTask(page, title) {
  const fab = page.locator('.google-tasks-fab, .fab').first();
  await fab.click();
  // NewTaskInput input appears (heuristic: input[placeholder])
  const input = page.locator('input[placeholder="משימה חדשה"], input.task-edit-input').first();
  await input.fill(title);
  await input.press('Enter');
}

// Utility: get tasks from storage
async function readStoredTasks(page) {
  return await page.evaluate(() => JSON.parse(localStorage.getItem('taskflow_tasks') || '[]'));
}

// Utility: open bottom sheet (list menu)
async function openBottomSheet(page) {
  await page.locator('.list-header button[aria-label="תפריט רשימה"], .list-header-icon-button[aria-label="תפריט רשימה"]').click();
  await expect(page.locator('.bottom-sheet')).toBeVisible();
}

// Utility: open edit screen by clicking task text span
async function openEditScreen(page) {
  const row = page.locator('.task-row').first();
  await row.locator('.task-text').click();
  await expect(page.locator('.task-edit-screen')).toBeVisible();
}

test.describe('Container-Bound Geometry & Functional', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await ensureWrapper(page);
  });

  test('Test1: Edit screen geometry matches wrapper', async ({ page }) => {
    // Ensure at least one task (add if empty)
    const initial = await readStoredTasks(page);
    if (initial.length === 0) {
      await addTask(page, 'משימת בסיס');
    }
    await openEditScreen(page);
    const result = await page.evaluate(() => {
      const wrap=document.querySelector('.google-tasks-wrapper');
      const rw=wrap.getBoundingClientRect();
      const n=document.querySelector('.task-edit-screen');
      const r=n.getBoundingClientRect();
      return {dx:Math.round(r.left-rw.left), dw:Math.round(r.width-rw.width), dy:Math.round(r.top-rw.top), dh:Math.round(r.height-rw.height)};
    });
    for (const k of ['dx','dw','dy','dh']) {
      expect(Math.abs(result[k])).toBeLessThanOrEqual(1);
    }
  });

  test('Test2: Bottom sheet container-bound & scroll lock', async ({ page }) => {
    // Guarantee at least one task
    if ((await readStoredTasks(page)).length === 0) {
      await addTask(page, 'משימה לתפריט');
    }
    await openBottomSheet(page);
    // Check parent
    const parentsOk = await page.evaluate(() => {
      const wrap=document.querySelector('.google-tasks-wrapper');
      const overlay=document.querySelector('.sheet-overlay');
      const sheet=document.querySelector('.bottom-sheet');
      if(!wrap) return false;
      return overlay?.parentElement===wrap && sheet?.parentElement===wrap;
    });
    expect(parentsOk).toBeTruthy();
    await expect(page.locator('.google-tasks-wrapper.is-modal-open')).toBeVisible();
    // Close
    await page.locator('.sheet-close-button').click();
    await expect(page.locator('.bottom-sheet')).toHaveCount(0);
  });

  test('Test3: RTL row order & 56px height', async ({ page }) => {
    if ((await readStoredTasks(page)).length < 2) {
      await addTask(page, 'אחת');
      await addTask(page, 'שתיים');
    }
    const firstRow = page.locator('.task-row').first();
    const height = await firstRow.evaluate(el => Math.round(getComputedStyle(el).height.replace('px','')));
    expect(height).toBe(56);
    // Order: star(left RTL) -> text -> checkbox(right). We check existence & relative positions.
    const positions = await firstRow.evaluate(el => {
      const star = el.querySelector('.task-star')?.getBoundingClientRect().left;
      const text = el.querySelector('.task-text')?.getBoundingClientRect().left;
      const cb = el.querySelector('.task-checkbox')?.getBoundingClientRect().left;
      return { star, text, cb };
    });
    expect(positions.star).toBeLessThan(positions.text);
    expect(positions.text).toBeLessThan(positions.cb);
  });

  test('Test4: Long title ellipsis', async ({ page }) => {
    const longTitle = 'כ'.repeat(140);
    await addTask(page, longTitle);
    const span = page.locator('.task-row .task-text').first();
    const hasEllipsis = await span.evaluate(el => {
      const cs = getComputedStyle(el);
      return cs.whiteSpace==='nowrap' && cs.overflow==='hidden' && cs.textOverflow==='ellipsis';
    });
    expect(hasEllipsis).toBeTruthy();
  });

  test('Test5: FAB visibility states', async ({ page }) => {
    // Empty state scenario: if no tasks, wrapper should still have a FAB
  const tasksBefore = await readStoredTasks(page);
  const emptyFabVisible = tasksBefore.length === 0 ? await page.locator('.google-tasks-fab').isVisible() : true;
  const listFabVisible = tasksBefore.length > 0 ? await page.locator('.fab').isVisible() : true;
  expect(emptyFabVisible).toBeTruthy();
  expect(listFabVisible).toBeTruthy();
    // Start creation
    await addTask(page, 'FAB מצב'); // This uses FAB -> input -> Enter
    // After addition, FAB should still be visible (not while input open)
    await expect(page.locator('.fab')).toBeVisible();
  });

  test('Test6: Create in-place persists (no reload detection heuristic)', async ({ page }) => {
    const pre = await readStoredTasks(page);
    await addTask(page, 'לקנות חלב');
    const post = await readStoredTasks(page);
    expect(post.length).toBeGreaterThan(pre.length);
  expect(post.some(function(/** @type {{title:string}} */ t){ return t.title === 'לקנות חלב'; })).toBeTruthy();
  });

  test('Test7: Clear completed via bottom sheet', async ({ page }) => {
    // Ensure at least one completed
    if ((await readStoredTasks(page)).length < 2) {
      await addTask(page, 'סימון 1');
      await addTask(page, 'סימון 2');
    }
    // Mark first incomplete as completed
    const firstCheckbox = page.locator('.task-row .task-checkbox').first();
    await firstCheckbox.click();
    await openBottomSheet(page);
    await page.locator('button:has-text("מחיקת כל המשימות שהושלמו")').click();
    // Sheet should close
    await expect(page.locator('.bottom-sheet')).toHaveCount(0);
    const tasks = await readStoredTasks(page);
  expect(tasks.every(function(/** @type {{completed:boolean}} */ t){ return !t.completed; })).toBeTruthy();
  });

  test('Test8: Edit dirty guard dialog', async ({ page }) => {
    if ((await readStoredTasks(page)).length === 0) {
      await addTask(page, 'בדיקה');
    }
    await openEditScreen(page);
    const input = page.locator('.task-title-edit');
    await input.fill('בדיקה*');
    // Attempt close
    await page.locator('.edit-icon-btn').first().click(); // back button
    await expect(page.locator('.edit-confirm-dialog')).toBeVisible();
    // Cancel
    await page.locator('.confirm-cancel').click();
    await expect(page.locator('.task-edit-screen')).toBeVisible();
    // Try again and confirm discard
    await page.locator('.edit-icon-btn').first().click();
    await page.locator('.confirm-close').click();
    await expect(page.locator('.task-edit-screen')).toHaveCount(0);
  });

  test('Test9: Rename placeholder & delete default list disabled', async ({ page }) => {
    if ((await readStoredTasks(page)).length === 0) {
      await addTask(page, 'משימה לרשימה');
    }
    await openBottomSheet(page);
    await page.locator('button:has-text("שינוי השם של הרשימה")').click();
    // prompt cannot be directly asserted; just ensure sheet closed
    await expect(page.locator('.bottom-sheet')).toHaveCount(0);
    // Re-open and check delete list disabled state
    await openBottomSheet(page);
    const deleteBtn = page.locator('button:has-text("מחק רשימה")');
    await expect(deleteBtn).toBeDisabled();
  });

  test('Test10: Persistence across reload', async ({ page }) => {
    const title = 'התמדה';
    await addTask(page, title);
    // Complete it
    await page.locator('.task-row .task-checkbox').first().click();
    await page.reload();
    const stored = await readStoredTasks(page);
  const found = stored.find(function(/** @type {{title:string}} */ t){ return t.title === title; });
    expect(found).toBeTruthy();
    expect(typeof found.completed).toBe('boolean');
  });

  test('Test11: Storage keys audit single key', async ({ page }) => {
  const audit = await page.evaluate(() => {
      const KEY='taskflow_tasks';
      return {
    keys:Object.keys(localStorage).filter(k=>/tasks/i.test(k)),
  sample:(JSON.parse(localStorage.getItem(KEY)||'[]')||[]).slice(0,3).map(function(/** @type {{id:string,title:string,completed:boolean,starred:boolean}} */ t){return {id:t.id,title:t.title,completed:t.completed,starred:t.starred};})
      };
    });
    expect(audit.keys).toEqual(['taskflow_tasks']);
  const firstHasTitle = audit.sample.length===0 ? true : Object.prototype.hasOwnProperty.call(audit.sample[0], 'title');
  expect(firstHasTitle).toBeTruthy();
  });

  test('Test12: Overlay batch geometry script', async ({ page }) => {
    if ((await readStoredTasks(page)).length === 0) {
      await addTask(page, 'גיאומטריה');
    }
    // Open edit then capture geometry (bottom sheet may be absent -> found:false)
    await openEditScreen(page);
    const batch = await page.evaluate(() => {
      const wrap=document.querySelector('.google-tasks-wrapper'); if(!wrap) return 'wrapper not found';
      const rw=wrap.getBoundingClientRect();
      return ['.task-edit-screen','.bottom-sheet'].map(s=>{
        const n=document.querySelector(s); if(!n) return {sel:s, found:false};
        const r=n.getBoundingClientRect();
        return {sel:s, found:true, dx:Math.round(r.left-rw.left), dw:Math.round(r.width-rw.width), dy:Math.round(r.top-rw.top), dh:Math.round(r.height-rw.height)};
      });
    });
    for (const row of batch) {
      if (typeof row === 'string') continue; // safeguard
      const dxOk = !row.found || Math.abs((row.dx||0)) <= 1;
      const dwOk = !row.found || Math.abs((row.dw||0)) <= 1;
      expect(dxOk).toBeTruthy();
      expect(dwOk).toBeTruthy();
    }
  });
});
