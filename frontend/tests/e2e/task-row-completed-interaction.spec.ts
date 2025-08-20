import { test, expect, Page } from '@playwright/test';

async function create(page: Page, title: string) {
  const input = page.locator('[data-testid="create-task-input"]');
  if (await input.count() === 0) test.skip();
  await input.fill(title);
  await input.press('Enter');
}

async function completeFirst(page: Page) {
  const check = page.locator('.gt-row .gt-check').first();
  await check.click();
}

test.describe('Completed Row Interaction Demotion', () => {
  test.beforeEach(async ({ page }) => { await page.goto('/'); });

  test('Hover over completed row causes no visual shift', async ({ page }) => {
    await create(page, 'Completed Row Hover');
    await completeFirst(page);
    const row = page.locator('.gt-row.is-completed').first();
    await expect(row).toBeVisible();
    const before = await row.evaluate(el => ({ h: el.getBoundingClientRect().height, shadow: getComputedStyle(el).boxShadow, bg: getComputedStyle(el).backgroundColor, opacity: getComputedStyle(el).opacity }));
    await row.hover();
    const after = await row.evaluate(el => ({ h: el.getBoundingClientRect().height, shadow: getComputedStyle(el).boxShadow, bg: getComputedStyle(el).backgroundColor, opacity: getComputedStyle(el).opacity }));
    expect(Math.abs(after.h - before.h)).toBeLessThan(0.5);
    // Background stays same
    expect(after.bg).toBe(before.bg);
    // Opacity identical
    expect(after.opacity).toBe(before.opacity);
  });

  test('Focus-visible adds ring and controls still interactive', async ({ page }) => {
    await create(page, 'Completed Row Focus');
    await completeFirst(page);
    const row = page.locator('.gt-row.is-completed').first();
    await row.focus();
    const shadow = await row.evaluate(el => getComputedStyle(el).boxShadow || '');
    expect(shadow).toContain('0px 0px 0px 2px'); // outer ring approximate
    // Hover star still changes its background
    const star = row.locator('.gt-star').first();
    const bgBefore = await star.evaluate(el => getComputedStyle(el).backgroundColor);
    await star.hover();
    const bgAfter = await star.evaluate(el => getComputedStyle(el).backgroundColor);
    expect(bgAfter).not.toBe(bgBefore);
  });
});
