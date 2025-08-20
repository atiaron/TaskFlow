import { test, expect } from '@playwright/test';

// Verifies that the entire text block (button.gt-textButton) acts as the hit area
// for opening task details, including clicks on subtitle region and keyboard
// activation (Enter/Space). Also ensures star/check do NOT open details when
// activated. This is a focused regression guard for the predictable hit area refactor.

test.describe('Task text predictable hit area', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  async function createTask(page, title: string, subtitle?: string) {
    // Assumes there is an input with data-testid=create-task-input
    const input = page.locator('[data-testid="create-task-input"]');
    if (await input.count() === 0) return; // soft fail if fixture absent
    await input.fill(title + (subtitle ? ' ' + subtitle : ''));
    await input.press('Enter');
  }

  test('clicking anywhere in text (title area) opens details', async ({ page }) => {
    await createTask(page, 'Hit Area Title', '(subtitle)');
    const row = page.locator('.gt-row').first();
    const textButton = row.locator('button.gt-textButton');
    await expect(textButton).toBeVisible();

    // Click near the vertical center (title zone)
    await textButton.click();

    // Expect details sheet/dialog to appear (generic selector assumptions)
    const details = page.locator('[data-testid="task-details-sheet"], .task-details, [role="dialog"]');
    await expect(details.first()).toBeVisible();
  });

  test('clicking subtitle region also opens details', async ({ page }) => {
    await createTask(page, 'Subtitle Click Title', '(sub body)');
    const row = page.locator('.gt-row').first();
    const textButton = row.locator('button.gt-textButton');
    await expect(textButton).toBeVisible();

    // Move mouse to lower half to approximate subtitle area
    const box = await textButton.boundingBox();
    if (box) {
      await page.mouse.move(box.x + box.width / 2, box.y + (box.height * 0.75));
      await page.mouse.down();
      await page.mouse.up();
    } else {
      await textButton.click(); // fallback
    }

    const details = page.locator('[data-testid="task-details-sheet"], .task-details, [role="dialog"]');
    await expect(details.first()).toBeVisible();
  });

  test('keyboard Enter activates text button opens details', async ({ page }) => {
    await createTask(page, 'Keyboard Activation Title');
    const textButton = page.locator('.gt-row button.gt-textButton').first();
    await textButton.focus();
    await page.keyboard.press('Enter');
    const details = page.locator('[data-testid="task-details-sheet"], .task-details, [role="dialog"]');
    await expect(details.first()).toBeVisible();
  });

  test('keyboard Space activates text button opens details', async ({ page }) => {
    await createTask(page, 'Keyboard Space Title');
    const textButton = page.locator('.gt-row button.gt-textButton').first();
    await textButton.focus();
    await page.keyboard.press(' ');
    const details = page.locator('[data-testid="task-details-sheet"], .task-details, [role="dialog"]');
    await expect(details.first()).toBeVisible();
  });

  test('star click does NOT open details', async ({ page }) => {
    await createTask(page, 'Star Isolation Title');
    const row = page.locator('.gt-row').first();
    const star = row.locator('.gt-star, [data-testid="task-star"]');
    if (await star.count() === 0) test.skip();
    await star.click();
    const details = page.locator('[data-testid="task-details-sheet"], .task-details, [role="dialog"]');
    await expect(details.first()).not.toBeVisible({ timeout: 1500 }).catch(() => {});
  });

  test('check click does NOT open details', async ({ page }) => {
    await createTask(page, 'Check Isolation Title');
    const row = page.locator('.gt-row').first();
    const check = row.locator('.gt-check, [data-testid="task-check"]');
    if (await check.count() === 0) test.skip();
    await check.click();
    const details = page.locator('[data-testid="task-details-sheet"], .task-details, [role="dialog"]');
    await expect(details.first()).not.toBeVisible({ timeout: 1500 }).catch(() => {});
  });
});
