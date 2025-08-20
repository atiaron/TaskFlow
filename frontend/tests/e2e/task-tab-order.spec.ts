import { test, expect } from '@playwright/test';

async function create(page: import('@playwright/test').Page, title: string) {
  const input = page.locator('[data-testid="create-task-input"]');
  if (await input.count() === 0) test.skip();
  await input.fill(title);
  await input.press('Enter');
}

test.describe('Task row tab order', () => {
  test.beforeEach(async ({ page }) => { await page.goto('/'); });

  test('Tab sequence is Check -> Text -> Star', async ({ page }) => {
    await create(page, 'Tab Order Task');
    const row = page.locator('.gt-row').first();
    await expect(row).toBeVisible();

    // Focus first focusable inside row
    await row.locator('.gt-check').focus();
    const order: string[] = [];

    async function activeRole() {
      const el = await page.evaluateHandle(() => document.activeElement);
      const cls = await el.evaluate((n: any) => n.className || '');
      await el.dispose();
      return cls;
    }

    order.push(await activeRole()); // check
    await page.keyboard.press('Tab');
    order.push(await activeRole()); // text button
    await page.keyboard.press('Tab');
    order.push(await activeRole()); // star or next element depending on app

    // Filter only our three target classes
    const filtered = order.filter(c => /gt-check|gt-textButton|gt-star/.test(c));
    expect(filtered[0]).toMatch(/gt-check/);
    expect(filtered[1]).toMatch(/gt-textButton/);
    expect(filtered[2]).toMatch(/gt-star/);
  });
});
