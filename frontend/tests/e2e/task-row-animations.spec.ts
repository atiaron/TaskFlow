import { test, expect, Page } from '@playwright/test';

async function create(page: Page, title: string) {
  const input = page.locator('[data-testid="create-task-input"]');
  if (await input.count() === 0) test.skip();
  await input.fill(title);
  await input.press('Enter');
}

test.describe('Task Row Micro Animations (Check & Star)', () => {
  test.beforeEach(async ({ page }) => { await page.goto('/'); });

  test('Check adds is-animating class then removes it', async ({ page }) => {
    await create(page, 'Anim Check');
    const row = page.locator('.gt-row').first();
    const check = row.locator('.gt-check');
    await expect(check).toBeVisible();
    await check.click();
    await expect(check).toHaveClass(/is-animating/);
    await page.waitForTimeout(700); // slightly > pulse duration
    const classes = await check.getAttribute('class');
    expect(classes).not.toContain('is-animating');
  });

  test('Star adds is-animating class then removes it', async ({ page }) => {
    await create(page, 'Anim Star');
    const row = page.locator('.gt-row').first();
    const star = row.locator('.gt-star');
    await expect(star).toBeVisible();
    await star.click();
    await expect(star).toHaveClass(/is-animating/);
    await page.waitForTimeout(500); // > star + spark composite duration
    const classes = await star.getAttribute('class');
    expect(classes).not.toContain('is-animating');
  });

  test('Reduced motion disables animation artifacts', async ({ page, context }) => {
    await context.addInitScript(() => {
      const css = '@media (prefers-reduced-motion: reduce){ :root { --anim-check-dur:0s !important; --anim-star-dur:0s !important; --anim-pulse-dur:0s !important; --anim-spark-dur:0s !important; }}';
      const style = document.createElement('style'); style.textContent = css; document.head.appendChild(style);
    });
    await create(page, 'Reduced Motion');
    const check = page.locator('.gt-row').first().locator('.gt-check');
    await check.click();
    await expect(check).toHaveClass(/is-animating/);
    await page.waitForTimeout(50);
    const classes = await check.getAttribute('class');
    expect(classes).not.toContain('is-animating');
  });
});
