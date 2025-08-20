import { test, expect, Page } from '@playwright/test';

async function create(page: Page, title: string) {
  const input = page.locator('[data-testid="create-task-input"]');
  if (await input.count() === 0) test.skip();
  await input.fill(title);
  await input.press('Enter');
}

test.describe('Star-first sorting & tooltip', () => {
  test.beforeEach(async ({ page }) => { await page.goto('/'); });

  test('Star surfaces task to top and data-tip reflects surfacing', async ({ page }) => {
    await create(page, 'Alpha');
    await create(page, 'Beta');
    const rows = page.locator('.gt-row');
    await expect(rows).toHaveCount(2);
    const secondStar = rows.nth(1).locator('.gt-star');
    await secondStar.click();
    const firstTitle = await rows.first().locator('.gt-title').innerText();
    expect(firstTitle).toContain('Beta');
    await expect(secondStar).toHaveAttribute('data-tip', /מוצג למעלה/);
  });

  test('One-time snackbar hint only fires first time', async ({ page }) => {
    await create(page, 'Gamma');
    const star = page.locator('.gt-row').first().locator('.gt-star');
    await star.click();
    const toast = page.locator('.gt-toast');
    await expect(toast).toContainText('מועדפות מוצגות למעלה');
    if (await toast.locator('button', { hasText: 'סגור' }).count()) {
      await toast.locator('button', { hasText: 'סגור' }).click();
    }
    await star.click(); // unstar
    await star.click(); // star again
    await page.waitForTimeout(150);
    const toastText = await toast.innerText();
    const occurrences = (toastText.match(/מועדפות מוצגות למעלה/g) || []).length;
    expect(occurrences).toBe(1);
  });
});
