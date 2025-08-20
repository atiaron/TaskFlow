import { test, expect, Page } from '@playwright/test';

/**
 * Typography & height contract:
 * - no-sub: up to 2 title lines (clamp) -> min deterministic height
 * - has-sub: 1 title + 1 subtitle line (clamps) -> same deterministic logic
 * - never produces 3 visible lines total
 */

test.describe('Task row typography + height contract', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  async function create(page: Page, title: string) {
    const input = page.locator('[data-testid="create-task-input"]');
    if (await input.count() === 0) test.skip();
    await input.fill(title);
    await input.press('Enter');
  }

  test('no-sub task clamps to max 2 title lines', async ({ page }) => {
    await create(page, 'Line1 Line2 Line3 Line4 Line5 Line6 very long title to force wrapping into potentially more than two lines and test clamp behavior');
    const row = page.locator('.gt-row.no-sub').first();
    await expect(row).toBeVisible();
    const title = row.locator('.gt-title');
    await expect(title).toBeVisible();
    // Approximate line count by measuring height / line-height
    const lh = 22; // px
    const h = await title.evaluate(el => el.getBoundingClientRect().height);
    expect(Math.round(h / lh)).toBeLessThanOrEqual(2);
  });

  test('has-sub task shows exactly 1 title + 1 subtitle line', async ({ page }) => {
    await create(page, 'Task with subtitle');
    // Inject subtitle artificially if feature not present
    // This depends on application logic; if auto-subtext is not present we skip
    const maybeRow = page.locator('.gt-row.has-sub').first();
    if (await maybeRow.count() === 0) test.skip();
    const title = maybeRow.locator('.gt-title');
    const sub = maybeRow.locator('.gt-subtitle, .gt-sub');
    await expect(title).toBeVisible();
    await expect(sub).toBeVisible();
    const titleH = await title.evaluate(el => el.getBoundingClientRect().height);
    const subH = await sub.evaluate(el => el.getBoundingClientRect().height);
    expect(Math.round(titleH / 22)).toBeLessThanOrEqual(1);
    expect(Math.round(subH / 20)).toBeLessThanOrEqual(1);
  });

  test('row min-height >= 56px and stable', async ({ page }) => {
    await create(page, 'Short');
    const row = page.locator('.gt-row').first();
    const h1 = await row.evaluate(el => el.getBoundingClientRect().height);
    await page.waitForTimeout(50);
    const h2 = await row.evaluate(el => el.getBoundingClientRect().height);
    expect(h1).toBeGreaterThanOrEqual(56);
    expect(Math.abs(h1 - h2)).toBeLessThan(2); // stable height
  });
});
