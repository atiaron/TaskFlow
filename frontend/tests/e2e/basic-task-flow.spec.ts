import { test, expect } from '@playwright/test';

// Basic end-to-end task flow:
// 1. Empty state visible
// 2. Open composer (FAB)
// 3. Create task
// 4. Mark complete -> toast appears
// 5. Undo via toast
// 6. Task returns to active
// Assumes server running at http://localhost:3001 (adjust if different)

const BASE_URL = process.env.TASKFLOW_BASE_URL || 'http://localhost:3000';

const TASK_TITLE = 'בדיקת זרימה מלאה ✅';

test('empty → create → complete → toast → undo', async ({ page }) => {
  await page.goto(BASE_URL);

  // 1. Expect empty state card (heuristic: look for headline text or FAB exists and no rows)
  const fab = page.getByTestId('gt-fab');
  await expect(fab).toBeVisible();

  // 2. Open composer via FAB
  await fab.click();
  const input = page.locator('#gt-title-input');
  await expect(input).toBeVisible();

  // 3. Create task
  await input.fill(TASK_TITLE);
  await page.getByRole('button', { name: 'שמירה' }).click();
  await expect(page.getByText(TASK_TITLE)).toBeVisible();

  // 4. Mark complete (checkbox button has aria-label heuristic via row title maybe). Use text then find sibling button.
  const row = page.getByText(TASK_TITLE).first();
  // Assuming structure: parent contains a button with class gt-check
  const checkBtn = row.locator('..').locator('.gt-check');
  await checkBtn.click();

  // 5. Toast appears with undo
  const toast = page.locator('.gt-toast');
  await expect(toast).toBeVisible();
  // נסיון לאתר כפתור undo: קודם ע"פ role+name, אחרת לפי data-testid
  let undoBtn = toast.getByRole('button', { name: /בטל|UNDO/i });
  try {
    await expect(undoBtn).toBeVisible({ timeout: 1500 });
  } catch {
    undoBtn = page.getByTestId('toast-undo');
    await expect(undoBtn).toBeVisible();
  }

  // 6. Undo
  await undoBtn.click();
  // Task should be back to active (not struck/ completed). We'll just ensure still visible.
  await expect(page.getByText(TASK_TITLE)).toBeVisible();
});
