import { test, expect } from '@playwright/test';

// Test visual/computed differences between .gt-title modifiers and state override.

test.describe('Task Title Modifiers', () => {
  test('primary vs secondary modifier plus completed override', async ({ page }) => {
    await page.goto('/');

    const rows = page.locator('.gt-row');
    await expect(rows.first()).toBeVisible();
    const count = await rows.count();
    test.skip(count < 2, 'Need at least two tasks for modifier comparison');

    const firstRow = rows.nth(0);
    const secondRow = rows.nth(1);

    // Star first to make it primary
    await firstRow.locator('.gt-star').click();
    await expect(firstRow.locator('.gt-star')).toHaveClass(/is-on/);

    const firstTitle = firstRow.locator('.gt-title');
    const secondTitle = secondRow.locator('.gt-title');
    await expect(firstTitle).toHaveClass(/gt-title--primary/);
    await expect(secondTitle).toHaveClass(/gt-title--secondary/);

    const firstStyles = await firstTitle.evaluate(el => ({
      weight: getComputedStyle(el).fontWeight,
      color: getComputedStyle(el).color
    }));
    const secondStyles = await secondTitle.evaluate(el => ({
      weight: getComputedStyle(el).fontWeight,
      color: getComputedStyle(el).color
    }));

    expect(firstStyles.weight).not.toBe(secondStyles.weight);

    // Complete first task to ensure override
    await firstRow.locator('.gt-check').click();
    await expect(firstRow).toHaveClass(/is-completed/);
    const overridden = await firstTitle.evaluate(el => ({
      color: getComputedStyle(el).color,
      decoration: getComputedStyle(el).textDecorationLine || getComputedStyle(el).textDecoration
    }));
    expect(overridden.decoration).toMatch(/line-through/);
  });
});
