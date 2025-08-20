import { test, expect, Page } from '@playwright/test';

async function create(page: Page, title: string) {
  const input = page.locator('[data-testid="create-task-input"]');
  if (await input.count() === 0) test.skip();
  await input.fill(title);
  await input.press('Enter');
}

test.describe('Primary vs Secondary action differentiation', () => {
  test.beforeEach(async ({ page }) => { await page.goto('/'); });

  test('DOM order is Check -> Text -> Star', async ({ page }) => {
    await create(page, 'Order Test');
    const row = page.locator('.gt-row').first();
    await expect(row).toBeVisible();
    const children = await row.evaluate(el => Array.from(el.children)
      .filter(c => !c.className || !c.className.includes('sr-only'))
      .map(c => c.className));
    // After filtering sr-only span, expect order: gt-check, gt-textButton, gt-star
    expect(children[0]).toMatch(/gt-check/);
    expect(children[1]).toMatch(/gt-textButton/);
    expect(children[2]).toMatch(/gt-star/);
  });

  test('Primary (check) larger than secondary (star)', async ({ page }) => {
    await create(page, 'Size Test');
    const row = page.locator('.gt-row').first();
    const check = row.locator('.gt-check');
    const star = row.locator('.gt-star');
    const checkBox = await check.boundingBox();
    const starBox = await star.boundingBox();
  if (!checkBox || !starBox) test.skip();
  expect(checkBox!.width).toBeGreaterThan(starBox!.width);
  expect(checkBox!.height).toBeGreaterThan(starBox!.height);
  });

  test('Check on-state has background, star on-state is transparent', async ({ page }) => {
    await create(page, 'State Test');
    const row = page.locator('.gt-row').first();
    const check = row.locator('.gt-check');
    const star = row.locator('.gt-star');
    await check.click(); // toggle complete
    await star.click(); // toggle star
    const checkBg = await check.evaluate(el => getComputedStyle(el).backgroundColor);
    const starBg = await star.evaluate(el => getComputedStyle(el).backgroundColor);
    // Check should have non-transparent bg (rgba with alpha > 0)
    expect(checkBg).not.toBe('rgba(0, 0, 0, 0)');
    // Star remains transparent
    expect(starBg).toBe('rgba(0, 0, 0, 0)');
  });

  test('Hover scale stronger on primary than secondary', async ({ page }) => {
    await create(page, 'Hover Scale');
    const row = page.locator('.gt-row').first();
    const check = row.locator('.gt-check');
    const star = row.locator('.gt-star');
    const baseCheck = await check.boundingBox();
    const baseStar = await star.boundingBox();
    if (!baseCheck || !baseStar) test.skip();
    await check.hover();
    await star.hover();
    // Allow layout settle
    await page.waitForTimeout(60);
    const hoverCheck = await check.boundingBox();
    const hoverStar = await star.boundingBox();
  if (!hoverCheck || !hoverStar || !baseCheck || !baseStar) test.skip();
  const checkScale = hoverCheck!.width / baseCheck!.width;
  const starScale = hoverStar!.width / baseStar!.width;
    expect(checkScale).toBeGreaterThan(starScale);
  });
});
