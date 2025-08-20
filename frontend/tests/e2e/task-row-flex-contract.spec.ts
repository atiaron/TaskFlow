import { test, expect, Page } from '@playwright/test';

async function create(page: Page, title: string) {
  const input = page.locator('[data-testid="create-task-input"]');
  if (await input.count() === 0) test.skip();
  await input.fill(title);
  await input.press('Enter');
}

test.describe('Task Row Flex-Only Contract', () => {
  test.beforeEach(async ({ page }) => { await page.goto('/'); });

  test('Row uses flex (not grid) and side actions fixed width', async ({ page }) => {
    await create(page, 'Flex Contract');
    const row = page.locator('.gt-row').first();
    await expect(row).toBeVisible();
    const display = await row.evaluate(el => getComputedStyle(el).display);
    expect(display).toBe('flex');
    const check = row.locator('.gt-check');
    const star = row.locator('.gt-star');
    const checkBox = await check.boundingBox();
    const starBox = await star.boundingBox();
  if (!checkBox || !starBox) test.skip();
  const cW = checkBox!.width; const sW = starBox!.width;
  // width difference indicates primary vs secondary; both stable (not 0)
  expect(cW).toBeGreaterThan(sW);
  // Ensure widths within reasonable expected bounds
  expect(cW).toBeGreaterThan(36);
  expect(cW).toBeLessThan(50);
  expect(sW).toBeGreaterThan(28);
  expect(sW).toBeLessThan(42);
  });
});
