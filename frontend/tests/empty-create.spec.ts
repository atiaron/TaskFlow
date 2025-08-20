import { test, expect } from '@playwright/test';

// Empty state -> create first task smoke test
// Assumes dev server running at PORT 3004.

test('empty → add task appears', async ({ page }) => {
  await page.goto('http://localhost:3004');
  // Open creation (FAB or primary empty-state button). Using aria-label from FAB.
  const addButtons = page.getByRole('button', { name: /הוסף משימה חדשה|הוספת משימה חדשה|הוסף משימה|הוספת משימה/ });
  await addButtons.first().click();
  // Fill input (placeholder Hebrew as implemented)
  await page.getByPlaceholder('הוסף משימה חדשה').fill('בדיקת יצירה ריקה ✅');
  // Click save (✓ submit button)
  await page.getByRole('button', { name: /✓|שמור/ }).click();
  // Expect task visible
  await expect(page.getByText('בדיקת יצירה ריקה ✅')).toBeVisible();
  // Persistence
  const tasks = await page.evaluate(() => JSON.parse(localStorage.getItem('taskflow_tasks') || '[]'));
  expect(tasks[0]?.title).toBe('בדיקת יצירה ריקה ✅');
});
