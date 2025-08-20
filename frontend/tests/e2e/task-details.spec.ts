import { test, expect } from '@playwright/test';

test('task details sheet opens, sets date/time and returns focus', async ({ page }) => {
  await page.goto('/');

  // create a task
  await page.getByRole('button', { name: 'הוספת משימה חדשה' }).click();
  const input = page.locator('.gt-compose-input');
  await input.fill('Details Task');
  await page.getByRole('button', { name: 'שמירה' }).click();

  const titleButton = page.locator('.gt-row .gt-title').first();
  await titleButton.click();

  // sheet visible and has dialog role
  const sheet = page.locator('.gt-details.gt-sheet');
  await expect(sheet).toBeVisible();
  await expect(sheet).toHaveAttribute('role', 'dialog');

  // pick date/time (use today plus 1 day to avoid same-day formatting differences; fallback to today if month end)
  const today = new Date();
  const plus1 = new Date(today.getTime() + 24*3600*1000);
  const ds = plus1.toISOString().slice(0,10);
  await sheet.locator('input[type=date]').fill(ds);
  await sheet.locator('input[type=time]').fill('13:30');

  // close sheet
  await sheet.getByRole('button', { name: 'ביטול' }).click();

  // focus returned to row title button
  await expect(titleButton).toBeFocused();

  // subtext updated (loosely check for hour or date fragment)
  const row = page.locator('.gt-row').first();
  await expect(row).toContainText(/13:30/);
});
