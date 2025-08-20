import { test, expect } from '@playwright/test';

// Assumes page lists tasks and meta items present. Adjust selector stubs if needed.

test.describe('Meta clamp expand/collapse', () => {
  test('expands via button and double-click, updates aria and height', async ({ page }) => {
    await page.goto('/');

    // Pick first task row with meta
    const row = page.locator('.gt-row').filter({ has: page.locator('.gt-meta') }).first();
    await expect(row).toBeVisible();

    const clamp = row.locator('.gt-metaClamp').first();
    const expander = row.locator('.gt-expander').first();

    await expect(expander).toHaveAttribute('aria-expanded', 'false');

    // Measure initial height
    const h1 = await clamp.evaluate(el => el.getBoundingClientRect().height);

    // Click expander
    await expander.click();
    await expect(expander).toHaveAttribute('aria-expanded', 'true');

    // Wait a frame for transition end (approx) and measure again
    await page.waitForTimeout(60);
    const h2 = await clamp.evaluate(el => el.getBoundingClientRect().height);
    expect(h2).toBeGreaterThanOrEqual(h1);

    // Collapse via button again
    await expander.click();
    await expect(expander).toHaveAttribute('aria-expanded', 'false');
    await page.waitForTimeout(60);
    const h3 = await clamp.evaluate(el => el.getBoundingClientRect().height);
    expect(h3).toBeLessThanOrEqual(h2);

    // Expand via double-click on clamp
    await clamp.dblclick();
    await expect(expander).toHaveAttribute('aria-expanded', 'true');

    // Double-click again to collapse
    await clamp.dblclick();
    await expect(expander).toHaveAttribute('aria-expanded', 'false');
  });
});
