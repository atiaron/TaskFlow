import { test, expect } from '@playwright/test';

// Assumes app served at baseURL (configured in playwright config)

test('clear completed removes only completed tasks and shows snackbar', async ({ page }) => {
  await page.goto('/');

  // helper create task
  const createTask = async (title: string) => {
    await page.getByRole('button', { name: 'הוספת משימה חדשה' }).click();
    const input = page.locator('.gt-compose-input');
    await input.fill(title);
    await page.getByRole('button', { name: 'שמירה' }).click();
  };

  await createTask('Task A');
  await createTask('Task B');
  await createTask('Task C');

  // mark two as completed (click check button inside rows 0 and 1)
  const rows = page.locator('.gt-row');
  await rows.nth(0).locator('.gt-check').click();
  await rows.nth(1).locator('.gt-check').click();

  // open list menu
  await page.getByRole('button', { name: 'תפריט רשימה' }).click();
  await page.getByRole('button', { name: 'נקה משימות שהושלמו' }).click();

  // assert only one row remains not completed
  const remaining = await page.locator('.gt-row').count();
  expect(remaining).toBe(1);

  // check localStorage tasks contain no completed true
  const hasCompleted = await page.evaluate(() => {
    try { const tasks = JSON.parse(localStorage.getItem('taskflow_tasks') || '[]'); return tasks.some(t => t.completed); } catch { return true; }
  });
  expect(hasCompleted).toBe(false);

  // snackbar text
  await expect(page.locator('.gt-toast')).toHaveText(/נוקו 2 משימות שהושלמו/);
  // wait for disappearance ~4s
  await page.waitForTimeout(4200);
  await expect(page.locator('.gt-toast')).toBeHidden({ timeout: 1000 });
});
