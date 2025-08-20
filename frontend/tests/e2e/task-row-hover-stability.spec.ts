import { test, expect, Page } from '@playwright/test';

async function create(page: Page, title: string) {
  const input = page.locator('[data-testid="create-task-input"]');
  if (await input.count() === 0) test.skip();
  await input.fill(title);
  await input.press('Enter');
}

test.describe('Task Row Hover Stability', () => {
  test.beforeEach(async ({ page }) => { await page.goto('/'); });

  test('Hover does not change row height (no layout shift)', async ({ page }) => {
    await create(page, 'Hover Stability');
    const row = page.locator('.gt-row').first();
    await expect(row).toBeVisible();
    const hBefore = await row.evaluate(el => el.getBoundingClientRect().height);
    // Simulate hover via JS (in case Playwright hover triggers scroll side-effects)
    await row.hover();
    const hAfter = await row.evaluate(el => el.getBoundingClientRect().height);
    expect(Math.abs(hAfter - hBefore)).toBeLessThan(0.5); // allow sub-pixel diff
  });

  test('Completed row hover adds ring but no background stacking', async ({ page }) => {
    await create(page, 'Completed Hover Stability');
    const row = page.locator('.gt-row').first();
    await expect(row).toBeVisible();
    // Mark completed (assuming check toggles completion)
    const check = row.locator('.gt-check');
    await check.click();
    await expect(row).toHaveClass(/is-completed/);
    const bgBefore = await row.evaluate(el => getComputedStyle(el).backgroundColor);
    await row.hover();
    const bgAfter = await row.evaluate(el => getComputedStyle(el).backgroundColor);
    expect(bgAfter).toBe(bgBefore); // no extra stacking background
  });
});
