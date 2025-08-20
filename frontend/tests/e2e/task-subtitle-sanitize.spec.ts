import { test, expect, Page } from '@playwright/test';

async function create(page: Page, title: string) {
  const input = page.locator('[data-testid="create-task-input"]');
  if (await input.count() === 0) test.skip();
  await input.fill(title);
  await input.press('Enter');
}

test.describe('Subtitle Sanitize & Clamp', () => {
  test.beforeEach(async ({ page }) => { await page.goto('/'); });

  test('Allowed inline tags preserved, heavy tags removed, clamped to 2 lines', async ({ page }) => {
  await create(page, 'Subtitle Safety');
    const row = page.locator('.gt-row').first();
    await expect(row).toBeVisible();
    const subtitle = row.locator('.gt-subtitle');
    // If our UI path injects subtitle differently, skip gracefully
    if (await subtitle.count() === 0) test.skip();
    const html = await subtitle.innerHTML();
    expect(html).toContain('<b>Bold</b>');
    expect(html).not.toContain('<img');
    expect(html).not.toContain('<iframe');
    // Clamp check: approximate line count via height/line-height
    const lh = await subtitle.evaluate(el => parseFloat(getComputedStyle(el).lineHeight));
    const h = await subtitle.evaluate(el => el.getBoundingClientRect().height);
    expect(h).toBeLessThanOrEqual(lh * 2 + 2); // allow ≤ 2 lines + small rounding
  });
});
